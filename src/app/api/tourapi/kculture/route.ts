import { NextResponse } from 'next/server';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import { resolveRegion, toHttps } from '@/features/hanok-archive/lib/classify.mjs';

export interface KCultureTourItem {
  id: string;
  title: string;
  region: string;
  addr: string;
  image: string | null;
  category: 'kdrama' | 'night' | 'heritage_food';
  categoryLabel: string;
  categoryIcon: string;
  drama: string;
  tags: string[];
  coursePreview: {
    day1: string[];
    day2: string[];
  };
}

const REGION_TO_AREA_CODE: Record<string, string> = {
  서울: '1',
  인천: '2',
  대전: '3',
  대구: '4',
  광주: '5',
  부산: '6',
  울산: '7',
  세종: '8',
  경기: '31',
  강원: '32',
  충북: '33',
  충남: '34',
  경북: '35',
  경남: '36',
  전북: '37',
  전남: '38',
  제주: '39',
};

/**
 * K-컬처 3대 테마별 동적 검색 설정
 * 1. 🎬 K-드라마 명장면: contentTypeId=12 (관광지/문화유산 로케이션)
 * 2. 🌙 달빛 야간기행: contentTypeId=15 (행사/축제/야행/달빛기행)
 * 3. 🍵 종가 다도 & 미식: contentTypeId=12/39 (전통체험/종가/한식)
 */
const THEME_SEARCH_CONFIGS = [
  {
    category: 'kdrama' as const,
    categoryLabel: 'K-드라마 명장면',
    categoryIcon: '🎬',
    contentTypeId: '12',
    keywords: ['촬영지', '미스터션샤인', '킹덤', '드라마', '만휴정', '선교장', '광한루원', '창덕궁', '남산골'],
    defaultDrama: 'K-콘텐츠 & 드라마 속 전통 문화유산',
  },
  {
    category: 'night' as const,
    categoryLabel: '달빛 야간기행',
    categoryIcon: '🌙',
    contentTypeId: '15',
    keywords: ['야행', '달빛기행', '야간', '별빛', '문화유산야행', '야간개장'],
    defaultDrama: '한국관광공사 국가유산 달빛 야간 축제',
  },
  {
    category: 'heritage_food' as const,
    categoryLabel: '종가 다도 & 미식',
    categoryIcon: '🍵',
    contentTypeId: '39',
    keywords: ['종가', '다도', '전통차', '헛제사밥', '내림음식', '선비촌', '운조루', '일두고택'],
    defaultDrama: '수백 년 전통 종가 내림 발효 손맛과 다도',
  },
];

function generateCoursePreview(title: string, region: string, category: 'kdrama' | 'night' | 'heritage_food') {
  if (category === 'kdrama') {
    return {
      day1: [
        `14:00 ${title} 촬영 명소 및 문화유산 탐방`,
        `16:30 ${region} 인근 전통 한옥스테이 체크인`,
        `18:30 ${region} 로컬 대표 향토 미식`,
        `20:30 고즈넉한 한옥 돌담길 야경 산책`,
      ],
      day2: [
        `08:30 아침 풍경을 조망하며 즐기는 모닝 티`,
        `10:30 인근 역사문화 유적지 및 서원 둘러보기`,
      ],
    };
  }
  if (category === 'night') {
    return {
      day1: [
        `15:30 ${region} 감성 골목길 투어 및 한옥 입실`,
        `17:30 로컬 향토 정식 식사`,
        `19:30 ${title} 청사초롱 달빛 야간 투어`,
        `21:00 밤하늘 별빛과 야경 감상`,
      ],
      day2: [
        `09:00 아침 숲길 & 고택 마루 산책`,
        `11:30 인근 전통 시장 및 로컬 카페 쉼`,
      ],
    };
  }
  return {
    day1: [
      `14:30 ${title} 종택 및 고택 둘러보기`,
      `16:00 대청마루에서 즐기는 전통 다도 체험`,
      `18:30 수백 년 내림 손맛의 전통 한정식`,
      `20:30 처마 밑 풀벌레 소리와 밤하늘 사색`,
    ],
    day2: [
      `08:30 맑은 아침 조식 & 차 한 잔`,
      `10:30 인근 명소 및 자연 생태길 산책`,
    ],
  };
}

function generateTags(title: string, region: string, category: 'kdrama' | 'night' | 'heritage_food', isGyeongbuk: boolean) {
  const tags: string[] = [`#${region}`];
  if (isGyeongbuk) tags.push('#경북특화');
  if (category === 'kdrama') {
    tags.push('#드라마촬영지', '#K콘텐츠', '#문화유산');
  } else if (category === 'night') {
    tags.push('#야행', '#달빛기행', '#청사초롱', '#야간개장');
  } else {
    tags.push('#종가음식', '#전통다도', '#내림발효', '#한옥미식');
  }
  tags.push('#TourAPI공공데이터');
  return tags;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const region = searchParams.get('region') || 'all';

    // 1. 카테고리 필터링
    let selectedConfigs = THEME_SEARCH_CONFIGS;
    if (category !== 'all') {
      selectedConfigs = selectedConfigs.filter((cfg) => cfg.category === category);
    }

    const areaCode = region !== 'all' ? REGION_TO_AREA_CODE[region] : undefined;

    // 2. TourAPI 동적 실시간 쿼리 실행
    const fetchPromises = selectedConfigs.flatMap((cfg) =>
      cfg.keywords.map(async (keyword) => {
        try {
          const params: Record<string, string | number> = {
            contentTypeId: cfg.contentTypeId,
            keyword,
            numOfRows: 4,
            pageNo: 1,
            arrange: 'P',
          };
          if (areaCode) {
            params.areaCode = areaCode;
          }

          const res = await TourApiClient.get('searchKeyword2', params, request.signal);
          const rawItems = res?.response?.body?.items?.item;
          const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

          return list.map((item) => {
            const id = String(item.contentid);
            const title = String(item.title || '').trim();
            const addr = String(item.addr1 || '').trim();
            const detectedRegion = resolveRegion(String(item.areacode || ''), addr);
            const image = toHttps(item.firstimage || item.firstimage2);
            const isGyeongbuk = detectedRegion === '경북';

            return {
              id,
              title,
              region: detectedRegion,
              addr,
              image,
              category: cfg.category,
              categoryLabel: cfg.categoryLabel,
              categoryIcon: cfg.categoryIcon,
              drama: cfg.defaultDrama,
              tags: generateTags(title, detectedRegion, cfg.category, isGyeongbuk),
              coursePreview: generateCoursePreview(title, detectedRegion, cfg.category),
            } satisfies KCultureTourItem;
          });
        } catch {
          return [] as KCultureTourItem[];
        }
      }),
    );

    const settled = await Promise.allSettled(fetchPromises);
    const allItems: KCultureTourItem[] = [];
    const seenIds = new Set<string>();

    for (const result of settled) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const it of result.value) {
          if (!seenIds.has(it.id)) {
            seenIds.add(it.id);
            allItems.push(it);
          }
        }
      }
    }

    // 3. 지역 필터링 (파라미터가 있을 경우 2차 보정)
    let filteredItems = allItems;
    if (region !== 'all') {
      filteredItems = filteredItems.filter(
        (it) => it.region === region || it.region.includes(region) || it.tags.some((t) => t.includes(region)),
      );
    }

    // 이미지가 있는 항목을 우선 정렬
    filteredItems.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));

    return NextResponse.json({
      items: filteredItems,
      total: filteredItems.length,
      source: 'TourAPI 4.0 KorService2 실시간 공공데이터',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'K-컬처 투어 데이터를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
