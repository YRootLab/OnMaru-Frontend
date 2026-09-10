import { STAY_TYPE } from '@/hanok/types';
import type { Village, VillageMeta } from '@/hanok/types';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';

/** areaBasedList2가 돌려주는 항목 중 이 도감이 읽는 필드만. */
interface TourApiItem {
  contentid: string | number;
  title?: string;
  addr1?: string;
  areacode?: string | number;
  mapx?: string | number;
  mapy?: string | number;
  firstimage?: string;
  firstimage2?: string;
}

/*
  수집 카테고리.

  type은 항목을 보고 정하는 게 아니라 '이 코드로 받아온 것'이 곧 유형이다. 그래서 코드와
  이름이 어긋나면 도감 전체가 조용히 거짓말을 한다 — 실제로 그랬다.

    A02010100 을 '고택·종택'이라 불렀는데 관광공사 분류표의 이름은 고궁이다.
              창경궁·운현궁·나주 금성관·인천도호부관아가 '고택'으로 떴다.
    A02010300 을 '궁궐·누각'이라 불렀는데 실제 이름은 문이다.
              숭례문·흥인지문·독립문이 '궁궐'로 떴다.
    A02010800 을 '전통마을'이라 불렀는데 실제 이름은 사찰이다.
              흥륜사·수타사·상원사가 '전통마을'로 떴고, 705건짜리 사찰 목록이
              도감의 100자리를 통째로 차지했다.

  정작 도감의 중심인 A02010400 고택(110건)과 A02010600 민속마을(58건)은
  한 번도 요청하지 않았다. '고택·종택 38곳'이라 적혀 있었지만 진짜 고택은 0곳이었다.

  아래 이름은 전부 categoryCode2가 돌려준 관광공사 공식 명칭이다. 임의로 짓지 않는다.
  코드를 바꿀 때는 반드시 categoryCode2로 이름을 다시 확인할 것.

  제외한 것과 이유:
    A02010800 사찰(705건)      — 목조 전통건축이지만 종교 건축이고, 수가 커서 도감을 잠식한다
    A02010200 성(91건)         — 대부분 석축 성곽이라 한옥이 아니다
    A02010700 유적지/사적지(1247건) — 석조부도 같은 비건축물이 섞인 잡버킷
*/
export const CATEGORY_MAPPINGS = {
  STAY_HANOK: { contentTypeId: '32', cat1: 'B02', cat2: 'B0201', cat3: 'B02011600' },
  HERITAGE_HOUSE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010400' },
  FOLK_VILLAGE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010600' },
  PALACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010100' },
  BIRTHPLACE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010500' },
  GATE: { contentTypeId: '12', cat1: 'A02', cat2: 'A0201', cat3: 'A02010300' },
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

/*
  전남·광주 통합으로 TourAPI 주소 접두어에 '전남광주통합특별시'가 섞여 나온다.
  areacode가 비어 있는 항목이 이 접두어로만 지역을 말하므로, 별칭표로는 못 푼다 —
  하나의 접두어가 전남과 광주 둘을 가리키기 때문이다. 뒤따르는 시군구로 가른다.

  구 이름은 다른 시에도 있지만(동구·서구·남구·북구) 여기서는 접두어가 이미
  통합시로 한정하므로 헷갈릴 자리가 없다.
*/
const MERGED_JEONNAM_GWANGJU = '전남광주통합특별시';
const GWANGJU_DISTRICTS = ['동구', '서구', '남구', '북구', '광산구'];

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

    const parts = addr.split(' ');
    const head = parts[0] ?? '';

    if (head === MERGED_JEONNAM_GWANGJU) {
      return GWANGJU_DISTRICTS.includes(parts[1] ?? '') ? '광주' : '전남';
    }

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
   * 한 카테고리를 끝까지 받아온다.
   *
   * 전에는 numOfRows 100을 한 번만 불렀다. 그러면 그보다 많은 카테고리는 딱 100에서
   * 잘리는데, 화면은 그 100을 전수인 양 말했다 — 한옥스테이 100 / 전통마을 100처럼
   * 두 유형이 정확히 100씩이던 게 그 흔적이다. 페이지를 끝까지 넘겨 받고, 관광공사가
   * 가진 총건수도 함께 돌려준다.
   *
   * MAX_PAGES는 안전장치다. 유적지/사적지처럼 1000건이 넘는 카테고리를 실수로 넣었을 때
   * 요청이 끝없이 늘어나지 않게 막는다.
   */
  private static async fetchCategory(
    config: { contentTypeId: string; cat1: string; cat2: string; cat3: string },
    signal?: AbortSignal,
  ): Promise<{ items: TourApiItem[]; totalCount: number }> {
    const ROWS = 100;
    const MAX_PAGES = 6;

    const items: TourApiItem[] = [];
    let totalCount = 0;

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await TourApiClient.get('areaBasedList2', {
        contentTypeId: config.contentTypeId,
        cat1: config.cat1,
        cat2: config.cat2,
        cat3: config.cat3,
        arrange: 'P',
        numOfRows: ROWS,
        pageNo: page,
      }, signal);

      const body = res?.response?.body;
      if (!body) break;

      totalCount = Number(body.totalCount) || totalCount;

      const raw = body.items?.item;
      const batch = Array.isArray(raw) ? raw : raw ? [raw] : [];
      items.push(...batch);

      if (batch.length < ROWS || items.length >= totalCount) break;
    }

    return { items, totalCount };
  }

  /**
   * TourAPI에서 한옥 아카이브 실시간 데이터를 수집/변환합니다.
   */
  public static async fetchRealtimeHanoks(signal?: AbortSignal): Promise<{
    villages: Village[];
    curatedVillages: Village[];
    meta: VillageMeta;
  }> {
    // 유형 값은 관광공사 분류표의 이름을 그대로 쓴다. 화면 이름은 filterLabels가 맡는다.
    const configs = [
      { ...CATEGORY_MAPPINGS.STAY_HANOK, type: STAY_TYPE },
      { ...CATEGORY_MAPPINGS.HERITAGE_HOUSE, type: '고택' as const },
      { ...CATEGORY_MAPPINGS.FOLK_VILLAGE, type: '민속마을' as const },
      { ...CATEGORY_MAPPINGS.PALACE, type: '고궁' as const },
      { ...CATEGORY_MAPPINGS.BIRTHPLACE, type: '생가' as const },
      { ...CATEGORY_MAPPINGS.GATE, type: '문' as const },
    ];

    const results = await Promise.allSettled(
      configs.map((c) => this.fetchCategory(c, signal)),
    );

    const villages: Village[] = [];
    const seenIds = new Set<string>();
    /** 카테고리별로 관광공사가 가진 전체 건수. 수집분이 전수인지 화면이 말할 수 있어야 한다. */
    const sourceTotals: Record<string, number> = {};

    results.forEach((res, idx) => {
      if (res.status !== 'fulfilled' || !res.value) return;
      const config = configs[idx];
      const { items, totalCount } = res.value;
      sourceTotals[config.type] = totalCount;

      for (const item of items) {
        const id = String(item.contentid);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const lat = parseFloat(String(item.mapy ?? ''));
        const lng = parseFloat(String(item.mapx ?? ''));
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
        sourceTotals,
      },
    };
  }
}
