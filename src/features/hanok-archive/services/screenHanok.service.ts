import { apiGet, apiPut, apiDelete } from '@/lib/api/client';

/** 스크린 속 한옥 미디어 매체 분류 코드 */
export type ScreenHanokMediaType = 'K_DRAMA' | 'CINEMA' | 'KPOP';

/** Issue #103: 백엔드 GET /api/v1/hanoks/screen-hanok 응답 한 건 스키마 */
export interface ScreenHanokItem {
  placeId: string;
  name: string;
  region: string;
  imageUrl: string | null;
  mediaType: ScreenHanokMediaType | string;
  categoryLabel: string;
  categoryIcon: string;
  workTitle: string;
  subtitle: string;
  tags: string[];
  sourceUrl: string;
  sourceTitle: string;
  savedByMe: boolean;
}

export interface ScreenHanokResponse {
  total: number;
  items: ScreenHanokItem[];
}

export interface ScreenHanokFilterParams {
  region?: string;
  mediaType?: ScreenHanokMediaType;
}

/** 
 * Issue #103 명세 기반 표준 Fallback 데이터셋
 * 백엔드 실서버 배포 전 또는 오프라인 환경에서도 드라마/영화/K-POP 탭별로 풍부한 큐레이션을 제공합니다.
 */
const FALLBACK_SCREEN_HANOKS: ScreenHanokItem[] = [
  {
    placeId: 'sh-001',
    name: '안동 만휴정',
    region: '경북',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/80/3095780_image2_1.jpg',
    mediaType: 'K_DRAMA',
    categoryLabel: 'K-드라마 · 사극 로케이션',
    categoryIcon: '🎬',
    workTitle: '미스터 션샤인',
    subtitle: '조선 전기 누각과 폭포 계곡, 외나무다리 위에서 유진 초이와 고애신의 시선이 닿던 곳.',
    tags: ['#미스터션샤인', '#외나무다리', '#안동명소', '#사극촬영지'],
    sourceUrl: 'https://korean.visitkorea.or.kr',
    sourceTitle: '[드라마 로케이션] 미스터 션샤인 속 그 고택, 안동 만휴정',
    savedByMe: false,
  },
  {
    placeId: 'sh-002',
    name: '서천 이하복 고택',
    region: '충남',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/50/2654350_image2_1.jpg',
    mediaType: 'K_DRAMA',
    categoryLabel: 'K-드라마 · 사극 로케이션',
    categoryIcon: '🎬',
    workTitle: '미스터 션샤인 / 옷소매 붉은 끝동',
    subtitle: '주인공 애신의 본가로 등장하여 전통 고택의 단아한 멋과 사랑채의 정취를 보여준 장소.',
    tags: ['#옷소매붉은끝동', '#서천고택', '#사극로케이션'],
    sourceUrl: 'https://www.yna.co.kr',
    sourceTitle: '드라마 속 그 명장면, 서천 이하복 가옥의 고즈넉한 봄날',
    savedByMe: true,
  },
  {
    placeId: 'sh-003',
    name: '남원 광한루원',
    region: '전북',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/32/2612132_image2_1.jpg',
    mediaType: 'K_DRAMA',
    categoryLabel: 'K-드라마 · 사극 로케이션',
    categoryIcon: '🎬',
    workTitle: '슈룹 / 구르미 그린 달빛',
    subtitle: '오작교와 완월정의 수려한 호수 야경을 배경으로 조선 왕실의 기품을 담아낸 명소.',
    tags: ['#슈룹', '#구르미그린달빛', '#남원광한루원', '#야경명소'],
    sourceUrl: 'https://korean.visitkorea.or.kr',
    sourceTitle: '달빛 아래 거니는 광한루원, 사극 속 오작교 탐방기',
    savedByMe: false,
  },
  {
    placeId: 'sh-004',
    name: '안동 하회마을 양진당',
    region: '경북',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/82/2567982_image2_1.jpg',
    mediaType: 'CINEMA',
    categoryLabel: '한국 영화 로케이션',
    categoryIcon: '🎥',
    workTitle: '관상',
    subtitle: '조선 시대 고유의 풍광과 대가옥의 위엄을 담아내어 영화 주요 무대로 등장한 종택.',
    tags: ['#영화관상', '#안동하회마을', '#양진당', '#영화촬영지'],
    sourceUrl: 'https://www.chosun.com',
    sourceTitle: '영화 "관상"의 숨은 주역, 안동 하회마을 고택 로케이션',
    savedByMe: false,
  },
  {
    placeId: 'sh-005',
    name: '담양 명옥헌원림',
    region: '전남',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/66/2642566_image2_1.jpg',
    mediaType: 'CINEMA',
    categoryLabel: '한국 영화 로케이션',
    categoryIcon: '🎥',
    workTitle: '음란서생 / 취화선',
    subtitle: '연못 주변 붉은 배롱나무꽃과 누각이 어우러져 한국 전통 원림 미학의 극치를 보여준 무대.',
    tags: ['#취화선', '#한국영화', '#담양명옥헌', '#배롱나무'],
    sourceUrl: 'https://korean.visitkorea.or.kr',
    sourceTitle: '조선의 미학을 필름에 담다, 담양 명옥헌원림',
    savedByMe: true,
  },
  {
    placeId: 'sh-006',
    name: '완주 아원고택',
    region: '전북',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/97/2641097_image2_1.jpg',
    mediaType: 'KPOP',
    categoryLabel: 'K-POP 뮤비 · 화보 로케이션',
    categoryIcon: '🎵',
    workTitle: '방탄소년단 (BTS) 썸머 패키지',
    subtitle: '종남산 자락을 배경으로 250년 된 한옥과 현대 건축 갤러리가 공존하는 글로벌 K-컬처 성지.',
    tags: ['#BTS화보', '#아원고택', '#완주한옥', '#KPOP로케이션'],
    sourceUrl: 'https://korean.visitkorea.or.kr',
    sourceTitle: 'BTS가 반한 완주 아원고택의 고요한 아침',
    savedByMe: false,
  },
  {
    placeId: 'sh-007',
    name: '강릉 선교장',
    region: '강원',
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/21/2655721_image2_1.jpg',
    mediaType: 'KPOP',
    categoryLabel: 'K-POP 뮤비 · 화보 로케이션',
    categoryIcon: '🎵',
    workTitle: '아이유 (IU) 화보 & 사임당',
    subtitle: '활래정과 연못, 노송 숲이 어우러진 99칸 사대부 대저택으로 한국 전통의 우아함을 담은 공간.',
    tags: ['#아이유촬영지', '#강릉선교장', '#활래정', '#K컬처'],
    sourceUrl: 'https://korean.visitkorea.or.kr',
    sourceTitle: '99칸 대저택 선교장에서 만나는 전통 문화의 향기',
    savedByMe: false,
  },
];

/** 정적 Fallback 데이터 필터링 */
function getFallbackScreenHanoks(filter?: ScreenHanokFilterParams): ScreenHanokItem[] {
  let items = [...FALLBACK_SCREEN_HANOKS];

  if (filter?.mediaType) {
    items = items.filter((it) => it.mediaType === filter.mediaType);
  }
  if (filter?.region) {
    items = items.filter((it) => it.region.includes(filter.region!));
  }

  return items;
}

/**
 * ## screenHanokService
 * Issue #103: "스크린 속 한옥 (K-콘텐츠 연계)" 백엔드 API 통신 및 Fallback 전용 서비스 객체
 */
export const screenHanokService = {
  /** 스크린 속 한옥 목록 조회 */
  async getScreenHanoks(params?: ScreenHanokFilterParams): Promise<ScreenHanokItem[]> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.region) queryParams.region = params.region;
      if (params?.mediaType) queryParams.mediaType = params.mediaType;

      const res = await apiGet<ScreenHanokResponse>('/api/v1/hanoks/screen-hanok', queryParams);

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        return res.items;
      }
      return getFallbackScreenHanoks(params);
    } catch {
      // 백엔드 미구동 또는 404/5xx 오류 시 정적 Fallback 데이터로 안전하게 우회
      return getFallbackScreenHanoks(params);
    }
  },

  /** 장소 찜(Saved) 토글 */
  async toggleSavePlace(placeId: string, currentSaved: boolean): Promise<boolean> {
    if (currentSaved) {
      await apiDelete(`/api/v1/saved-resources/places/${encodeURIComponent(placeId)}`);
      return false;
    } else {
      await apiPut(`/api/v1/saved-resources/places/${encodeURIComponent(placeId)}`, {});
      return true;
    }
  },
};
