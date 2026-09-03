import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import type { RankedPlace } from '@/map/types';
import { toHttps } from '@/map/utils/formatters';

const CACHE_TTL = 10 * 60 * 1000; // 10분

interface PopularCacheEntry {
  expiresAt: number;
  data: {
    region: string;
    items: RankedPlace[];
    topPlace: RankedPlace | null;
  };
}

export class PopularPlaceService {
  private static cache = new Map<string, PopularCacheEntry>();

  /**
   * 한국관광공사 TourAPI 조회순(arrange P/Q) 정렬 결과를 그대로 순위로 쓴다.
   *
   * 여기서 만들어내는 값은 없다. 예전에는 helpfulCount를 `95 - idx * 6`으로,
   * 혼잡도를 순위 인덱스로 지어내 화면에 "도움돼요 95개 · 혼잡"으로 띄웠다.
   * 근거가 없는 숫자라 전부 걷어냈고, 화면에는 순위와 출처만 남는다.
   */
  public static async getPopularPlaces(region = 'all'): Promise<{
    region: string;
    items: RankedPlace[];
    topPlace: RankedPlace | null;
  }> {
    const cacheKey = `popular_${region}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const signal = AbortSignal.timeout(10000);
    const keyword = region === 'all' || region === '전국' ? '한옥' : region;

    try {
      // 1. TourAPI 키워드 조회순(arrange: 'P' / 'Q') 실시간 병렬 요청
      const [keywordRes, areaRes] = await Promise.allSettled([
        TourApiClient.get(
          'searchKeyword2',
          {
            keyword,
            contentTypeId: '12',
            arrange: 'P',
            numOfRows: 15,
          },
          signal,
        ),
        TourApiClient.get(
          'searchKeyword2',
          {
            keyword: `${keyword} 한옥`,
            arrange: 'Q',
            numOfRows: 10,
          },
          signal,
        ),
      ]);

      const rawItems1 = keywordRes.status === 'fulfilled' ? keywordRes.value?.response?.body?.items?.item : null;
      const rawItems2 = areaRes.status === 'fulfilled' ? areaRes.value?.response?.body?.items?.item : null;

      const list1 = Array.isArray(rawItems1) ? rawItems1 : rawItems1 ? [rawItems1] : [];
      const list2 = Array.isArray(rawItems2) ? rawItems2 : rawItems2 ? [rawItems2] : [];
      const combined = [...list1, ...list2] as Record<string, unknown>[];

      const seen = new Set<string>();
      const items: RankedPlace[] = [];

      for (const item of combined) {
        const id = String(item.contentid);
        if (!id || seen.has(id)) continue;
        seen.add(id);

        const title = String(item.title || '').trim();
        const y = Number(item.mapy);
        const x = Number(item.mapx);
        if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;

        items.push({
          placeId: id,
          placeName: title,
          placeType: '한국관광공사 조회순',
          placeRegion: region === 'all' ? '전국' : region,
          image: toHttps(String(item.firstimage || item.firstimage2 || '')) || null,
          lat: y,
          lng: x,
        });

        if (items.length >= 10) break;
      }

      const result = {
        region: region === 'all' ? '전국' : region,
        items,
        topPlace: items[0] || null,
      };

      this.cache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL,
        data: result,
      });

      return result;
    } catch {
      return {
        region: region === 'all' ? '전국' : region,
        items: [],
        topPlace: null,
      };
    }
  }
}
