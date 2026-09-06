import type { Village, VillageMeta } from '@/hanok/types';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';

export const CATEGORY_MAPPINGS = {
  STAY_HANOK: { contentTypeId: '32', cat1: 'B02', cat2: 'B0201', cat3: 'B02011600' },
  VILLAGE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010800' },
  HERITAGE_HOUSE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010100' },
  PALACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010300' },
};

const AREA_MAP: Record<string, string> = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구', '5': '광주', '6': '부산', '7': '울산', '8': '세종',
  '31': '경기', '32': '강원', '33': '충북', '34': '충남', '35': '경북', '36': '경남', '37': '전북', '38': '전남', '39': '제주',
};

const REGION_ALIASES: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원',
  충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전북특별자치도: '전북',
  전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주도: '제주', 제주특별자치도: '제주',
};

const BADGE_RULES = [
  { badge: '세계유산', keywords: ['세계유산', '유네스코', 'UNESCO'] },
  { badge: '국가지정', keywords: ['국보', '보물', '사적', '명승'] },
  { badge: '민속마을', keywords: ['중요민속문화재', '국가민속문화재', '민속마을'] },
  { badge: '공공건축물', keywords: ['주민센터', '도서관', '박물관', '상촌재', '무계원', '공공'] },
  { badge: '조선시대', keywords: ['조선', '이조'] },
  { badge: '궁궐', keywords: ['궁궐', '경복궁', '창덕궁', '덕수궁', '집옥재', '낙선재', '석어당'] },
  { badge: '고택', keywords: ['고택', '종택', '종가', '선교장'] },
  { badge: '서원·향교', keywords: ['서원', '향교'] },
  { badge: '돌담길', keywords: ['돌담', '담장'] },
  { badge: '전통체험', keywords: ['체험', '체험관'] },
];

const CURATION_KEYWORDS = [
  '경복궁', '강릉 선교장', '남산골한옥마을', '구례 운조루', '하회마을',
  '학인당', '봉정사', '안동 임청각', '외암민속마을', '경주 최부자댁',
  '논산 명재고택', '은평한옥마을',
];

function inKorea(lat: number, lng: number): boolean {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

function toHttps(url?: string | null): string | null {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}

export class HanokArchiveService {
  public static resolveRegion(areacode: string, addr: string): string {
    if (AREA_MAP[areacode]) return AREA_MAP[areacode];
    const head = addr.split(' ')[0] ?? '';
    return REGION_ALIASES[head] || head || '기타';
  }

  public static assignBadges(title: string, addr: string): string[] {
    const text = `${title} ${addr}`;
    const badges: string[] = [];
    for (const rule of BADGE_RULES) {
      if (rule.keywords.some((kw) => text.includes(kw))) {
        badges.push(rule.badge);
      }
    }
    return badges.slice(0, 3);
  }

  /**
   * TourAPI에서 한옥 아카이브 실시간 데이터를 수집/변환합니다.
   */
  public static async fetchRealtimeHanoks(signal?: AbortSignal): Promise<{
    villages: Village[];
    curatedVillages: Village[];
    meta: VillageMeta;
  }> {
    const configs = [
      { key: 'STAY_HANOK', ...CATEGORY_MAPPINGS.STAY_HANOK, type: '한옥스테이' as const, rows: 100 },
      { key: 'VILLAGE', ...CATEGORY_MAPPINGS.VILLAGE, type: '전통마을' as const, rows: 100 },
      { key: 'HERITAGE_HOUSE', ...CATEGORY_MAPPINGS.HERITAGE_HOUSE, type: '고택·종택' as const, rows: 100 },
      { key: 'PALACE', ...CATEGORY_MAPPINGS.PALACE, type: '궁궐·누각' as const, rows: 50 },
    ];

    const results = await Promise.allSettled(
      configs.map((c) =>
        TourApiClient.get('areaBasedList2', {
          contentTypeId: c.contentTypeId,
          cat1: c.cat1,
          cat2: c.cat2,
          cat3: c.cat3,
          arrange: 'P',
          numOfRows: c.rows,
        }, signal),
      ),
    );

    const villages: Village[] = [];
    const seenIds = new Set<string>();

    results.forEach((res, idx) => {
      if (res.status !== 'fulfilled' || !res.value) return;
      const config = configs[idx];
      const rawList = res.value?.response?.body?.items?.item;
      const items = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];

      for (const item of items) {
        const id = String(item.contentid);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const lat = parseFloat(item.mapy);
        const lng = parseFloat(item.mapx);
        const validCoords = inKorea(lat, lng);
        const addr = String(item.addr1 || '').trim();
        const title = String(item.title || '').trim();

        const hasImage = Boolean(item.firstimage || item.firstimage2);
        villages.push({
          id,
          name: title,
          rawTitle: title,
          type: config.type,
          region: this.resolveRegion(String(item.areacode || ''), addr),
          lat: validCoords ? lat : null,
          lng: validCoords ? lng : null,
          addr,
          image: toHttps(item.firstimage || item.firstimage2),
          hasImage,
          summary: `${title} - ${addr}`,
          overview: '',
          badges: this.assignBadges(title, addr),
        });
      }
    });

    const curatedVillages = villages.filter((v) =>
      CURATION_KEYWORDS.some((kw) => v.name.includes(kw)),
    );

    const byType: Record<string, number> = {};
    const badgeStats: Record<string, number> = {};
    let imageCount = 0;

    villages.forEach((v) => {
      byType[v.type] = (byType[v.type] || 0) + 1;
      if (v.hasImage) imageCount += 1;
      v.badges.forEach((b) => {
        badgeStats[b] = (badgeStats[b] || 0) + 1;
      });
    });

    return {
      villages,
      curatedVillages,
      meta: {
        total: villages.length,
        generatedAt: new Date().toISOString(),
        byType,
        imageRate: villages.length > 0 ? imageCount / villages.length : 0,
        badgeStats,
        badgeFallbackCount: 0,
      },
    };
  }
}
