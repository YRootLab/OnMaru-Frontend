import { OdiiStoryItem, OdiiCategory } from '../types/odii.types';
import { MOCK_ODII_STORIES } from './odiiMockData';

const BASE_URL = process.env.NEXT_PUBLIC_ODII_API_URL || 'https://apis.data.go.kr/B551011/Odii';
const API_KEY = process.env.NEXT_PUBLIC_ODII_API_KEY || process.env.ODII_API_KEY || '';

// 테마 카테고리에 대응하는 Odii API 키워드 매핑
const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  '한옥/고택': '한옥',
  '서원/향교': '서원',
  '전통시장/장터': '시장',
  '마을/골목길': '골목',
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

/**
 * 한국관광공사 오디(Odii) API 어댑터
 */
export const odiiApiAdapter = {
  /**
   * 오디오 이야기 목록 조회 (카테고리 & 검색어 필터링)
   */
  async getStoryList(category?: OdiiCategory | string, query?: string): Promise<OdiiStoryItem[]> {
    if (!API_KEY) {
      console.warn('[Odii API] API Key가 설정되지 않아 Mock 데이터를 반환합니다.');
      return this.getMockFiltered(category, query);
    }

    try {
      let keyword = query && query.trim().length > 0 ? query.trim() : '';

      if (!keyword && category && category !== '전체') {
        keyword = CATEGORY_KEYWORD_MAP[category] || category;
      }

      const endpoint = keyword ? 'storySearchList' : 'storyBasedList';
      const params: Record<string, string> = {
        MobileOS: 'ETC',
        MobileApp: 'OnMaruFE',
        _type: 'json',
        langCode: 'ko',
        numOfRows: '30',
        pageNo: '1',
      };

      if (keyword) {
        params.keyword = keyword;
      }

      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

      const url = `${BASE_URL}/${endpoint}?serviceKey=${API_KEY}&${paramStr}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      const rawItems = json?.response?.body?.items?.item;

      if (!rawItems) {
        return this.getMockFiltered(category, query);
      }

      const itemList = (Array.isArray(rawItems) ? rawItems : [rawItems]) as Record<string, unknown>[];

      const mappedStories: OdiiStoryItem[] = itemList.map((item, idx) => {
        const title = readText(item, 'title') || readText(item, 'storyTitle') || '한국의 문화 이야기';
        const stid = readText(item, 'stid') || readText(item, 'tid') || String(idx + 1);
        const audioUrl = readText(item, 'audioUrl') || readText(item, 'audio') || readText(item, 'playUrl') || readText(item, 'mp3Url');
        const audioTime = readText(item, 'audioTime');
        const imageUrl = readText(item, 'imageUrl').length > 0
          ? readText(item, 'imageUrl')
          : getRandomFallbackImage(stid + title);

        const categoryVal: OdiiCategory = (category as OdiiCategory) || '한옥';

        return {
          tid: readText(item, 'tid'),
          tlid: readText(item, 'tlid'),
          stid: stid,
          stlid: readText(item, 'stlid'),
          title: title,
          audioTitle: readText(item, 'storyTitle') || title || '오디오 해설',
          speaker: '문화해설사 도슨트',
          category: categoryVal,
          distance: '0.8km',
          mapX: readText(item, 'mapX') || '126.9780',
          mapY: readText(item, 'mapY') || '37.5665',
          script: readText(item, 'script') || '해설 대본 정보가 준비 중입니다.',
          playTime: audioTime || '180',
          formattedDuration: audioTime ? `${Math.floor(Number(audioTime) / 60)}분 ${Number(audioTime) % 60}초` : '3분 00초',
          audioUrl,
          imageUrl: imageUrl,
          locationName: readText(item, 'addr1') || readText(item, 'addr2') || '대한민국 문화유산',
          badgeText: audioUrl ? '음원 제공' : '대본 전용'
        };
      });

      return mappedStories.length > 0 ? mappedStories : this.getMockFiltered(category, query);
    } catch (error) {
      console.error('[Odii API Error] API 호출 실패, Fallback 데이터 전환:', error);
      return this.getMockFiltered(category, query);
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
  async getNearbyStories(mapX?: string, mapY?: string): Promise<OdiiStoryItem[]> {
    void mapX;
    void mapY;
    return this.getStoryList('한옥');
  }
};
