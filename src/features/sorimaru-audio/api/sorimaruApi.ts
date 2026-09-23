import { SorimaruStoryItem, SorimaruCategory, SorimaruStoryPage } from '@/features/sorimaru-audio/types/sorimaru.types';
import { SorimaruNetworkClient, sorimaruNetworkClient } from './sorimaruNetwork';
import {
  isPlayableStory,
  matchesKeyword,
  calculateDistanceKm,
  mapStoryItem,
  CATEGORY_KEYWORD_MAP,
} from '@/features/sorimaru-audio/domain/sorimaruStoryRules';


// Single Source of Truth: 캐싱은 백엔드에서 처리
// 프론트는 직접 API 호출만 함 (캐싱 제거)

async function getCachedRequest<T>(
  requestKey: string,
  request: () => Promise<T>,
): Promise<T> {
  // 백엔드가 캐싱을 처리하므로 프론트는 직접 호출만 함
  return request();
}


export const createSorimaruApiAdapter = (network: SorimaruNetworkClient = sorimaruNetworkClient) => {
  const adapter = {



  async getStoryList(category?: SorimaruCategory | string, query?: string): Promise<SorimaruStoryItem[]> {
    const page = await this.getStoryPage(category, query, 1, 30);
    return page.items;
  },

  async getStoryPage(
    category?: SorimaruCategory | string,
    query?: string,
    pageNo = 1,
    numOfRows = 12,
  ): Promise<SorimaruStoryPage> {
    const safePageNo = Math.max(1, pageNo);
    const safeNumOfRows = Math.min(30, Math.max(1, numOfRows));
    let keyword = query?.trim() || '';
    if (!keyword && category && category !== '전체') {
      keyword = CATEGORY_KEYWORD_MAP[category] || category;
    }

    const requestKey = `stories:${category || ''}:${keyword}:${safePageNo}:${safeNumOfRows}`;

    return getCachedRequest(requestKey, async () => {
      try {

      const request = {
        type: 'stories',
        params: {
          numOfRows: String(safeNumOfRows),
          pageNo: String(safePageNo),
          ...(keyword ? { keyword } : {}),
        },
      } as const;
      let response = await network.request(request);
      let mappedStories = response.items
        .map((item, index) => mapStoryItem(item, index, category || keyword))
        .filter(isPlayableStory);

      if (keyword && response.source === 'backend') {
        const matchingStories = mappedStories.filter((story) => matchesKeyword(story, keyword));
        if (matchingStories.length > 0) {
          mappedStories = matchingStories;
        } else {
          response = await network.request({ ...request, preferBackend: false });
          mappedStories = response.items
            .map((item, index) => mapStoryItem(item, index, category || keyword))
            .filter(isPlayableStory);
        }
      }
      return {
        items: mappedStories,
        pageNo: safePageNo,
        numOfRows: safeNumOfRows,
        totalCount: response.source === 'backend'
          ? (response.hasMore ? Math.max(safeNumOfRows + 1, mappedStories.length) : mappedStories.length)
          : (mappedStories.length < response.totalCount ? mappedStories.length : response.totalCount || mappedStories.length),
        source: 'api',
      };
      } catch (error) {
        console.warn('[Sorimaru API Warning] API 호출 실패:', error);
        throw error instanceof Error ? error : new Error('Sorimaru API request failed');
      }
    });
  },






  async getFirstStoryByKeyword(keyword: string, fallbackStories: SorimaruStoryItem[] = []): Promise<SorimaruStoryItem | null> {
    const apiStories = await this.getStoryList(undefined, keyword);
    const pool = [...apiStories, ...fallbackStories];
    const exactMatch = pool.find((story) => isPlayableStory(story) && matchesKeyword(story, keyword));
    if (exactMatch) return exactMatch;

    return pool.find(isPlayableStory) || null;
  },

  async getChapterStorySets(keywords: string[], fallbackStories: SorimaruStoryItem[] = []): Promise<Record<string, SorimaruStoryItem[]>> {
    const entries = await Promise.all(
      keywords.map(async (keyword) => {
        const apiStories = await this.getStoryList(undefined, keyword);
        const pool = [...apiStories, ...fallbackStories];
        const uniqueStories = Array.from(new Map(pool.map((story) => [story.stid, story])).values());
        const playableMatches = uniqueStories.filter((story) => isPlayableStory(story) && matchesKeyword(story, keyword));
        const matchedStories = playableMatches.length > 0
          ? playableMatches
          : uniqueStories.filter(isPlayableStory);

        return [keyword, matchedStories.slice(0, 4)] as const;
      }),
    );

    return Object.fromEntries(entries);
  },

  async getChapterStories(keywords: string[], fallbackStories: SorimaruStoryItem[] = []): Promise<Record<string, SorimaruStoryItem | null>> {
    const storySets = await this.getChapterStorySets(keywords, fallbackStories);
    return Object.fromEntries(keywords.map((keyword) => [keyword, storySets[keyword]?.[0] || null]));
  },




  async getStoryDetail(stid: string): Promise<SorimaruStoryItem | null> {
    const list = await this.getStoryList();
    const found = list.find((s) => s.stid === stid);
    return found || null;
  },




  async getNearbyStories(mapX?: string, mapY?: string, radius = 3000): Promise<SorimaruStoryItem[]> {
    if (!mapX || !mapY) return this.getStoryList('한옥');

    const requestKey = `nearby:${mapX}:${mapY}:${radius}`;

    return getCachedRequest(requestKey, async () => {
      try {
        const response = await network.request({
          type: 'nearby',
          params: { xCoord: mapX, yCoord: mapY, radius: String(radius) },
        });
        return response.items
          .map((item, index) => mapStoryItem(item, index, '내 주변', { mapX, mapY }))
          .sort((left, right) => (
            (calculateDistanceKm(mapX, mapY, left.mapX, left.mapY) ?? Number.POSITIVE_INFINITY)
            - (calculateDistanceKm(mapX, mapY, right.mapX, right.mapY) ?? Number.POSITIVE_INFINITY)
          ));
      } catch (error) {
        console.warn('[Sorimaru Nearby Warning] 위치 기반 조회 실패:', error);
        throw error instanceof Error ? error : new Error('Sorimaru nearby request failed');
      }
    });
  }
  };

  return adapter;
};

export const sorimaruApiAdapter = createSorimaruApiAdapter();
