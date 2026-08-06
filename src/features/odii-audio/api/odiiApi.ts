import { OdiiStoryItem, OdiiCategory, OdiiStoryPage } from '../types/odii.types';
import { MOCK_ODII_STORIES } from './odiiMockData';

const BASE_URL = process.env.NEXT_PUBLIC_ODII_API_URL || 'https://apis.data.go.kr/B551011/Odii';
const API_KEY = process.env.NEXT_PUBLIC_ODII_API_KEY || process.env.ODII_API_KEY || '';

// 테마 카테고리에 대응하는 Odii API 키워드 매핑
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

const isPlayableStory = (story: OdiiStoryItem): boolean => toText(story.audioUrl).length > 0;

const matchesKeyword = (story: OdiiStoryItem, keyword: string): boolean => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const terms = [normalizedKeyword, ...(KEYWORD_SYNONYMS[normalizedKeyword] || [])];
  const searchableText = [story.category, story.title, story.audioTitle, story.locationName, story.script]
    .map((value) => toText(value).toLowerCase())
    .join(' ');

  return terms.some((term) => searchableText.includes(term.toLowerCase()));
};



// 고품질 기본 앨범아트 Fallback 목록
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80', // 한옥/궁
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80', // 고택
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80', // 골목
  'https://images.unsplash.com/photo-1528164344705-47542687990d?auto=format&fit=crop&w=800&q=80', // 단청
];

function getRandomFallbackImage(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

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

function mapStoryItem(item: Record<string, unknown>, index: number, category?: string, origin?: { mapX: string; mapY: string }): OdiiStoryItem {
  const title = readText(item, 'title') || readText(item, 'storyTitle') || '한국의 문화 이야기';
  const stid = readText(item, 'stid') || readText(item, 'tid') || String(index + 1);
  const audioUrl = readText(item, 'audioUrl') || readText(item, 'audio') || readText(item, 'playUrl') || readText(item, 'mp3Url');
  const playTime = readText(item, 'playTime') || readText(item, 'audioTime') || '180';
  const playTimeSeconds = Number(playTime);
  const imageUrl = readText(item, 'imageUrl').length > 0
    ? readText(item, 'imageUrl')
    : getRandomFallbackImage(stid + title);
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
    category: (category && category !== '전체' ? category : '') as OdiiCategory || readText(item, 'themaCategory') || '오디 이야기',
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
    badgeText: audioUrl ? '음원 제공' : '대본 전용',
  };
}

/**
 * 한국관광공사 오디(Odii) API 어댑터
 */
export const odiiApiAdapter = {
  /**
   * 오디오 이야기 목록 조회 (카테고리 & 검색어 필터링)
   */
  async getStoryList(category?: OdiiCategory | string, query?: string): Promise<OdiiStoryItem[]> {
    const page = await this.getStoryPage(category, query, 1, 30);
    return page.items;
  },

  async getStoryPage(
    category?: OdiiCategory | string,
    query?: string,
    pageNo = 1,
    numOfRows = 12,
  ): Promise<OdiiStoryPage> {
    const safePageNo = Math.max(1, pageNo);
    const safeNumOfRows = Math.min(30, Math.max(1, numOfRows));
    let keyword = query?.trim() || '';
    if (!keyword && category && category !== '전체') {
      keyword = CATEGORY_KEYWORD_MAP[category] || category;
    }

    if (!API_KEY) {
      const filtered = await this.getMockFiltered(category, query);
      const start = (safePageNo - 1) * safeNumOfRows;
      return {
        items: filtered.slice(start, start + safeNumOfRows),
        pageNo: safePageNo,
        numOfRows: safeNumOfRows,
        totalCount: filtered.length,
        source: 'mock',
      };
    }

    try {
      const endpoint = keyword ? 'storySearchList' : 'storyBasedList';
      const params: Record<string, string> = {
        MobileOS: 'ETC',
        MobileApp: 'OnMaruFE',
        _type: 'json',
        langCode: 'ko',
        numOfRows: String(safeNumOfRows),
        pageNo: String(safePageNo),
      };
      if (keyword) params.keyword = keyword;

      const paramStr = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const url = `${BASE_URL}/${endpoint}?serviceKey=${API_KEY}&${paramStr}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const json = await res.json();
      const body = json?.response?.body;
      const rawItems = body?.items?.item;
      const itemList = rawItems
        ? (Array.isArray(rawItems) ? rawItems : [rawItems]) as Record<string, unknown>[]
        : [];
      const mappedStories = itemList.map((item, index) => mapStoryItem(item, index, category));
      if (mappedStories.length === 0 && safePageNo === 1) {
        const fallback = await this.getMockFiltered(category, query);
        return { items: fallback.slice(0, safeNumOfRows), pageNo: 1, numOfRows: safeNumOfRows, totalCount: fallback.length, source: 'mock' };
      }

      return {
        items: mappedStories,
        pageNo: safePageNo,
        numOfRows: safeNumOfRows,
        totalCount: Number(body?.totalCount) || mappedStories.length,
        source: 'api',
      };
    } catch (error) {
      console.error('[Odii API Error] API 호출 실패, Fallback 데이터 전환:', error);
      const fallback = await this.getMockFiltered(category, query);
      const start = (safePageNo - 1) * safeNumOfRows;
      return {
        items: fallback.slice(start, start + safeNumOfRows),
        pageNo: safePageNo,
        numOfRows: safeNumOfRows,
        totalCount: fallback.length,
        source: 'mock',
      };
    }
  },

  /**
   * Mock 데이터 필터링 헬퍼
   */
  async getMockFiltered(category?: string, query?: string): Promise<OdiiStoryItem[]> {
    await new Promise((r) => setTimeout(r, 50));
    let filtered = MOCK_ODII_STORIES;

    if (category && category !== '전체') {
      const categoryKeyword = CATEGORY_KEYWORD_MAP[category] || category;
      filtered = filtered.filter((story) => matchesKeyword(story, categoryKeyword));
    }

    if (query && query.trim().length > 0) {
      filtered = filtered.filter((story) => matchesKeyword(story, query));
    }

    return filtered;
  },

  /**
   * 챕터가 사용할 첫 번째 재생 가능 오디오를 찾는다.
   * API 응답에 음원이 없거나 검색 결과가 비어 있으면 상위 컨테이너가 전달한
   * 후보 목록과 기존 Mock 목록에서 같은 키워드를 안전하게 찾는다.
   */
  async getFirstStoryByKeyword(keyword: string, fallbackStories: OdiiStoryItem[] = []): Promise<OdiiStoryItem | null> {
    const apiStories = await this.getStoryList(undefined, keyword);
    const pool = [...apiStories, ...fallbackStories, ...MOCK_ODII_STORIES];
    const exactMatch = pool.find((story) => isPlayableStory(story) && matchesKeyword(story, keyword));
    if (exactMatch) return exactMatch;

    return pool.find(isPlayableStory) || null;
  },

  async getChapterStorySets(keywords: string[], fallbackStories: OdiiStoryItem[] = []): Promise<Record<string, OdiiStoryItem[]>> {
    const entries = await Promise.all(
      keywords.map(async (keyword) => {
        const apiStories = await this.getStoryList(undefined, keyword);
        const pool = [...apiStories, ...fallbackStories, ...MOCK_ODII_STORIES];
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

  async getChapterStories(keywords: string[], fallbackStories: OdiiStoryItem[] = []): Promise<Record<string, OdiiStoryItem | null>> {
    const storySets = await this.getChapterStorySets(keywords, fallbackStories);
    return Object.fromEntries(keywords.map((keyword) => [keyword, storySets[keyword]?.[0] || null]));
  },

  /**
   * 특정 이야기 상세 정보 조회
   */
  async getStoryDetail(stid: string): Promise<OdiiStoryItem | null> {
    const list = await this.getStoryList();
    const found = list.find((s) => s.stid === stid);
    return found || MOCK_ODII_STORIES.find((s) => s.stid === stid) || null;
  },

  /**
   * 위치 기반(LBS) 내 주변 이야기 목록 조회
   */
  async getNearbyStories(mapX?: string, mapY?: string, radius = 3000): Promise<OdiiStoryItem[]> {
    if (!mapX || !mapY || !API_KEY) return this.getStoryList('한옥');

    try {
      const params = new URLSearchParams({
        serviceKey: API_KEY,
        MobileOS: 'ETC',
        MobileApp: 'OnMaruFE',
        _type: 'json',
        lang: 'ko',
        xCoord: mapX,
        yCoord: mapY,
        radius: String(radius),
      });
      const res = await fetch(`${BASE_URL}/storyLocationBasedList?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      const rawItems = json?.response?.body?.items?.item;
      if (!rawItems) return [];
      const itemList = (Array.isArray(rawItems) ? rawItems : [rawItems]) as Record<string, unknown>[];
      return itemList
        .map((item, index) => mapStoryItem(item, index, '내 주변', { mapX, mapY }))
        .sort((left, right) => (
          (calculateDistanceKm(mapX, mapY, left.mapX, left.mapY) ?? Number.POSITIVE_INFINITY)
          - (calculateDistanceKm(mapX, mapY, right.mapX, right.mapY) ?? Number.POSITIVE_INFINITY)
        ));
    } catch (error) {
      console.error('[Odii Nearby Error] 위치 기반 조회 실패:', error);
      return this.getStoryList('한옥');
    }
  }
};
