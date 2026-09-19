import { apiGet, apiPut, apiDelete } from '@/lib/api/client';
import { KCULTURE_THEME_ITEMS, type KCultureThemeItem } from '@/features/hanok-archive/data/kcultureThemes';

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

/** 정적 Fallback 데이터 매퍼: 백엔드 장애 또는 로컬 개발 시 Issue #103 규격으로 변환 */
function getFallbackScreenHanoks(filter?: ScreenHanokFilterParams): ScreenHanokItem[] {
  const curated = KCULTURE_THEME_ITEMS.filter((item) => item.category === 'kdrama');

  let items: ScreenHanokItem[] = curated.map((item) => {
    let mediaType: ScreenHanokMediaType = 'K_DRAMA';
    let categoryLabel = 'K-드라마 · 사극 로케이션';
    let categoryIcon = '🎬';

    if (item.mediaType === 'movie') {
      mediaType = 'CINEMA';
      categoryLabel = '한국 영화 로케이션';
      categoryIcon = '🎥';
    } else if (item.mediaType === 'mv') {
      mediaType = 'KPOP';
      categoryLabel = 'K-POP 뮤비 · 화보 로케이션';
      categoryIcon = '🎵';
    }

    return {
      placeId: `fallback-${item.id}`,
      name: item.title,
      region: item.region,
      imageUrl: item.image,
      mediaType,
      categoryLabel,
      categoryIcon,
      workTitle: item.eyebrow,
      subtitle: item.subtitle,
      tags: item.tags,
      sourceUrl: 'https://korean.visitkorea.or.kr',
      sourceTitle: `${item.title} 로케이션 탐방`,
      savedByMe: false,
    };
  });

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
      // 백엔드 미구동 또는 5xx 오류 시 정적 Fallback 데이터로 안전하게 우회
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
