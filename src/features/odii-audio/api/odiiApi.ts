import { OdiiStoryItem, OdiiCategory } from '../types/odii.types';
import { MOCK_ODII_STORIES } from './odiiMockData';

const BASE_URL = process.env.NEXT_PUBLIC_ODII_API_URL || 'https://apis.data.go.kr/B551011/Odii';
const API_KEY = process.env.NEXT_PUBLIC_ODII_API_KEY || process.env.ODII_API_KEY || '';

// 테마 카테고리에 대응하는 Odii API 키워드 매핑
const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  '한옥/고택': '한옥',
  '궁궐/역사': '궁',
  '전통시장/장터': '시장',
  '마을/골목길': '마을',
  '소리/문화': '문화',
  '박물관/미술관': '박물관',
  '자연/둘레길': '길',
  '한옥': '한옥',
  '궁': '궁',
  '고택': '고택',
  '북촌': '북촌',
  '전주': '전주',
  '전통시장': '전통시장'
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

      const itemList = Array.isArray(rawItems) ? rawItems : [rawItems];

      const mappedStories: OdiiStoryItem[] = itemList.map((item: any, idx: number) => {
        const title = item.title || item.storyTitle || '한국의 문화 이야기';
        const stid = String(item.stid || item.tid || idx + 1);
        const imageUrl = item.imageUrl && item.imageUrl.trim().length > 0
          ? item.imageUrl
          : getRandomFallbackImage(stid + title);

        const categoryVal: OdiiCategory = (category as OdiiCategory) || '한옥';

        return {
          tid: String(item.tid || ''),
          tlid: String(item.tlid || ''),
          stid: stid,
          stlid: String(item.stlid || ''),
          title: title,
          audioTitle: item.storyTitle || item.title || '오디오 해설',
          speaker: '문화해설사 도슨트',
          category: categoryVal,
          distance: '0.8km',
          mapX: String(item.mapX || '126.9780'),
          mapY: String(item.mapY || '37.5665'),
          script: item.script || '해설 대본 정보가 준비 중입니다.',
          playTime: String(item.audioTime || '180'),
          formattedDuration: item.audioTime ? `${Math.floor(Number(item.audioTime) / 60)}분 ${Number(item.audioTime) % 60}초` : '3분 00초',
          audioUrl: item.audioUrl || '',
          imageUrl: imageUrl,
          locationName: item.addr1 || item.addr2 || '대한민국 문화유산',
          badgeText: item.audioUrl ? '음원 제공' : '대본 전용'
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
      filtered = filtered.filter((s) => s.category === category);
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.audioTitle.toLowerCase().includes(q) ||
          s.script.toLowerCase().includes(q)
      );
    }

    return filtered;
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
    return this.getStoryList('한옥');
  }
};
