import { NextRequest, NextResponse } from 'next/server';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import { distanceInMeters, isTraditionalPlace } from '@/features/map/utils/geo';
import { toHttps, formatRegionAddress } from '@/features/map/utils/formatters';
import { HanokDetailService } from '@/features/hanok-archive/services/hanokDetail.service';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';
import type {
  DistanceBand,
  Evidence,
  JourneyBoard,
  JourneyCandidate,
  JourneyLeg,
  PlaceResource,
  RegionResource,
} from '@/features/journey-curator/types/exploration.types';
import type {
  HanokDoganEntry,
  NearbyAudioStory,
  NearbyFoodPlace,
} from '@/features/journey-curator/types/enrichment.types';

/**
 * 이야기길 새 계약(JourneyBoard) 탐색 — 실데이터 버전.
 *
 * 기존 `/api/journey-curator`(옛 BentoJourneyPlan, 온기 카드 포함)는 건드리지 않는다.
 * 여기는 같은 재료(TourAPI 실제 장소, Gemini)를 새 계약(evidence·거리band·근거 참조)으로
 * 다시 조립한 별도 route다.
 *
 * ponytail: 진짜 Spring+FastAPI의 run/poll/cancel 상태 머신 대신, 이 route가 검색부터
 * 후보 확정까지 한 요청 안에서 동기로 끝낸다. run 취소·재접속·20초 타임아웃 UX가
 * 필요해지면 그때 폴링 상태를 얹는다 — 지금은 화면 쪽에 그 state machine이 아직
 * 안 붙어 있어서 미리 만들 이유가 없다.
 */

function cleanKoreanTerm(term: string): string {
  return term
    .replace(/(?:에서|으로|로는|에는|에게|부터|까지|의|에|을|를|과|와|도|은|는|이|가|투어|여행|코스|가볼만한곳|주변|근처|맛집|명소)$/g, '')
    .trim();
}

function bandFor(meters: number): DistanceBand {
  if (meters < 300) return 'NEAR';
  if (meters < 800) return 'MEDIUM';
  return 'FAR';
}

interface RawSpot {
  id: string;
  title: string;
  addr: string;
  lat: number;
  lng: number;
  image: string | null;
  category: string;
}

interface QueryAnalysis {
  region: string;
  theme: string;
  searchKeywords: string[];
  hasExactMatch: boolean;
  alternativeNotice?: string | null;
}

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-flash-latest'];

async function callGemini(apiKey: string, modelName: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Gemini API error [${res.status}]`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

/**
 * Gemini AI를 통해 사용자의 자연어 검색어를 분석:
 * 1. 핵심 지역명 (남해, 대전, 종로 등)
 * 2. 요청 테마 (한옥마을, 빵 투어, 고즈넉한 쉼 등)
 * 3. 해당 지역에 사용자가 찾는 장소 유형이 실제로 존재하는지 여부 (예: 남해에는 공식 한옥마을이 없음)
 * 4. 일치하지 않는 경우 '관련 답이 없어 비슷한 대체 명소를 추천했습니다'라는 솔직한 안내 문구 생성
 * 5. TourAPI 최적 검색 키워드 2~4개 생성
 */
async function analyzeQueryWithGemini(query: string, regionCode?: string | null): Promise<QueryAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const words = query.replace(/[^\w가-힣\s]/g, ' ').trim().split(/\s+/).map(cleanKoreanTerm).filter((w) => w.length >= 2);
    const region = words[0] || '한옥';
    return {
      region,
      theme: words.slice(1).join(' ') || '전통 한옥',
      searchKeywords: words.length > 0 ? words : ['한옥'],
      hasExactMatch: true,
      alternativeNotice: null,
    };
  }

  const prompt = `당신은 대한민국 문화유산 및 여행 전문 AI입니다.
사용자 검색어: "${query}"

1. 사용자가 가고자 하는 핵심 지역(시/군/구/명소)을 추출하세요. (예: "남해", "대전", "종로", "경주", "전주" 등)
2. 사용자가 원하는 테마/분야(예: "한옥마을", "빵 투어", "고즈넉한 쉼", "사찰" 등)를 파악하세요.
3. 해당 지역에 사용자가 찾는 구체적인 장소 유형(예: 남해에 한옥마을이 실제로 있는지 여부)이 실제로 존재하는지 판단하세요.
   - 만약 남해처럼 지정된 공식 '한옥마을'이 없는 지역에서 '한옥마을'을 요청한 경우: hasExactMatch는 false로 하고, alternativeNotice에 "해당 지역에는 공식 한옥마을이 없어, 남해의 정취를 느낄 수 있는 대표 전통·로컬 명소와 인근 장소들로 추천해 드려요." 같은 친절하고 솔직한 안내 문구를 적어주세요.
   - 실제로 있는 경우(예: 전주 한옥마을, 안동 하회마을, 대전 빵투어 등): hasExactMatch는 true로 하고 alternativeNotice는 null로 합니다.
4. 한국관광공사 TourAPI에서 검색할 최적의 2~4개 검색 키워드(searchKeywords)를 생성하세요. (예: ["남해", "남해 전통", "남해 가옥"] 또는 ["대전 빵", "성심당", "대전"])

반드시 아래 JSON 형식으로만 답하세요:
{
  "region": "추출된 지역명",
  "theme": "테마/컨셉",
  "hasExactMatch": true/false,
  "alternativeNotice": "안내 문구 또는 null",
  "searchKeywords": ["키워드1", "키워드2", "키워드3"]
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const raw = await callGemini(apiKey, model, prompt);
      const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const parsed = JSON.parse(cleaned);
      if (parsed?.region && Array.isArray(parsed?.searchKeywords)) {
        return {
          region: parsed.region,
          theme: parsed.theme || '전통 여행',
          searchKeywords: parsed.searchKeywords.filter((k: any) => typeof k === 'string' && k.trim().length > 0),
          hasExactMatch: Boolean(parsed.hasExactMatch),
          alternativeNotice: parsed.alternativeNotice || null,
        };
      }
    } catch {
      continue;
    }
  }

  const words = query.replace(/[^\w가-힣\s]/g, ' ').trim().split(/\s+/).map(cleanKoreanTerm).filter((w) => w.length >= 2);
  const region = words[0] || '한옥';
  return {
    region,
    theme: words.slice(1).join(' ') || '전통 한옥',
    searchKeywords: words.length > 0 ? words : ['한옥'],
    hasExactMatch: true,
    alternativeNotice: null,
  };
}

async function searchRealSpots(keyword: string, isFoodQuery: boolean = false): Promise<RawSpot[]> {
  // 우선 관광지/문화재(contentTypeId 12) 중심으로 검색하고 없으면 전체 검색
  let res = await TourApiClient.get('searchKeyword2', {
    keyword,
    arrange: 'Q',
    numOfRows: 15,
    ...(!isFoodQuery ? { contentTypeId: 12 } : {}),
  }).catch(() => null);

  let raw = res?.response?.body?.items?.item;
  if (!raw && !isFoodQuery) {
    res = await TourApiClient.get('searchKeyword2', {
      keyword,
      arrange: 'Q',
      numOfRows: 15,
    }).catch(() => null);
    raw = res?.response?.body?.items?.item;
  }

  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];

  return rows
    .map((row): RawSpot | null => {
      const title = String(row.title ?? '').trim();
      const lat = Number(row.mapy);
      const lng = Number(row.mapx);
      const contentTypeId = Number(row.contenttypeid);
      // 음식/빵 요청이 아닌데 단순 식당(39)인 경우 관광 명소에서 제외
      if (!isFoodQuery && contentTypeId === 39) return null;
      if (!title || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const addr = String(row.addr1 ?? '').trim();
      const cat3 = String(row.cat3 ?? '');
      return {
        id: String(row.contentid),
        title,
        addr,
        lat,
        lng,
        image: toHttps(String(row.firstimage || row.firstimage2 || '')),
        category: isTraditionalPlace(title, cat3)
          ? '전통 한옥·문화재'
          : title.includes('시장')
            ? '전통시장'
            : '관광지',
      };
    })
    .filter((s): s is RawSpot => s !== null);
}

async function searchRealSpotsMultiKeywords(keywords: string[], isFoodQuery: boolean = false): Promise<RawSpot[]> {
  const seen = new Set<string>();
  const combined: RawSpot[] = [];

  for (const kw of keywords) {
    const spots = await searchRealSpots(kw, isFoodQuery);
    for (const spot of spots) {
      if (!seen.has(spot.id)) {
        seen.add(spot.id);
        combined.push(spot);
      }
    }
    if (combined.length >= 8) break;
  }

  // 여전히 비어있다면 한옥 기본 키워드 검색
  if (combined.length === 0) {
    const fallbackSpots = await searchRealSpots('한옥', isFoodQuery);
    for (const spot of fallbackSpots) {
      if (!seen.has(spot.id)) {
        seen.add(spot.id);
        combined.push(spot);
      }
    }
  }

  return combined;
}

interface GeminiPick {
  id: string;
  reason: string;
}

async function pickCandidates(
  query: string,
  analysis: QueryAnalysis,
  spots: RawSpot[],
  pinnedSpots: RawSpot[],
  slotsNeeded: number,
): Promise<{ title: string; querySummary: string; picks: GeminiPick[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || slotsNeeded <= 0) return null;

  const allowlist = spots
    .slice(0, 15)
    .map((s, i) => `${i + 1}. id=${s.id} | ${s.title} | ${s.category} | ${s.addr}`)
    .join('\n');

  const pinnedNote =
    pinnedSpots.length > 0
      ? `사용자가 이미 고정해 반드시 유지되는 장소(당신이 고를 필요 없음, 그대로 유지됨):\n${pinnedSpots
          .map((s) => `- ${s.title}`)
          .join('\n')}\n\n`
      : '';

  const fallbackInstruction = !analysis.hasExactMatch && analysis.alternativeNotice
    ? `\n[안내 사항]\n${analysis.alternativeNotice}\n목록에 요청과 100% 동일한 특정 시설이 없다면 억지로 속이지 말고, 사용자 요청과 가장 잘 어울리는 대체 추천임을 솔직하게 이유에 적어주세요.\n`
    : '';

  const prompt = `당신은 온마루 '이야기길'의 정직하고 전문적인 AI 큐레이터입니다. 아래 [실제 후보 목록]에 있는 장소 중에서만 골라야 합니다.
새 장소를 지어내거나, 목록에 없는 id를 반환하면 안 됩니다.
${fallbackInstruction}
[사용자 요청]
"${query}" (분석된 지역: ${analysis.region}, 테마: ${analysis.theme})

${pinnedNote}[실제 후보 목록]
${allowlist}

사용자 요청과 가장 잘 맞는 장소를 정확히 ${slotsNeeded}개 골라 이야기로 이어지는 방문 순서대로 배치하세요.
대체 추천인 경우 querySummary에 "${analysis.alternativeNotice || '관련 장소가 없어 비슷한 장소를 추천했어요.'}"라고 솔직하게 안내하세요.

반드시 아래 JSON 형식으로만 답하세요:
{
  "title": "여정 제목 (짧고 시적으로)",
  "querySummary": "사용자 요청 요약 및 안내 (대체 추천인 경우 솔직한 안내 포함)",
  "picks": [{ "id": "목록의 id 값 그대로", "reason": "이 장소를 추천하는 솔직한 이유 1문장" }]
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const raw = await callGemini(apiKey, model, prompt);
      const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed?.picks)) return parsed;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * TourAPI 결과가 없거나 특별한 주제 요청 시 Gemini가 직접 추천 코스를 생성
 */
async function generateGeminiDirectSpots(
  query: string,
  analysis: QueryAnalysis,
): Promise<{ title: string; querySummary: string; regionTitle: string; spots: { spot: RawSpot; reason: string }[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const notice = analysis.alternativeNotice ? `\n[참고: ${analysis.alternativeNotice}]` : '';

  const prompt = `당신은 대한민국 문화유산 및 한옥/로컬 여행 전문 AI 큐레이터 '온마루'입니다.
사용자 요청: "${query}" (지역: ${analysis.region}, 테마: ${analysis.theme})${notice}

위 요청에 맞춰 대한민국에 실제로 존재하는 3곳의 명소/문화공간 코스를 추천해주세요.
만약 요청된 지역(예: 남해)에 한옥마을이 없다면, 억지로 가짜 한옥마을을 만들지 말고 남해의 전통 가옥·문화유적(다랭이마을, 남해 관음포 등) 또는 인근(하동 최참판댁 등) 실제 명소를 솔직하게 추천하세요.
각 장소는 대한민국에 실제로 존재하는 장소여야 하며, 위도(lat)와 경도(lng), 실제 도로명 또는 지번 주소(addr)를 정확하게 포함해야 합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "감성적인 여정 제목",
  "querySummary": "${analysis.alternativeNotice || '요청하신 내용을 바탕으로 온마루 AI가 엄선한 맞춤 코스예요.'}",
  "regionTitle": "${analysis.region}",
  "spots": [
    {
      "id": "gemini_spot_1",
      "title": "실제 장소명",
      "addr": "실제 주소",
      "lat": 34.8377,
      "lng": 127.8924,
      "category": "전통 한옥·문화재 또는 로컬 명소",
      "reason": "이 장소를 추천하는 이유 1문장 (대체 추천인 경우 솔직하게 명시)",
      "image": "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80"
    }
  ]
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const raw = await callGemini(apiKey, model, prompt);
      const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed?.spots) && parsed.spots.length >= 3) {
        return {
          title: parsed.title || `${analysis.region}, AI가 추천하는 맞춤 이야기길`,
          querySummary: parsed.querySummary || analysis.alternativeNotice || query,
          regionTitle: parsed.regionTitle || analysis.region,
          spots: parsed.spots.slice(0, 3).map((s: any, idx: number) => ({
            spot: {
              id: `gemini_spot_${idx + 1}_${Date.now()}`,
              title: s.title || `${analysis.region} 명소`,
              addr: s.addr || `${analysis.region} 일대`,
              lat: Number(s.lat) || 34.8377,
              lng: Number(s.lng) || 127.8924,
              image: s.image || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
              category: s.category || '전통 한옥·문화재',
            },
            reason: s.reason || `${analysis.region}의 정취를 느낄 수 있는 추천 명소예요.`,
          })),
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function placeResourceToRawSpot(place: PlaceResource): RawSpot | null {
  if (!place.location) return null;
  return {
    id: place.ref.id,
    title: place.title,
    addr: place.summary || '',
    lat: place.location.latitude,
    lng: place.location.longitude,
    image: place.image?.url ?? null,
    category: place.category,
  };
}

/** 선택 후보 중 첫 곳의 개요·운영정보·이미지 (한옥 도감 자리). 실패해도 빈 값으로 넘어간다. */
async function fetchHanokDogan(spots: RawSpot[]): Promise<HanokDoganEntry[]> {
  const results = await Promise.allSettled(
    spots.map(async (spot): Promise<HanokDoganEntry | null> => {
      const detail = await HanokDetailService.getHanokDetail(spot.id);
      if (!detail.overview) return null;
      const entry: HanokDoganEntry = {
        placeId: spot.id,
        overview: detail.overview,
        usetime: detail.usetime ? String(detail.usetime) : null,
        restdate: detail.restdate ? String(detail.restdate) : null,
        images: detail.images ?? [],
        homepage: detail.homepage ?? null,
      };
      return entry;
    }),
  );
  return results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((v): v is HanokDoganEntry => v !== null);
}

/** 첫 후보 좌표 주변 실제 오디 해설(LBS). 반경 안에 없으면 빈 배열 — 지어내지 않는다. */
async function fetchNearbyAudio(centerLat: number, centerLng: number): Promise<NearbyAudioStory[]> {
  try {
    const stories = await sorimaruApiAdapter.getNearbyStories(String(centerLng), String(centerLat), 1500);
    return stories
      .filter((s) => s.audioUrl.length > 0)
      .slice(0, 4)
      .map((s) => ({
      stid: s.stid,
      title: s.title,
      audioTitle: s.audioTitle,
      audioUrl: s.audioUrl,
      distance: s.distance,
      formattedDuration: s.formattedDuration || '',
      imageUrl: s.imageUrl,
      locationName: s.locationName || '',
    }));
  } catch {
    return [];
  }
}

/** 첫 후보 좌표 주변 실제 음식점(TourAPI contentTypeId 39). */
async function fetchNearbyFood(centerLat: number, centerLng: number): Promise<NearbyFoodPlace[]> {
  const res = await TourApiClient.get('locationBasedList2', {
    mapX: centerLng,
    mapY: centerLat,
    radius: 800,
    contentTypeId: 39,
    arrange: 'E',
    numOfRows: 6,
  });
  const raw = res?.response?.body?.items?.item;
  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];

  return rows
    .map((row): NearbyFoodPlace | null => {
      const title = String(row.title ?? '').trim();
      const lat = Number(row.mapy);
      const lng = Number(row.mapx);
      if (!title || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: String(row.contentid),
        title,
        addr: String(row.addr1 ?? '').trim(),
        image: toHttps(String(row.firstimage || row.firstimage2 || '')),
        distanceMeters: Math.round(distanceInMeters({ lat: centerLat, lng: centerLng }, { lat, lng })),
      };
    })
    .filter((f): f is NearbyFoodPlace => f !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  const regionCode = typeof body.regionCode === 'string' ? body.regionCode : null;
  const mode: 'INITIAL' | 'REFINE' = body.mode === 'REFINE' ? 'REFINE' : 'INITIAL';
  const pinnedPlaces: PlaceResource[] = Array.isArray(body.pinnedPlaces) ? body.pinnedPlaces : [];
  const previousPlaceIds: string[] = Array.isArray(body.previousPlaceIds) ? body.previousPlaceIds : [];
  const previousRegionId: string | null = typeof body.previousRegionId === 'string' ? body.previousRegionId : null;

  if (!query) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'query가 필요합니다.', retryable: false, traceId: crypto.randomUUID(), details: null } },
      { status: 400 },
    );
  }

  // 1. Gemini AI를 통해 사용자의 질의 의도, 지역명, 테마, 일치 여부, 최적 검색 키워드 분석
  const analysis = await analyzeQueryWithGemini(query, regionCode);

  // REFINE에서는 새 문장에 지역명이 안 나올 수 있으므로(예: "시장 대신 역사 넣어줘") 이전 지역을 이어받는다.
  const keywords =
    mode === 'REFINE' && previousRegionId
      ? [previousRegionId.replace(/^region_/, ''), ...analysis.searchKeywords]
      : analysis.searchKeywords;

  const keyword =
    mode === 'REFINE' && previousRegionId
      ? previousRegionId.replace(/^region_/, '')
      : analysis.region || '한옥';

  const isFoodQuery = /빵|디저트|카페|맛집|식당|음식|먹거리|베이커리/.test(query);
  const rawSpots = await searchRealSpotsMultiKeywords(keywords, isFoodQuery);
  const pinnedIds = new Set(pinnedPlaces.map((p) => p.ref.id));
  const candidatePool = rawSpots.filter((s) => !pinnedIds.has(s.id));
  const pinnedSpots = pinnedPlaces.map(placeResourceToRawSpot).filter((s): s is RawSpot => s !== null);
  const slotsNeeded = Math.max(0, 3 - pinnedSpots.length);

  let selected: { spot: RawSpot; reason: string }[] = [];
  let journeyTitle = `${keyword}, 이야기로 만나는 여정`;
  let journeySummary = analysis.alternativeNotice || query;
  let isAiGenerated = false;

  if (candidatePool.length === 0 && pinnedPlaces.length === 0) {
    // TourAPI 결과가 없는 경우 Gemini가 실제 장소를 직접 큐레이션
    const directRes = await generateGeminiDirectSpots(query, analysis);
    if (directRes && directRes.spots.length >= 3) {
      selected = directRes.spots;
      journeyTitle = directRes.title;
      journeySummary = directRes.querySummary;
      isAiGenerated = true;
    } else {
      // 최후의 폴백: 기본 한옥 명소
      const fallbackSpots = await searchRealSpots('한옥');
      if (fallbackSpots.length > 0) {
        selected = fallbackSpots.slice(0, 3).map((s) => ({
          spot: s,
          reason: `${keyword} 관련 정보를 찾지 못하여 고즈넉한 전통 한옥 명소로 안내해 드려요.`,
        }));
        journeyTitle = `${keyword} 대신 만나는 전통 한옥 이야기`;
      } else {
        return NextResponse.json(
          { error: { code: 'NO_RESULTS', message: '이 지역에서 실제 장소를 찾지 못했어요.', retryable: true, traceId: crypto.randomUUID(), details: { keyword } } },
          { status: 200 },
        );
      }
    }
  } else {
    // candidatePool이 있는 경우 Gemini로 엄선 (대체 추천인 경우 솔직한 안내 반영)
    const gemini = await pickCandidates(query, analysis, candidatePool, pinnedSpots, slotsNeeded);
    const validPicks = (gemini?.picks ?? [])
      .map((p) => ({ ...p, id: String(p.id) }))
      .filter((p) => candidatePool.some((s) => String(s.id) === String(p.id)) && !pinnedIds.has(String(p.id)))
      .slice(0, slotsNeeded);

    const newlySelected: { spot: RawSpot; reason: string }[] =
      validPicks.length > 0
        ? validPicks.map((p) => ({ spot: candidatePool.find((s) => String(s.id) === String(p.id))!, reason: p.reason }))
        : candidatePool.slice(0, slotsNeeded).map((s) => ({
            spot: s,
            reason: analysis.alternativeNotice
              ? `${keyword}의 정취를 느낄 수 있는 추천 명소예요.`
              : `${keyword} 지역에서 실제로 검색된 장소예요.`,
          }));

    selected = [
      ...pinnedSpots.map((spot) => ({ spot, reason: '고정하신 장소라 그대로 유지했어요.' })),
      ...newlySelected,
    ];

    if (gemini?.title) journeyTitle = gemini.title;
    if (gemini?.querySummary) journeySummary = gemini.querySummary;
    isAiGenerated = validPicks.length > 0 || slotsNeeded === 0;
  }

  const asOf = new Date().toISOString().slice(0, 10);
  const regionRef = { type: 'REGION' as const, id: `region_${keyword}` };
  const region: RegionResource = {
    ref: regionRef,
    title: formatRegionAddress(selected[0]?.spot.addr.split(' ')[0], keyword) || keyword,
  };

  const evidence: Evidence[] = [];
  const places: PlaceResource[] = selected.map(({ spot }) => {
    const isGeminiSpot = spot.id.startsWith('gemini_spot_');
    const evId = isGeminiSpot ? `ev_gemini_${spot.id}` : `ev_tourapi_${spot.id}`;
    const sourceName = isGeminiSpot ? '온마루 AI 큐레이터 (Gemini)' : '한국관광공사 TourAPI';
    evidence.push({
      id: evId,
      kind: 'PROVIDER_FIELD',
      sourceName,
      sourceUrl: null,
      sourceRevision: null,
      summary: isGeminiSpot ? `온마루 AI 큐레이션 추천 장소 (keyword: ${keyword})` : `TourAPI searchKeyword2 결과 (keyword: ${keyword})`,
      asOf,
    });
    return {
      ref: { type: 'PLACE', id: spot.id },
      title: spot.title,
      category: spot.category,
      regionRef,
      summary: spot.addr || null,
      image: spot.image ? { url: spot.image, alt: spot.title, sourceName } : null,
      location: { latitude: spot.lat, longitude: spot.lng, accuracy: 'EXACT' },
      sourceRefs: [evId],
      unavailableFields: ['OPERATING_HOURS', 'ACCESSIBILITY'],
    };
  });

  evidence.push({
    id: 'ev_spatial_calc',
    kind: 'SPATIAL_CALCULATION',
    sourceName: 'OnMaru 좌표 계산 (Haversine)',
    sourceUrl: null,
    sourceRevision: null,
    summary: '인접 장소 좌표 기반 직선거리 계산. 실제 도보 경로가 아니다.',
    asOf,
  });

  const relations: JourneyBoard['relations'] = [];
  const relationRefsByPlace = new Map<string, string[]>();
  function addRelationRef(placeId: string, relId: string) {
    relationRefsByPlace.set(placeId, [...(relationRefsByPlace.get(placeId) ?? []), relId]);
  }

  for (const { spot } of selected) {
    const relId = `rel_located_${spot.id}`;
    const isGeminiSpot = spot.id.startsWith('gemini_spot_');
    const evId = isGeminiSpot ? `ev_gemini_${spot.id}` : `ev_tourapi_${spot.id}`;
    relations.push({
      id: relId,
      sourceRef: { type: 'PLACE', id: spot.id },
      targetRef: regionRef,
      type: 'LOCATED_IN',
      label: `${keyword} 지역에 위치`,
      evidenceRefs: [evId],
    });
    addRelationRef(spot.id, relId);
  }

  const candidates: JourneyCandidate[] = selected.map(({ spot, reason }) => {
    const isGeminiSpot = spot.id.startsWith('gemini_spot_');
    const evId = isGeminiSpot ? `ev_gemini_${spot.id}` : `ev_tourapi_${spot.id}`;
    return {
      placeRef: { type: 'PLACE', id: spot.id },
      reason,
      evidenceRefs: [evId],
      relationRefs: relationRefsByPlace.get(spot.id) ?? [],
      constraintChecks: [
        { key: 'REGION', status: 'SATISFIED', label: `${keyword} 지역`, evidenceRefs: [evId] },
      ],
    };
  });

  const legs: JourneyLeg[] = [];
  for (let i = 0; i < selected.length - 1; i++) {
    const from = selected[i].spot;
    const to = selected[i + 1].spot;
    const meters = Math.round(distanceInMeters({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }));
    legs.push({
      fromRef: { type: 'PLACE', id: from.id },
      toRef: { type: 'PLACE', id: to.id },
      order: i + 1,
      distanceMeters: meters,
      distanceKind: 'STRAIGHT_LINE',
      distanceBand: bandFor(meters),
    });

    const nearbyRelId = `rel_nearby_${from.id}_${to.id}`;
    relations.push({
      id: nearbyRelId,
      sourceRef: { type: 'PLACE', id: from.id },
      targetRef: { type: 'PLACE', id: to.id },
      type: 'NEARBY',
      label: meters >= 1000 ? `직선 약 ${(meters / 1000).toFixed(1)}km` : `직선 약 ${meters}m`,
      evidenceRefs: ['ev_spatial_calc'],
    });
    addRelationRef(from.id, nearbyRelId);
    addRelationRef(to.id, nearbyRelId);
  }

  // legs 계산 뒤에 relationRefs가 채워졌으니 candidates에 한 번 더 반영한다.
  for (const c of candidates) {
    c.relationRefs = relationRefsByPlace.get(c.placeRef.id) ?? [];
  }

  const board: JourneyBoard = {
    title: journeyTitle,
    querySummary: journeySummary,
    regionRef,
    candidates,
    legs,
    resources: [region, ...places],
    relations,
    evidence,
  };

  const centerSpot = selected[0]?.spot || { lat: 37.5759, lng: 126.9768 };
  const [hanokDogan, nearbyAudio, nearbyFood] = await Promise.all([
    fetchHanokDogan(selected.map((s) => s.spot)),
    fetchNearbyAudio(centerSpot.lat, centerSpot.lng),
    fetchNearbyFood(centerSpot.lat, centerSpot.lng).catch(() => []),
  ]);

  const finalIds = selected.map((s) => s.spot.id);
  const diff =
    mode === 'REFINE'
      ? {
          keptRefs: finalIds.filter((id) => previousPlaceIds.includes(id)).map((id) => ({ type: 'PLACE' as const, id })),
          addedRefs: finalIds.filter((id) => !previousPlaceIds.includes(id)).map((id) => ({ type: 'PLACE' as const, id })),
          removedRefs: previousPlaceIds
            .filter((id) => !finalIds.includes(id))
            .map((id) => ({ type: 'PLACE' as const, id })),
        }
      : null;

  return NextResponse.json({
    board,
    aiGenerated: isAiGenerated,
    hanokDogan,
    nearbyAudio,
    nearbyFood,
    diff,
  });
}
