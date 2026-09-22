import type { CongestionLevel } from '@/features/map/types';
import { intensityOf, levelOf } from '@/features/map/warmth/congestion';








const DATA_LAB_BASE_URL = 'https://apis.data.go.kr/B551011/DataLabService';
const CACHE_TTL = 60 * 60 * 1000;
const SERIES_TTL = 6 * 60 * 60 * 1000;

export const SERIES_DAYS = 30;

export interface DayStamp {

  ymd: string;

  weekday: string;
}

interface SeriesCache {
  expiresAt: number;
  days: DayStamp[];

  visitorSeries: Map<string, number[]>;
  localMap: Map<string, number>;
  maxVisitor: number;
}

let cachedSeries: SeriesCache | null = null;


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

          let arr = visitorSeries.get(name);
          if (!arr) {
            arr = new Array(days.length).fill(0);
            visitorSeries.set(name, arr);
          }
          arr[i] = Math.max(arr[i], num);
          if (num > maxVisitor) maxVisitor = num;
        } else if (r.touDivCd === '1') {

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

          localMap.set(row.signguNm, num);
        } else if (row.touDivCd === '2') {

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





  private static matchDistrict(addr: string, known: (name: string) => boolean): string {
    const parts = addr.trim().split(/\s+/);
    const limit = Math.min(parts.length, 5);






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

    const ratio = visitorCount / Math.max(localCount, 15000);

    const surgeMultiplier = Number(
      Math.min(3.5, Math.max(1.0, 1.0 + ratio * 0.75)).toFixed(1),
    );











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
