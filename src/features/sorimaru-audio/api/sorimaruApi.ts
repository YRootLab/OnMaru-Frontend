import { SorimaruStoryItem, SorimaruCategory, SorimaruStoryPage } from '@/features/sorimaru-audio/types/sorimaru.types';
import { SorimaruNetworkClient, sorimaruNetworkClient } from './sorimaruNetwork';

// v3는 이전 구현에서 저장한 빈/불완전 응답 캐시를 사용하지 않도록 의도적으로 무효화한다.
const DAILY_CACHE_PREFIX = 'onmaru_sorimaru_api_cache_v4';
const dailyMemoryCache = new Map<string, unknown>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function dailyCacheKey(requestKey: string): string {
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return `${DAILY_CACHE_PREFIX}:${localDate}:${requestKey}`;
}

function readDailyCache<T>(requestKey: string): T | undefined {
  const key = dailyCacheKey(requestKey);
  if (dailyMemoryCache.has(key)) return dailyMemoryCache.get(key) as T;
  if (typeof window === 'undefined') return undefined;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return undefined;
    const parsed = JSON.parse(stored) as T;
    dailyMemoryCache.set(key, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

function writeDailyCache<T>(requestKey: string, value: T): void {
  const key = dailyCacheKey(requestKey);
  dailyMemoryCache.set(key, value);
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 용량/권한 문제는 API 응답 자체를 막지 않는다.
  }
}

async function getCachedRequest<T>(
  requestKey: string,
  request: () => Promise<T>,
  shouldCache: (value: T) => boolean = () => true,
): Promise<T> {
  const cached = readDailyCache<T>(requestKey);
  if (cached !== undefined) {
    console.info('[Sorimaru Cache] hit', { requestKey });
    return cached;
  }

  const existing = inFlightRequests.get(dailyCacheKey(requestKey));
  if (existing) return existing as Promise<T>;

  const pending = request().then((value) => {
    if (shouldCache(value)) writeDailyCache(requestKey, value);
    else console.info('[Sorimaru Cache] skip empty response', { requestKey });
    return value;
  }).finally(() => {
    inFlightRequests.delete(dailyCacheKey(requestKey));
  });

  inFlightRequests.set(dailyCacheKey(requestKey), pending);
  return pending;
}

// 테마 카테고리에 대응하는 Sorimaru API 키워드 매핑
const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  '한옥/고택': '한옥',
  '서원/향교': '서원',
  '전통시장/장터': '시장',
  '마을/골목길': '마을',
  '궁궐/역사': '궁',
  '사찰/산사': '사찰',
  '소리/문화': '소리',
  '박물관/미술관': '박물관',
  '자연/둘레길': '길',
  '한옥': '한옥',
  '궁': '궁',
  '고택': '고택',
  '북촌': '북촌',
  '전주': '전주',
  '경주': '경주',
  '안동': '안동',
  '서울': '서울',
  '제주': '제주',
  '부산': '부산',
  '대구': '대구',
  '전통시장': '시장'
};

const KEYWORD_SYNONYMS: Record<string, string[]> = {
  한옥: ['한옥', '고택', '한옥마을', '대청마루'],
  서원: ['서원', '향교', '선비', '서당', '유교'],
  시장: ['시장', '장터', '시전', '전통시장', '장사'],
  사찰: ['사찰', '산사', '절', '사원', '종소리'],
  마을: ['마을', '골목', '한옥마을', '슬로시티'],
};

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const readText = (item: Record<string, unknown>, key: string): string => toText(item[key]);

const isPlayableStory = (story: SorimaruStoryItem): boolean => toText(story.audioUrl).length > 0;

const matchesKeyword = (story: SorimaruStoryItem, keyword: string): boolean => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const terms = [normalizedKeyword, ...(KEYWORD_SYNONYMS[normalizedKeyword] || [])];
  const searchableText = [story.category, story.title, story.audioTitle, story.locationName, story.script]
    .map((value) => toText(value).toLowerCase())
    .join(' ');

  return terms.some((term) => searchableText.includes(term.toLowerCase()));
};



function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.max(100, Math.round(distanceKm * 1000))}m`;
  return `${distanceKm.toFixed(1)}km`;
}

function calculateDistanceKm(fromX: string, fromY: string, toX: string, toY: string): number | null {
  const longitude = Number(fromX);
  const latitude = Number(fromY);
  const targetLongitude = Number(toX);
  const targetLatitude = Number(toY);
  if (![longitude, latitude, targetLongitude, targetLatitude].every(Number.isFinite)) return null;

  const earthRadiusKm = 6371;
  const latitudeDelta = (targetLatitude - latitude) * Math.PI / 180;
  const longitudeDelta = (targetLongitude - longitude) * Math.PI / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude * Math.PI / 180) * Math.cos(targetLatitude * Math.PI / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function mapStoryItem(item: Record<string, unknown>, index: number, category?: string, origin?: { mapX: string; mapY: string }): SorimaruStoryItem {
  const title = readText(item, 'title') || readText(item, 'storyTitle') || '한국의 문화 이야기';
  const stid = readText(item, 'stid') || readText(item, 'tid') || String(index + 1);
  const audioUrl = readText(item, 'audioUrl').replace(/^http:\/\//i, 'https://');
  const playTime = readText(item, 'playTime') || '180';
  const playTimeSeconds = Number(playTime);
  const imageUrl = readText(item, 'imageUrl') || readText(item, 'firstimage') || readText(item, 'image');
  const mapX = readText(item, 'mapX') || '126.9780';
  const mapY = readText(item, 'mapY') || '37.5665';
  const distance = origin ? calculateDistanceKm(origin.mapX, origin.mapY, mapX, mapY) : null;

  return {
    tid: readText(item, 'tid'),
    tlid: readText(item, 'tlid'),
    stid,
    stlid: readText(item, 'stlid'),
    title,
    audioTitle: readText(item, 'audioTitle') || readText(item, 'storyTitle') || title || '오디오 해설',
    speaker: '문화해설사 도슨트',
    category: (category && category !== '전체' ? category : '') as SorimaruCategory || readText(item, 'themaCategory') || '소리 이야기',
    distance: distance === null ? undefined : formatDistance(distance),
    mapX,
    mapY,
    script: readText(item, 'script') || '해설 대본 정보가 준비 중입니다.',
    playTime,
    formattedDuration: Number.isFinite(playTimeSeconds)
      ? `${Math.floor(playTimeSeconds / 60)}분 ${String(playTimeSeconds % 60).padStart(2, '0')}초`
      : '3분 00초',
    audioUrl,
    imageUrl,
    locationName: [readText(item, 'addr1'), readText(item, 'addr2')].filter(Boolean).join(' ') || '대한민국 문화유산',
    badgeText: (category && category !== '전체' && category !== '오디 이야기' && category !== '소리 이야기')
      ? category
      : readText(item, 'themaCategory') || [readText(item, 'addr1'), readText(item, 'addr2')].filter(Boolean).join(' ') || '대한민국 문화유산',
  };
}

/**
 * 한국관광공사 오디(Sorimaru) API 어댑터
 */
export const createSorimaruApiAdapter = (network: SorimaruNetworkClient = sorimaruNetworkClient) => {
  const adapter = {
  /**
   * 오디오 이야기 목록 조회 (카테고리 & 검색어 필터링)
   */
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

      const response = await network.request({
        type: 'stories',
        params: {
          numOfRows: String(safeNumOfRows),
          pageNo: String(safePageNo),
          ...(keyword ? { keyword } : {}),
        },
      });
      const mappedStories = response.items
        .map((item, index) => mapStoryItem(item, index, category || keyword))
        .filter(isPlayableStory);
      return {
        items: mappedStories,
        pageNo: safePageNo,
        numOfRows: safeNumOfRows,
        totalCount: mappedStories.length < response.totalCount ? mappedStories.length : response.totalCount || mappedStories.length,
        source: 'api',
      };
      } catch (error) {
        console.warn('[Sorimaru API Warning] API 호출 실패:', error);
        throw error instanceof Error ? error : new Error('Sorimaru API request failed');
      }
    }, (value) => value.items.length > 0);
  },

  /**
   * 챕터가 사용할 첫 번째 재생 가능 오디오를 찾는다.
   * API 응답에 음원이 없거나 검색 결과가 비어 있으면 상위 컨테이너가 전달한
   * 후보 목록과 기존 Mock 목록에서 같은 키워드를 안전하게 찾는다.
   */
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

  /**
   * 특정 이야기 상세 정보 조회
   */
  async getStoryDetail(stid: string): Promise<SorimaruStoryItem | null> {
    const list = await this.getStoryList();
    const found = list.find((s) => s.stid === stid);
    return found || null;
  },

  /**
   * 위치 기반(LBS) 내 주변 이야기 목록 조회
   */
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
    }, (value) => value.length > 0);
  }
  };

  return adapter;
};

export const sorimaruApiAdapter = createSorimaruApiAdapter();
