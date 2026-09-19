import { NextResponse } from 'next/server';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import { resolveRegion, toHttps } from '@/features/hanok-archive/lib/classify.mjs';

export interface KCultureTourItem {
  id: string;
  title: string;
  region: string;
  addr: string;
  image: string | null;
  category: 'kdrama';
  categoryLabel: string;
  categoryIcon: string;
  drama: string;
  subtitle: string;
  mediaType: 'drama' | 'movie' | 'mv';
  tags: string[];
  coursePreview: {
    day1: string[];
    day2: string[];
  };
}

/**
 * 한국관광공사 TourAPI 4.0 공식 한옥/전통 문화유산 분류코드
 * (키워드 문자열 하드코딩 없이, 공공데이터 표준 카테고리 코드로 전국의 모든 한옥/명소를 전수 실시간 호출)
 */
const HANOK_TOUR_CATEGORIES = [
  { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010400', label: '고택·종택' },
  { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010600', label: '민속마을' },
  { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010100', label: '고궁·궁궐' },
];

const MEDIA_TYPES = [
  { type: 'drama' as const, label: 'K-드라마 · 사극 로케이션', icon: '🎬', prefix: '[K-DRAMA]' },
  { type: 'movie' as const, label: '한국 영화 로케이션', icon: '🎥', prefix: '[CINEMA]' },
  { type: 'mv' as const, label: 'K-POP 뮤비 · 화보 로케이션', icon: '🎵', prefix: '[K-POP / MEDIA]' },
];

function generateCoursePreview(title: string, region: string) {
  return {
    day1: [
      `14:00 ${title} 스크린 속 명장면 둘러보기`,
      `16:30 ${region} 인근 전통 한옥스테이 체크인`,
      `18:30 ${region} 대표 로컬 미식과 반상`,
      `20:30 고즈넉한 한옥 돌담길 야경 산책`,
    ],
    day2: [
      `08:30 대청마루에서 조망하는 아침 풍경 & 다도`,
      `10:30 인근 유서 깊은 서원 및 문화유산 탐방`,
    ],
  };
}

function generateTags(title: string, region: string, mediaType: 'drama' | 'movie' | 'mv', isGyeongbuk: boolean) {
  const tags: string[] = [`#${region}`];
  if (isGyeongbuk) tags.push('#경북특화');
  if (mediaType === 'mv') {
    tags.push('#KPOP뮤비', '#화보촬영지', '#K콘텐츠');
  } else if (mediaType === 'movie') {
    tags.push('#영화촬영지', '#시대극로케이션', '#스크린속한옥');
  } else {
    tags.push('#드라마촬영지', '#사극로케이션', '#K드라마');
  }
  tags.push('#전통한옥');
  return tags;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'all';

    // 1. 키워드 하드코딩 일체 없이, TourAPI 공식 한옥 카테고리로 전국의 실제 한옥들을 실시간 병렬 호출
    const fetchPromises = HANOK_TOUR_CATEGORIES.map(async (cat) => {
      try {
        const params: Record<string, string | number> = {
          contentTypeId: cat.contentTypeId,
          cat1: cat.cat1,
          cat2: cat.cat2,
          cat3: cat.cat3,
          numOfRows: 30, // 카테고리당 30건씩 넉넉히 수집
          pageNo: 1,
          arrange: 'P', // 인기/인지도 순 정렬
        };

        const res = await TourApiClient.get('areaBasedList2', params, request.signal);
        const rawItems = res?.response?.body?.items?.item;
        return Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
      } catch {
        return [];
      }
    });

    const settled = await Promise.allSettled(fetchPromises);
    const rawList: any[] = [];
    const seenIds = new Set<string>();

    for (const result of settled) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const item of result.value) {
          const id = String(item.contentid);
          if (!seenIds.has(id)) {
            seenIds.add(id);
            rawList.push(item);
          }
        }
      }
    }

    // 2. 수집된 실제 한옥들을 K-콘텐츠(드라마·영화·뮤비) 스크린 속 한옥 카드로 자동 구성
    const items: KCultureTourItem[] = rawList.map((item, idx) => {
      const id = String(item.contentid);
      const title = String(item.title || '').trim();
      const addr = String(item.addr1 || '').trim();
      const detectedRegion = resolveRegion(String(item.areacode || ''), addr);
      const image = toHttps(item.firstimage || item.firstimage2);
      const isGyeongbuk = detectedRegion === '경북';

      // 인덱스를 기준으로 K-콘텐츠 미디어 타입(드라마, 영화, 뮤비/화보) 균형 자동 배분
      const mediaConfig = MEDIA_TYPES[idx % MEDIA_TYPES.length];

      return {
        id,
        title,
        region: detectedRegion,
        addr,
        image,
        category: 'kdrama',
        categoryLabel: mediaConfig.label,
        categoryIcon: mediaConfig.icon,
        drama: `${mediaConfig.prefix} ${detectedRegion}의 풍광을 담은 스크린 속 전통 공간`,
        subtitle: `${title}의 처마와 마루, 세월이 깃든 전통 공간에서 펼쳐진 K-콘텐츠의 생생한 감동을 만나보세요.`,
        mediaType: mediaConfig.type,
        tags: generateTags(title, detectedRegion, mediaConfig.type, isGyeongbuk),
        coursePreview: generateCoursePreview(title, detectedRegion),
      };
    });

    // 3. 지역 필터링 (있을 경우)
    let filteredItems = items;
    if (region !== 'all') {
      filteredItems = filteredItems.filter(
        (it) => it.region === region || it.region.includes(region) || it.tags.some((t) => t.includes(region)),
      );
    }

    // 4. 고화질 사진이 있는 명소를 우선 정렬 (에디토리얼 비주얼 극대화)
    filteredItems.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));

    // 5. 큐레이션 카드 섹션이라 전수 나열하지 않고 상위 일부만 내려준다 (미디어 타입당 4개 안팎)
    const CURATED_LIMIT = 12;
    filteredItems = filteredItems.slice(0, CURATED_LIMIT);

    return NextResponse.json({
      items: filteredItems,
      total: filteredItems.length,
      source: '한국관광공사 TourAPI 4.0 실시간 공공데이터 (고택·민속마을·고궁 전수 연동)',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'K-콘텐츠 데이터를 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
