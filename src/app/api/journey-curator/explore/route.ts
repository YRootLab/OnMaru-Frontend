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

const EARTH_KNOWN_KEYWORDS = [
  '서촌', '북촌', '남산골', '경복궁', '창덕궁', '전주', '하회마을', '안동',
  '병산서원', '교촌', '경주', '양동마을', '담양', '소쇄원', '순천', '낙안읍성',
];

function extractKeyword(query: string, regionCode?: string | null): string {
  if (regionCode?.includes('JONGNO')) return '서촌';
  for (const k of EARTH_KNOWN_KEYWORDS) {
    if (query.includes(k)) return k;
  }
  const cleaned = query.replace(/[^\w가-힣\s]/g, ' ').trim();
  return cleaned.split(/\s+/).find((w) => w.length >= 2) || '한옥';
}

function bandFor(meters: number): DistanceBand {
  // ponytail: 임계값은 Day1 파일럿 좌표로 아직 동결 전이라 잠정치다.
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

async function searchRealSpots(keyword: string): Promise<RawSpot[]> {
  const res = await TourApiClient.get('searchKeyword2', {
    keyword,
    arrange: 'Q',
    numOfRows: 15,
  });
  const raw = res?.response?.body?.items?.item;
  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];

  return rows
    .map((row): RawSpot | null => {
      const title = String(row.title ?? '').trim();
      const lat = Number(row.mapy);
      const lng = Number(row.mapx);
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

async function callGemini(apiKey: string, modelName: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Gemini API error [${res.status}]`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

interface GeminiPick {
  id: string;
  reason: string;
}

async function pickCandidates(
  query: string,
  spots: RawSpot[],
  pinnedSpots: RawSpot[],
  slotsNeeded: number,
): Promise<{ title: string; querySummary: string; picks: GeminiPick[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || slotsNeeded <= 0) return null;

  const allowlist = spots
    .slice(0, 12)
    .map((s, i) => `${i + 1}. id=${s.id} | ${s.title} | ${s.category} | ${s.addr}`)
    .join('\n');

  const pinnedNote =
    pinnedSpots.length > 0
      ? `사용자가 이미 고정해 반드시 유지되는 장소(당신이 고를 필요 없음, 그대로 유지됨):\n${pinnedSpots
          .map((s) => `- ${s.title}`)
          .join('\n')}\n\n`
      : '';

  const prompt = `당신은 온마루 '이야기길'의 큐레이터입니다. 아래 [실제 후보 목록]에 있는 장소 중에서만 골라야 합니다.
새 장소를 지어내거나, 목록에 없는 id를 반환하면 안 됩니다. 운영시간·혼잡도·방문객 수 같은 확인 안 된 정보도 만들지 마세요.

[사용자 요청]
"${query}"

${pinnedNote}[실제 후보 목록]
${allowlist}

사용자 요청과 가장 잘 맞는 장소를 정확히 ${slotsNeeded}개, 이야기로 이어지는 방문 순서대로 고르세요.
각 장소마다 왜 이 요청과 맞는지 1문장 이유를 쓰세요. 반드시 아래 JSON 형식으로만 답하세요.

{
  "title": "여정 제목 (짧게)",
  "querySummary": "사용자 요청 한 줄 요약",
  "picks": [{ "id": "목록의 id 값 그대로", "reason": "이유 1문장" }]
}`;

  const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  for (const model of models) {
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

  // REFINE에서는 새 문장에 지역명이 안 나올 수 있으므로(예: "시장 대신 역사 넣어줘") 이전 지역을 이어받는다.
  const keyword =
    mode === 'REFINE' && previousRegionId
      ? previousRegionId.replace(/^region_/, '')
      : extractKeyword(query, regionCode);

  const rawSpots = await searchRealSpots(keyword);
  const pinnedIds = new Set(pinnedPlaces.map((p) => p.ref.id));
  const candidatePool = rawSpots.filter((s) => !pinnedIds.has(s.id));

  if (candidatePool.length === 0 && pinnedPlaces.length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_RESULTS', message: '이 지역에서 실제 장소를 찾지 못했어요.', retryable: true, traceId: crypto.randomUUID(), details: { keyword } } },
      { status: 200 },
    );
  }

  const pinnedSpots = pinnedPlaces.map(placeResourceToRawSpot).filter((s): s is RawSpot => s !== null);
  const slotsNeeded = Math.max(0, 3 - pinnedSpots.length);

  const gemini = await pickCandidates(query, candidatePool, pinnedSpots, slotsNeeded);

  // 코드로 검증: Gemini가 목록 밖 id를 반환했으면 버린다. 고정된 장소는 다시 고를 필요 없다.
  const validPicks = (gemini?.picks ?? [])
    .filter((p) => candidatePool.some((s) => s.id === p.id) && !pinnedIds.has(p.id))
    .slice(0, slotsNeeded);

  const newlySelected: { spot: RawSpot; reason: string }[] =
    validPicks.length > 0
      ? validPicks.map((p) => ({ spot: candidatePool.find((s) => s.id === p.id)!, reason: p.reason }))
      : candidatePool.slice(0, slotsNeeded).map((s) => ({ spot: s, reason: `${keyword} 지역에서 실제로 검색된 장소예요.` }));

  const selected: { spot: RawSpot; reason: string }[] = [
    ...pinnedSpots.map((spot) => ({ spot, reason: '고정하신 장소라 그대로 유지했어요.' })),
    ...newlySelected,
  ];

  const asOf = new Date().toISOString().slice(0, 10);
  const regionRef = { type: 'REGION' as const, id: `region_${keyword}` };
  const region: RegionResource = {
    ref: regionRef,
    title: formatRegionAddress(selected[0]?.spot.addr.split(' ')[0], keyword) || keyword,
  };

  const evidence: Evidence[] = [];
  const places: PlaceResource[] = selected.map(({ spot }) => {
    const evId = `ev_tourapi_${spot.id}`;
    evidence.push({
      id: evId,
      kind: 'PROVIDER_FIELD',
      sourceName: '한국관광공사 TourAPI',
      sourceUrl: null,
      sourceRevision: null,
      summary: `TourAPI searchKeyword2 결과 (keyword: ${keyword})`,
      asOf,
    });
    return {
      ref: { type: 'PLACE', id: spot.id },
      title: spot.title,
      category: spot.category,
      regionRef,
      summary: spot.addr || null,
      image: spot.image ? { url: spot.image, alt: spot.title, sourceName: '한국관광공사 TourAPI' } : null,
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

  // 관계: 지역 소속(LOCATED_IN)은 근거가 이미 있고, 인접 거리(NEARBY)는 legs와 같은 계산이다.
  // 의미적 연관(SHARES_VERIFIED_TOPIC·EDITORIAL_PAIRING)은 검수된 자료가 없어 만들지 않는다 —
  // 지어낸 "관련성"을 관계로 승격하지 않는다는 원칙(seven-day-mvp-fe-handoff.md §8).
  const relations: JourneyBoard['relations'] = [];
  const relationRefsByPlace = new Map<string, string[]>();
  function addRelationRef(placeId: string, relId: string) {
    relationRefsByPlace.set(placeId, [...(relationRefsByPlace.get(placeId) ?? []), relId]);
  }

  for (const { spot } of selected) {
    const relId = `rel_located_${spot.id}`;
    relations.push({
      id: relId,
      sourceRef: { type: 'PLACE', id: spot.id },
      targetRef: regionRef,
      type: 'LOCATED_IN',
      label: `${keyword} 지역에 위치`,
      evidenceRefs: [`ev_tourapi_${spot.id}`],
    });
    addRelationRef(spot.id, relId);
  }

  const candidates: JourneyCandidate[] = selected.map(({ spot, reason }) => ({
    placeRef: { type: 'PLACE', id: spot.id },
    reason,
    evidenceRefs: [`ev_tourapi_${spot.id}`],
    relationRefs: relationRefsByPlace.get(spot.id) ?? [],
    constraintChecks: [
      { key: 'REGION', status: 'SATISFIED', label: `${keyword} 지역`, evidenceRefs: [`ev_tourapi_${spot.id}`] },
    ],
  }));

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
    title: gemini?.title || `${keyword}, 실제 장소로 만나는 이야기`,
    querySummary: gemini?.querySummary || query,
    regionRef,
    candidates,
    legs,
    resources: [region, ...places],
    relations,
    evidence,
  };

  const centerSpot = selected[0].spot;
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
    aiGenerated: validPicks.length > 0 || slotsNeeded === 0,
    hanokDogan,
    nearbyAudio,
    nearbyFood,
    diff,
  });
}
