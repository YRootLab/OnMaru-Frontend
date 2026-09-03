import { NextResponse } from 'next/server';
import { PlaceService } from '@/map/services/place.service';
import { seedWarmth } from '@/map/warmth/seed';
import type { Warmth } from '@/map/types';

/**
 * 장소 유형별 실제 방문자 감성 온기 템플릿 풀
 */
const REVIEW_TEMPLATES: Record<string, { text: string; mood: '한적' | '북적'; tags: string[] }[]> = {
  stay: [
    {
      text: '온돌방이 따끈따끈해서 여독이 눈 녹듯 풀렸어요. 창호지 문 사이로 드는 아침 햇살이 참 포근합니다.',
      mood: '한적',
      tags: ['따뜻한온돌', '숙소', '힐링'],
    },
    {
      text: '밤에 마당 평상에 앉아 기와지붕 위로 뜬 달과 별을 보는데 잊지 못할 추억이 되었습니다.',
      mood: '한적',
      tags: ['별빛마당', '달빛야행', '정취'],
    },
    {
      text: '주말이라 투숙객이 꽤 많았는데 마당에서 서로 인사 나누는 분위기가 정겨웠어요.',
      mood: '북적',
      tags: ['정겨운분위기', '가족여행', '따뜻함'],
    },
  ],
  cafe: [
    {
      text: '고택을 개조한 한옥 카페라 마루에 앉아 그윽한 전통차 향을 즐기기 너무 좋습니다.',
      mood: '한적',
      tags: ['전통차', '고택카페', '향기'],
    },
    {
      text: '마당 정원이 예쁘게 꾸며져 있어서 사진 찍는 사람들이 많아요. 노을 질 때 창가 자리 추천합니다!',
      mood: '북적',
      tags: ['사진맛집', '인생샷', '노을뷰'],
    },
  ],
  spot: [
    {
      text: '처마 밑에 가만히 서서 바람에 스치는 풍경 소리를 들으니 마음이 절로 차분해집니다.',
      mood: '한적',
      tags: ['고즈넉함', '풍경소리', '사색'],
    },
    {
      text: '돌담길을 따라 천천히 걸으며 사계절의 자연과 한옥의 조화를 만끽하기 좋은 곳이에요.',
      mood: '한적',
      tags: ['돌담길', '산책로', '자연'],
    },
    {
      text: '한복 입은 여행자들로 활기가 넘치네요. 처마 곡선과 기와가 어우러져 한 폭의 그림 같습니다.',
      mood: '북적',
      tags: ['한복체험', '활기찬', '기와처마'],
    },
  ],
  culture: [
    {
      text: '문화재 해설사님의 설명을 들으며 둘러보니 대청마루와 기단 하나하나에 담긴 지혜가 와닿았어요.',
      mood: '한적',
      tags: ['역사체험', '문화재', '해설추천'],
    },
    {
      text: '마당에서 열리는 전통 공연 덕분에 흥겨운 시간을 보냈습니다. 아이들과 함께 오기 최고예요.',
      mood: '북적',
      tags: ['전통공연', '가족나들이', '흥겨움'],
    },
  ],
  festival: [
    {
      text: '달빛 야행 등불이 켜진 고택 골목길의 야경이 환상적입니다. 밤공기 맞으며 걷는 기분이 최고예요.',
      mood: '북적',
      tags: ['야경명소', '축제', '등불거리'],
    },
  ],
};

const DEFAULT_TEMPLATES = [
  {
    text: '도심 속에서 고즈넉한 한옥의 정취를 느낄 수 있는 소중한 공간입니다.',
    mood: '한적' as const,
    tags: ['고즈넉함', '도심속쉼터'],
  },
  {
    text: '나무 향과 마당 흙내음이 어우러져 발길 닿는 곳마다 마음이 편안해집니다.',
    mood: '한적' as const,
    tags: ['흙내음', '쉼터', '평온'],
  },
  {
    text: '주말이라 찾아온 사람들로 북적이지만, 서로 미소 짓는 분위기가 참 따뜻해요.',
    mood: '북적' as const,
    tags: ['따뜻한발길', '주말나들이'],
  },
];

/**
 * 문자열 해시 기반 안정적 인덱스 선택 (동일 장소는 항상 일관된 템플릿 유지)
 */
function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * 실시간 TourAPI 장소 목록 기반 온기 데이터 생성 API
 * 
 * 특정 뷰포트(예: 대전, 전주, 서울 등) 내의 실제 한옥 장소들을 TourAPI로 조회하고,
 * 각 장소의 성격에 부합하는 생생한 온기 후기를 매핑하여 반환합니다.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const lat = Number(q.get('lat'));
  const lng = Number(q.get('lng'));
  const radius = Number(q.get('radius')) || 8000;

  const now = Date.now();
  const ONE_DAY = 86_400_000;

  try {
    // 1. 기본 시드 온기 (전통 한옥 대표 명소들)
    const baseWarmths = seedWarmth(now);

    // 2. 좌표가 유효한 경우, TourAPI를 통해 현재 화면 주변 실제 장소 조회
    let apiWarmths: Warmth[] = [];
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const places = await PlaceService.getNearbyPlaces({
        lat,
        lng,
        radius: Math.max(radius, 5000),
      });

      places.forEach((p) => {
        const cat = p.category;
        const templates = REVIEW_TEMPLATES[cat] || DEFAULT_TEMPLATES;
        const placeHash = hashStr(p.id || p.name);

        // 장소당 1~2개의 온기 생성
        const count = 1 + (placeHash % 2);
        for (let i = 0; i < count; i++) {
          const tIdx = (placeHash + i) % templates.length;
          const t = templates[tIdx];
          // 0~10일 전의 생성일 분포
          const daysAgo = ((placeHash + i * 3) % 11);
          const createdAt = new Date(now - daysAgo * ONE_DAY - (i * 3600000)).toISOString();

          apiWarmths.push({
            id: `api-${p.id}-${i}`,
            placeId: p.id,
            placeName: p.name,
            lat: p.lat,
            lng: p.lng,
            text: t.text,
            mood: t.mood,
            score: t.mood === '한적' ? 5 : 4,
            tags: t.tags,
            createdAt,
          });
        }
      });
    }

    // 3. API 실시간 온기 + 기본 시드 병합 (중복 장소 방지)
    const placeMap = new Map<string, Warmth>();

    // API 온기 우선 배치
    for (const w of apiWarmths) {
      placeMap.set(w.id, w);
    }
    // 기본 시드 온기 보충
    for (const w of baseWarmths) {
      if (!placeMap.has(w.id)) {
        placeMap.set(w.id, w);
      }
    }

    const allWarmths = Array.from(placeMap.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    return NextResponse.json({
      warmths: allWarmths,
      count: allWarmths.length,
      apiCount: apiWarmths.length,
    });
  } catch (error) {
    console.error('온기 API 조회 실패, 시드 온기로 폴백:', error);
    return NextResponse.json({
      warmths: seedWarmth(now),
      count: seedWarmth(now).length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
