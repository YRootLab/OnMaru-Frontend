import { NextRequest, NextResponse } from 'next/server';
import type { BentoJourneyPlan } from '@/features/journey-curator/types/journey.types';
import { matchJourneyPlan } from '@/features/journey-curator/data/curatedJourneys';

const SYSTEM_PROMPT = `당신은 한국 전통 한옥과 문화유산, 지역 정취를 깊이 있게 연결하는 '온마루(OnMaru) AI 여정 큐레이터'입니다.
사용자의 감정, 여행 요청 키워드, 또는 이전 여정 수정 요청에 맞추어 깊이 있고 시적인 전통 한옥 여행 플랜을 반드시 유효한 JSON 형식으로만 응답하세요.

[필수 규칙 및 가이드라인]
1. 일본식 명칭이나 이모지(🏯 등)는 절대 사용하지 마십시오. 오직 한국 전통 한옥, 서원, 누정, 원림, 종택, 고택, 전통시장, 정겨운 옛길만을 다룹니다.
2. STEP 01, STAGE 01 같은 인위적인 번호 매김이나 라벨링을 제목이나 본문에 절대 붙이지 마십시오.
3. 지식 그래프 노드(nodes)는 정확히 5개로 구성하십시오:
   - 1개: category: "region" (지역/권역, 예: "전남 담양", "서울 종로", "경북 안동", "경북 경주")
   - 1개: category: "hanok" (한옥 건축 문화재, 예: "소쇄원 광풍각", "병산서원 만대루", "교촌 양동마을 수졸당")
   - 1개: category: "market" (전통시장 또는 향토 음식 골목, 예: "담양 국수거리", "안동 구시장 찜닭골목", "경주 중앙시장")
   - 1개: category: "sorimaru" (소리마루 공간 오디오 해설 이야기 대상, 예: "소쇄처사 양산보 이야기", "만대루의 차경 미학")
   - 1개: category: "warmth" (실시간 온기 및 혼잡도, 예: "담양 온기: 한적함", "안동 온기: 보통")
   노드의 x, y 좌표는 퍼센트(0~100) 숫자입니다.
   권장 배치: region(x: 18, y: 35), hanok(x: 42, y: 20), market(x: 44, y: 68), sorimaru(x: 74, y: 22), warmth(x: 75, y: 70).
4. 지식 그래프 엣지(edges)는 위 노드들을 연결하는 5개의 관계선입니다 (e1~e5).
   id, source, target, label, dashed(선택 boolean)을 포함합니다.
5. routeCard (추천 공간 동선):
   - title: 동선 제목 (예: "비 오는 날의 담양 서정 로드 (약 1.5km)" 또는 "1박 2일 담양·광주 원림 힐링 기행")
   - duration: 총 소요시간 (예: "약 2시간" 또는 "1박 2일", "2박 3일")
   - walkingTime: 도보 시간 (예: "도보 30분" 또는 "일평균 도보 40분")
   - totalDays: 일정 일수 (정수: 당일치기는 1, 1박 2일은 2, 2박 3일은 3 등)
   - days: [1박 2일 이상 다일정일 경우 필수!]
     각 일차별 객체 배열:
     [
       {
         "dayNumber": 1,
         "dayTitle": "1일차: 소쇄원의 빗소리와 원림의 정취",
         "theme": "도착 및 원림 산책",
         "duration": "약 4시간",
         "walkingTime": "도보 35분",
         "stops": [{ "time": "13:00", "name": "소쇄원", "category": "한옥", "description": "..." }, ...],
         "mapLink": "/map?lat=35.1843&lng=127.0121&level=6"
       },
       {
         "dayNumber": 2,
         "dayTitle": "2일차: 대나무 숲길과 정겨운 찻집 차담",
         "theme": "고택 쉼과 향토 음식",
         "duration": "약 3시간",
         "walkingTime": "도보 30분",
         "stops": [...],
         "mapLink": "/map?lat=35.1843&lng=127.0121&level=6"
       }
     ]
   - stops: 기본/1일차 기준 4개 정류장 배열 [{ time: "13:00", name: "담양 소쇄원 입구", category: "출발", description: "대나무 숲길 빗소리 감상" }, ...]
   - mapLink: 지도 페이지 링크 (예: "/map?lat=35.2340&lng=127.0060&level=6")
6. hanokCard (한옥 건축·문화재 도감):
   - title: 한옥 건물명 (예: "담양 소쇄원 제월당 & 광풍각")
   - location: 도로명 주소 (예: "전남 담양군 가사문학면 소쇄원길 17")
   - imageUrl: 고화질 한국 전통 건축 사진 Unsplash URL
   - architecturalPoint: 건축학적 가치 및 특징 설명 1~2문장
   - era: 건축 연대/시대 (예: "조선 중종 25년 (1530년경)")
   - hanokLink: "/hanok"
7. sorimaruCard (소리마루 공간 오디오 해설):
   - title: 오디오 에피소드 제목 (예: "소쇄원 계곡에 흐르는 양산보의 철학")
   - subtitle: 부제 (예: "스승 조광조를 기리며 자연으로 귀의한 선비의 정원")
   - duration: 재생 시간 (예: "5분 02초")
   - narrator: 해설자 소속 (예: "가사문학관 학예연구사")
   - excerpt: 따옴표로 감싼 시적 해설 인용문
   - sorimaruLink: "/sorimaru"
8. warmthCard (실시간 온기 및 혼잡도):
   - status: "한적함" | "보통" | "북적임" 중 하나
   - percentage: 0~100 사이의 혼잡도 정수
   - bestTime: 가장 방문하기 좋은 시간대 (예: "비 내리는 오후 13:00 ~ 15:30")
   - vibeComment: 방문자 정취 조언 1문장
   - recentCount: 최근 여행자 온기 기록 개수 (정수, 예: 14)
9. refineSuggestions:
   - 사용자가 원클릭으로 여정을 재조정할 수 있는 4가지 추천 옵션 배열
   - 예: ["+ 전통 찻집 위주", "+ 비 오는 날 운치", "+ 걷는 시간 줄이기", "+ 역사 해설 중심"]

[응답 JSON 스키마 구조]
{
  "id": "slug-id",
  "querySummary": "간결한 여정 요약 (예: 담양 · 빗소리가 아름다운 소쇄원과 푸른 대숲 정원)",
  "title": "시적인 여정 제목 (예: 낙숫물 소리에 귀 기울이는 담양 원림 기행)",
  "tagline": "한 줄 감성 설명",
  "region": "지역명 (예: 전남 담양군 가사문학면 일대)",
  "moodKeywords": ["키워드1", "키워드2", "키워드3", "키워드4"],
  "nodes": [... 5개 노드 ...],
  "edges": [... 5개 엣지 ...],
  "routeCard": { ... },
  "hanokCard": { ... },
  "sorimaruCard": { ... },
  "warmthCard": { ... },
  "refineSuggestions": ["+ 조건1", "+ 조건2", "+ 조건3", "+ 조건4"]
}`;

interface TourSpot {
  title: string;
  addr: string;
  x: string;
  y: string;
}

interface TourNearbyResult {
  center: TourSpot;
  nearby: TourSpot[];
}

function extractSearchKeyword(query: string, mood?: string): string {
  const known = [
    '소쇄원', '담양', '서촌', '북촌', '전주', '하회마을', '안동', '병산서원',
    '교촌', '경주', '양동마을', '선교장', '오죽헌', '강릉', '광한루', '남원',
    '수원화성', '무섬마을', '영주', '낙안읍성', '순천', '녹우당', '해남', '운조루', '구례',
    '남산골', '창덕궁', '경복궁', '불국사', '도산서원',
  ];
  for (const k of known) {
    if (query.includes(k)) return k;
  }

  if (mood === 'rainy' || query.includes('비') || query.includes('빗소리')) return '소쇄원';
  if (mood === 'market' || query.includes('시장') || query.includes('먹거리')) return '전주';
  if (mood === 'story' || query.includes('이야기') || query.includes('역사') || query.includes('서원')) return '병산서원';
  if (mood === 'rest' || query.includes('쉼') || query.includes('휴식') || query.includes('지친')) return '경주';
  if (mood === 'quiet' || query.includes('조용') || query.includes('고즈넉')) return '서촌';

  const cleaned = query.replace(/[^\w가-힣\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2);
  return words[0] || '한옥';
}

async function fetchTourApiRelatedSpots(keyword: string): Promise<TourNearbyResult | null> {
  const tourKey =
    process.env.TOUR_API_RELATED_KEY ||
    process.env.TOUR_API_KEY ||
    process.env.TOUR_API_CONGESTION_KEY;

  if (!tourKey) return null;

  try {
    const q1 = new URLSearchParams({
      serviceKey: tourKey,
      MobileOS: 'ETC',
      MobileApp: 'OnMaru',
      _type: 'json',
      keyword,
      numOfRows: '3',
      pageNo: '1',
    });
    const res1 = await fetch(
      `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?${q1}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res1.ok) return null;
    const data1 = await res1.json();
    const items = data1?.response?.body?.items?.item;
    const centerRaw = Array.isArray(items) ? items[0] : items;
    if (!centerRaw || !centerRaw.mapx || !centerRaw.mapy) return null;

    const center: TourSpot = {
      title: String(centerRaw.title || keyword),
      addr: String(centerRaw.addr1 || ''),
      x: String(centerRaw.mapx),
      y: String(centerRaw.mapy),
    };

    const q2 = new URLSearchParams({
      serviceKey: tourKey,
      MobileOS: 'ETC',
      MobileApp: 'OnMaru',
      _type: 'json',
      mapX: center.x,
      mapY: center.y,
      radius: '6000',
      arrange: 'E',
      numOfRows: '8',
      pageNo: '1',
    });
    const res2 = await fetch(
      `https://apis.data.go.kr/B551011/KorService2/locationBasedList2?${q2}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res2.ok) return { center, nearby: [] };

    const data2 = await res2.json();
    const nearbyRaw = data2?.response?.body?.items?.item;
    const nearbyList = Array.isArray(nearbyRaw) ? nearbyRaw : nearbyRaw ? [nearbyRaw] : [];

    const nearby: TourSpot[] = nearbyList
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((n: any) => n.title && n.title !== center.title)
      .slice(0, 6)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((n: any) => ({
        title: String(n.title),
        addr: String(n.addr1 || ''),
        x: String(n.mapx || center.x),
        y: String(n.mapy || center.y),
      }));

    return { center, nearby };
  } catch (err) {
    console.warn('[fetchTourApiRelatedSpots] TourAPI call skipped:', err);
    return null;
  }
}

async function callGemini(apiKey: string, modelName: string, userPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\n[사용자 요청]\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(35000), // 35s timeout
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error [${response.status}]: ${errText}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const mood = body.mood;
    const previousPlan = body.previousPlan as BentoJourneyPlan | undefined;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      // API Key가 설정되지 않은 경우 안전하게 로컬 매칭 플랜으로 폴백
      console.warn('[JourneyCurator API] GEMINI_API_KEY not found. Falling back to curated data.');
      const fallbackPlan = matchJourneyPlan(query);
      return NextResponse.json({
        ...fallbackPlan,
        isAiGenerated: false,
        refineSuggestions: fallbackPlan.refineSuggestions || [
          '+ 전통 찻집 위주',
          '+ 비 오는 날 운치',
          '+ 걷는 시간 줄이기',
          '+ 역사 해설 중심',
        ],
      });
    }

    // 한국관광공사 TourAPI 실시간 연관 관광지 및 연계 정보 조회 (TOUR_API_RELATED_KEY 활용)
    const searchTargetKeyword = extractSearchKeyword(query, mood);
    const tourData = await fetchTourApiRelatedSpots(searchTargetKeyword);

    // Gemini 프롬프트 구성
    let userPrompt = `사용자가 찾고자 하는 여정 조건: "${query}"`;
    if (mood) {
      userPrompt += `\n선택된 감성 분위기: "${mood}"`;
    }
    if (previousPlan) {
      userPrompt += `\n이전 여정 정보:\n- 지역: ${previousPlan.region}\n- 기존 한옥: ${previousPlan.hanokCard.title}\n- 이전 요청: "${previousPlan.querySummary}"\n위 이전 여정을 바탕으로 사용자의 새 요청("${query}")을 반영하여 수정된 여정을 구성해 주세요.`;
    }

    if (tourData) {
      userPrompt += `\n\n[한국관광공사 TourAPI 실시간 연관 관광지 및 연계 코스 데이터 (TOUR_API_RELATED_KEY)]
- 기준 중심 관광지: ${tourData.center.title} (주소: ${tourData.center.addr || '정보 없음'}, 좌표: lat=${tourData.center.y}, lng=${tourData.center.x})
- 연관 관광지 및 인근 추천 명소:
${tourData.nearby.map((spot, i) => `  ${i + 1}. ${spot.title} (주소: ${spot.addr || '인근'}, 좌표: lat=${spot.y}, lng=${spot.x})`).join('\n')}

[TourAPI 데이터 연계 지침]
- 위 실제 연관 관광지/명소(전통가옥, 누정, 원림, 찻집 등)를 routeCard.stops의 정류장과 nodes의 노드로 적극 활용하십시오.
- routeCard.mapLink에는 중심 관광지 실제 좌표를 반영한 URL('/map?lat=${tourData.center.y}&lng=${tourData.center.x}&level=6')을 사용하십시오.
- hanokCard.location에는 실제 주소("${tourData.center.addr}")를 적용하십시오.`;
    }

    // 다일정 여정 감지 (예: 1박 2일, 2박 3일, 며칠 코스 등)
    const isMultiDay = /([1-9]\s*박\s*[1-9]\s*일|[1-9]\s*일\s*코스|[1-9]\s*일간|며칠|주말\s*여행)/i.test(query);
    if (isMultiDay) {
      userPrompt += `\n\n[다일정(N박 N일) 편성 특별 지침]
- 사용자가 여러 날에 걸친 여정을 요청했습니다. 반드시 routeCard 객체 안에 totalDays(일정 일수)와 days 배열을 생성하여 각 일자별(1일차, 2일차...)로 테마, 소요시간, stops(3~4개 장소), mapLink를 균형 있게 분할 편성해 주세요.`;
    }

    // 모델 시도: gemini-3.6-flash 우선, 순차 폴백
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let rawJson: string | null = null;
    for (const model of modelsToTry) {
      try {
        rawJson = await callGemini(apiKey, model, userPrompt);
        if (rawJson) break;
      } catch (err) {
        console.warn(`[JourneyCurator API] ${model} call failed:`, err);
      }
    }

    if (!rawJson) {
      const fallbackPlan = matchJourneyPlan(query);
      return NextResponse.json({
        ...fallbackPlan,
        isAiGenerated: false,
        refineSuggestions: fallbackPlan.refineSuggestions || [
          '+ 전통 찻집 위주',
          '+ 비 오는 날 운치',
          '+ 걷는 시간 줄이기',
          '+ 역사 해설 중심',
        ],
      });
    }

    // JSON 마크다운 블록 제거 및 파싱
    let cleanedJson = rawJson.trim();
    if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    const parsed = JSON.parse(cleanedJson) as BentoJourneyPlan;

    // 다일정 routeCard 보정: days가 있으면 stops는 1일차 stops로 보장
    const rawRoute = parsed.routeCard || matchJourneyPlan(query).routeCard;
    const hasDays = Array.isArray(rawRoute.days) && rawRoute.days.length > 0;
    const normalizedRoute: typeof rawRoute = {
      ...rawRoute,
      totalDays: rawRoute.totalDays || (hasDays ? rawRoute.days!.length : 1),
      days: hasDays ? rawRoute.days : undefined,
      stops: hasDays && (!rawRoute.stops || rawRoute.stops.length === 0)
        ? rawRoute.days![0].stops
        : (rawRoute.stops || matchJourneyPlan(query).routeCard.stops),
    };

    // 필수 컴포넌트 데이터 기본값 보정
    const plan: BentoJourneyPlan = {
      id: parsed.id || `ai-journey-${Date.now()}`,
      querySummary: parsed.querySummary || query,
      title: parsed.title || '정취가 머무는 전통 한옥 여정',
      tagline: parsed.tagline || '조용한 걸음으로 만나는 우리의 옛 숨결',
      region: parsed.region || '한국의 유서 깊은 고택 마을',
      moodKeywords: Array.isArray(parsed.moodKeywords) ? parsed.moodKeywords.slice(0, 5) : ['고즈넉함', '한옥 산책', '툇마루 쉼'],
      nodes: Array.isArray(parsed.nodes) && parsed.nodes.length > 0 ? parsed.nodes : matchJourneyPlan(query).nodes,
      edges: Array.isArray(parsed.edges) && parsed.edges.length > 0 ? parsed.edges : matchJourneyPlan(query).edges,
      routeCard: normalizedRoute,
      hanokCard: parsed.hanokCard?.title ? parsed.hanokCard : matchJourneyPlan(query).hanokCard,
      sorimaruCard: parsed.sorimaruCard?.title ? parsed.sorimaruCard : matchJourneyPlan(query).sorimaruCard,
      warmthCard: parsed.warmthCard?.status ? parsed.warmthCard : matchJourneyPlan(query).warmthCard,
      refineSuggestions: Array.isArray(parsed.refineSuggestions) && parsed.refineSuggestions.length > 0
        ? parsed.refineSuggestions
        : [
            '+ 전통 찻집 위주',
            '+ 비 오는 날 운치',
            '+ 걷는 시간 줄이기',
            '+ 역사 해설 중심',
          ],
      isAiGenerated: true,
    };

    return NextResponse.json(plan);
  } catch (error) {
    console.error('[JourneyCurator API Route] Unexpected error:', error);
    const fallbackPlan = matchJourneyPlan('quiet');
    return NextResponse.json({
      ...fallbackPlan,
      isAiGenerated: false,
      refineSuggestions: [
        '+ 전통 찻집 위주',
        '+ 비 오는 날 운치',
        '+ 걷는 시간 줄이기',
        '+ 역사 해설 중심',
      ],
    });
  }
}
