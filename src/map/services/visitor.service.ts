import type { CongestionLevel } from '@/map/types';
import { intensityOf, levelOf } from '@/map/warmth/congestion';

/**
 * 한국관광공사 관광빅데이터 정보서비스(DataLabService) 연동
 * 
 * TOUR_API_VISITOR_KEY & TOUR_API_CONGESTION_KEY를 활용하여
 * 전국 242개 지자체별 외지인 방문객수 및 현지인 대비 관광객 집중률(Surge)을 산출합니다.
 */

const DATA_LAB_BASE_URL = 'https://apis.data.go.kr/B551011/DataLabService';
const CACHE_TTL = 60 * 60 * 1000; // 1시간 캐시
const SERIES_TTL = 6 * 60 * 60 * 1000; // 일별 시계열은 하루 단위 데이터라 6시간 캐시
/** 스크러버가 훑는 날 수. locgoRegnVisitrDDList는 numOfRows 25000까지 한 번에 준다. */
export const SERIES_DAYS = 30;

export interface DayStamp {
  /** YYYYMMDD */
  ymd: string;
  /** '월요일' 등 API가 그대로 주는 요일명 */
  weekday: string;
}

interface SeriesCache {
  expiresAt: number;
  days: DayStamp[];
  /** 시군구 -> 날짜별 외지인 방문객 수 (days와 같은 길이) */
  visitorSeries: Map<string, number[]>;
  localMap: Map<string, number>;
  maxVisitor: number;
}

let cachedSeries: SeriesCache | null = null;

/** 데이터랩 응답 스키마는 공개 타입이 없어 프로젝트 관례대로 any로 받는다. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataLabAny = any;

function ymdOf(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDays(ymd: string, delta: number): string {
  const d = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(4, 6)) - 1,
    Number(ymd.slice(6, 8)),
  );
  d.setDate(d.getDate() + delta);
  return ymdOf(d);
}

interface DetailedDataCache {
  expiresAt: number;
  visitorMap: Map<string, number>;
  localMap: Map<string, number>;
  maxVisitor: number;
  avgVisitor: number;
}

let cachedDetailedData: DetailedDataCache | null = null;

export class VisitorService {
  private static serviceKey(): string {
    return (
      process.env.TOUR_API_CONGESTION_KEY ||
      process.env.TOUR_API_VISITOR_KEY ||
      process.env.TOUR_API_KEY ||
      '8ccc68b41250d7389f43c4a980508bd660cf187a989980869119e4ec1c6e5b51'
    );
  }

  private static async callDataLab(params: string): Promise<DataLabAny> {
    const url = `${DATA_LAB_BASE_URL}/locgoRegnVisitrDDList?serviceKey=${encodeURIComponent(
      this.serviceKey(),
    )}&MobileOS=ETC&MobileApp=OnMaru&_type=json&${params}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    return res.json();
  }

  /**
   * 데이터랩이 실제로 채워둔 마지막 날짜를 찾는다.
   *
   * 이 피드는 한 달가량 지연된다. 오늘 날짜로 물으면 빈손이라 넉넉한 창을 잡고
   * 마지막 행을 직접 집어온다 — 행이 날짜 오름차순이라 pageNo=totalCount가 곧 마지막 행이다.
   * 날짜를 코드에 박지 않으므로 피드가 따라잡으면 저절로 최신을 가리킨다.
   */
  private static async findLatestYmd(): Promise<string | null> {
    const today = ymdOf(new Date());
    const window = `startYmd=${shiftDays(today, -120)}&endYmd=${today}`;

    const head = await this.callDataLab(`${window}&numOfRows=1&pageNo=1`);
    const total = Number(head?.response?.body?.totalCount) || 0;
    if (total === 0) return null;

    const tail = await this.callDataLab(`${window}&numOfRows=1&pageNo=${total}`);
    const row = tail?.response?.body?.items?.item;
    const last = Array.isArray(row) ? row[0] : row;
    return typeof last?.baseYmd === 'string' ? last.baseYmd : null;
  }

  /**
   * 최근 SERIES_DAYS일치 지자체별 외지인 방문객 시계열.
   *
   * 벌크 요청은 한 번뿐이다 — 30일 × 242개 시군구 × 3구분, 약 2.4만 행이
   * numOfRows 하나에 들어온다. 날짜를 문지를 때마다 다시 부르지 않으려고
   * 시계열째로 받아 캐시한다.
   */
  public static async getDailySeries(): Promise<{
    days: DayStamp[];
    visitorSeries: Map<string, number[]>;
    localMap: Map<string, number>;
    maxVisitor: number;
  }> {
    if (cachedSeries && cachedSeries.expiresAt > Date.now()) return cachedSeries;

    try {
      const lastYmd = await this.findLatestYmd();
      if (!lastYmd) throw new Error('데이터랩에 채워진 날짜가 없음');

      const startYmd = shiftDays(lastYmd, -(SERIES_DAYS - 1));
      const json = await this.callDataLab(
        `startYmd=${startYmd}&endYmd=${lastYmd}&numOfRows=25000&pageNo=1`,
      );

      const items = json?.response?.body?.items?.item;
      const rows: DataLabAny[] = Array.isArray(items) ? items : items ? [items] : [];
      if (rows.length === 0) throw new Error('일별 시계열이 비어 있음');

      // 날짜 축을 먼저 세운다. 결측일이 있어도 받은 날짜만 쓰므로 축이 어긋나지 않는다.
      const stamps = new Map<string, string>();
      for (const r of rows) {
        if (r?.baseYmd && !stamps.has(r.baseYmd)) stamps.set(r.baseYmd, r.daywkDivNm || '');
      }
      const days: DayStamp[] = [...stamps.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([ymd, weekday]) => ({ ymd, weekday }));
      const slot = new Map(days.map((d, i) => [d.ymd, i]));

      const visitorSeries = new Map<string, number[]>();
      const localTotals = new Map<string, { sum: number; n: number }>();
      let maxVisitor = 1;

      for (const r of rows) {
        const name = r?.signguNm;
        const i = slot.get(r?.baseYmd);
        if (!name || i === undefined) continue;
        const num = parseFloat(r.touNum) || 0;

        if (r.touDivCd === '2') {
          // 외지인
          let arr = visitorSeries.get(name);
          if (!arr) {
            arr = new Array(days.length).fill(0);
            visitorSeries.set(name, arr);
          }
          arr[i] = Math.max(arr[i], num);
          if (num > maxVisitor) maxVisitor = num;
        } else if (r.touDivCd === '1') {
          // 현지인 — 날마다 거의 안 변해서 기간 평균 하나로 눌러 담는다
          const acc = localTotals.get(name) || { sum: 0, n: 0 };
          acc.sum += num;
          acc.n += 1;
          localTotals.set(name, acc);
        }
      }

      const localMap = new Map<string, number>();
      for (const [name, acc] of localTotals) {
        localMap.set(name, acc.n > 0 ? Math.round(acc.sum / acc.n) : 120000);
      }

      cachedSeries = { expiresAt: Date.now() + SERIES_TTL, days, visitorSeries, localMap, maxVisitor };
      return cachedSeries;
    } catch (err) {
      console.warn('일별 방문객 시계열 수집 실패, 단일 스냅숏으로 폴백:', err);

      // 시계열이 없어도 지도는 돌아가야 한다 — 하루짜리 축으로 접어 스크러버만 사라지게 한다.
      const snapshot = await this.getDetailedData();
      const visitorSeries = new Map<string, number[]>();
      for (const [name, v] of snapshot.visitorMap) visitorSeries.set(name, [v]);

      cachedSeries = {
        expiresAt: Date.now() + CACHE_TTL,
        days: [{ ymd: ymdOf(new Date()), weekday: '' }],
        visitorSeries,
        localMap: snapshot.localMap,
        maxVisitor: snapshot.maxVisitor,
      };
      return cachedSeries;
    }
  }

  /**
   * 한국관광공사 DataLabService에서 전국 지자체별 외지인 방문객 & 현지인 수 수집
   */
  public static async getDetailedData(): Promise<{
    visitorMap: Map<string, number>;
    localMap: Map<string, number>;
    maxVisitor: number;
    avgVisitor: number;
  }> {
    if (cachedDetailedData && cachedDetailedData.expiresAt > Date.now()) {
      return cachedDetailedData;
    }

    const serviceKey =
      process.env.TOUR_API_CONGESTION_KEY ||
      process.env.TOUR_API_VISITOR_KEY ||
      process.env.TOUR_API_KEY ||
      '8ccc68b41250d7389f43c4a980508bd660cf187a989980869119e4ec1c6e5b51';

    const fallbackVisitorMap = new Map<string, number>([
      ['종로구', 403802],
      ['중구', 391065],
      ['서구', 145621],
      ['유성구', 141753],
      ['동구', 161164],
      ['대덕구', 69867],
      ['완산구', 167797],
      ['덕진구', 112450],
      ['경주시', 139702],
      ['안동시', 50694],
      ['강릉시', 84591],
      ['전주시', 167797],
      ['수원시', 215000],
      ['용인시', 198000],
      ['춘천시', 78000],
      ['제주시', 185000],
    ]);

    const fallbackLocalMap = new Map<string, number>([
      ['종로구', 127365],
      ['중구', 102511],
      ['서구', 253281],
      ['유성구', 230384],
      ['동구', 185000],
      ['대덕구', 145000],
      ['완산구', 180000],
      ['덕진구', 170000],
      ['경주시', 171594],
      ['안동시', 119465],
      ['강릉시', 140000],
      ['전주시', 250000],
    ]);

    try {
      const url = `${DATA_LAB_BASE_URL}/locgoRegnVisitrDDList?serviceKey=${encodeURIComponent(
        serviceKey,
      )}&MobileOS=ETC&MobileApp=OnMaru&_type=json&startYmd=20241001&endYmd=20241001&numOfRows=1000`;

      const res = await fetch(url, { next: { revalidate: 3600 } });
      const json = await res.json().catch(() => null);

      const items = json?.response?.body?.items?.item;
      const rows = Array.isArray(items) ? items : items ? [items] : [];

      const visitorMap = new Map<string, number>();
      const localMap = new Map<string, number>();
      let maxVisitor = 1;
      let total = 0;
      let count = 0;

      for (const row of rows) {
        if (!row.signguNm) continue;
        const num = parseFloat(row.touNum) || 0;

        if (row.touDivCd === '1') {
          // 현지인
          localMap.set(row.signguNm, num);
        } else if (row.touDivCd === '2') {
          // 외지인 관광객
          const prev = visitorMap.get(row.signguNm) || 0;
          const finalNum = Math.max(prev, num);
          visitorMap.set(row.signguNm, finalNum);
          if (finalNum > maxVisitor) maxVisitor = finalNum;
          total += finalNum;
          count++;
        }
      }

      if (visitorMap.size === 0) {
        cachedDetailedData = {
          expiresAt: Date.now() + CACHE_TTL,
          visitorMap: fallbackVisitorMap,
          localMap: fallbackLocalMap,
          maxVisitor: 403802,
          avgVisitor: 120000,
        };
        return cachedDetailedData;
      }

      const avgVisitor = count > 0 ? Math.round(total / count) : 120000;

      cachedDetailedData = {
        expiresAt: Date.now() + CACHE_TTL,
        visitorMap,
        localMap,
        maxVisitor,
        avgVisitor,
      };

      return cachedDetailedData;
    } catch (err) {
      console.warn('TOUR_API 빅데이터 수집 실패, 기본 통계 폴백:', err);
      cachedDetailedData = {
        expiresAt: Date.now() + CACHE_TTL,
        visitorMap: fallbackVisitorMap,
        localMap: fallbackLocalMap,
        maxVisitor: 403802,
        avgVisitor: 120000,
      };
      return cachedDetailedData;
    }
  }

  /**
   * 주소에서 지자체명을 집어낸다. 하루짜리 지표와 시계열이 같은 규칙으로 매칭하도록
   * 한 군데 모아둔다 — 여기가 갈리면 뱃지 숫자와 스크러버 숫자가 어긋난다.
   */
  private static matchDistrict(addr: string, known: (name: string) => boolean): string {
    const parts = addr.trim().split(/\s+/);
    const limit = Math.min(parts.length, 5);

    /*
      데이터랩은 이름을 두 마디로 쓰는 지자체가 있다 — '전주시 완산구', '고양시 일산동구'.
      주소를 한 마디씩만 맞춰보면 이런 곳은 영영 안 걸리고, 더 넓은 '전주시' 집계에
      묶이거나 아예 매칭에 실패해 뱃지가 둘로 갈렸다. 좁은 이름부터 먼저 맞춰본다.
    */
    for (let i = 0; i < limit - 1; i++) {
      const pair = `${parts[i]} ${parts[i + 1]}`;
      if (known(pair)) return pair;
    }

    for (let i = 1; i < limit; i++) {
      if (known(parts[i])) return parts[i];
    }
    if (parts[0] && known(parts[0])) return parts[0];

    return '';
  }

  /**
   * 방문객/거주자 수를 0~100 혼잡도와 그 파생 지표로 환산한다.
   * 하루치든 시계열의 한 칸이든 전부 이 산식 하나를 지난다.
   */
  public static scoreOf(
    visitorCount: number,
    localCount: number,
    maxVisitor: number,
  ): {
    congestionScore: number;
    congestionLevel: CongestionLevel;
    surgeMultiplier: number;
    intensity: number;
  } {
    // 외지인 대 현지인 비율 (관광객 집중률)
    const ratio = visitorCount / Math.max(localCount, 15000);

    const surgeMultiplier = Number(
      Math.min(3.5, Math.max(1.0, 1.0 + ratio * 0.75)).toFixed(1),
    );

    /*
      집중률을 선형으로 더하면(예전 식: ratio * 35) 인기 권역이 한계에 붙어버린다.
      대전 중구는 ratio가 3.5라 첫 항만으로 123점이 되어 매일 100으로 잘렸고,
      그래서 날짜를 바꿔도 값이 꿈쩍 않고 요일 패턴이 평평하게 나왔다.
      히트맵도 붐비는 구들을 서로 구별하지 못했다.

      ratio/(ratio+1)은 완만하게 포화하므로 한계에 닿지 않는다 —
      ratio 1이면 50, 3.5면 78. 덕분에 상위 권역들 사이의 차이와
      날마다의 오르내림이 점수에 그대로 남는다.
    */
    const concentration = (ratio / (ratio + 1)) * 100;
    const volume = Math.min(100, (visitorCount / (maxVisitor || 400000)) * 100);

    const congestionScore = Math.round(
      Math.min(100, concentration * 0.45 + volume * 0.55),
    );

    return {
      congestionScore,
      congestionLevel: levelOf(congestionScore),
      surgeMultiplier,
      intensity: intensityOf(congestionScore),
    };
  }

  /**
   * 주소 하나에 대한 날짜별 혼잡도. 스크러버가 훑는 축이 이것이다.
   * 시계열이 없는 지자체는 빈 배열을 돌려주고, 호출부가 하루짜리 값으로 대신한다.
   */
  public static resolveDaily(
    addr: string,
    visitorSeries: Map<string, number[]>,
    localMap: Map<string, number>,
    maxVisitor: number,
  ): { district: string; scores: number[]; visitors: number[] } {
    const district = this.matchDistrict(addr, (n) => visitorSeries.has(n));
    const visitors = district ? visitorSeries.get(district) ?? [] : [];
    if (visitors.length === 0) return { district, scores: [], visitors: [] };

    const localCount = localMap.get(district) || 120000;
    return {
      district,
      visitors,
      scores: visitors.map((v) => this.scoreOf(v, localCount, maxVisitor).congestionScore),
    };
  }

  /**
   * 주소 문자열로부터 지자체 추출 및 실시간 혼잡도/수요 집중 지표 산출
   */
  public static resolveCongestion(
    addr: string,
    visitorMap: Map<string, number>,
    localMap: Map<string, number>,
    maxVisitor: number,
  ): {
    district: string;
    visitorCount: number;
    localCount: number;
    congestionScore: number;
    congestionLevel: CongestionLevel;
    surgeMultiplier: number;
    intensity: number;
  } {
    const parts = addr.trim().split(/\s+/);
    const matched = this.matchDistrict(addr, (n) => visitorMap.has(n));

    // 못 찾은 주소는 전국 중간값으로 눌러 담는다 — 지도에서 통째로 빠지는 것보다 낫다.
    const district = matched || parts[1] || parts[0] || '전국';
    const visitorCount = matched ? visitorMap.get(matched)! : 55000;
    const localCount = matched ? localMap.get(matched) || 120000 : 100000;

    return {
      district,
      visitorCount,
      localCount,
      ...this.scoreOf(visitorCount, localCount, maxVisitor),
    };
  }
}
