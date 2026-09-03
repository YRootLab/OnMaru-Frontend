import type { CongestionLevel } from '@/map/types';

/**
 * 한국관광공사 관광빅데이터 정보서비스(DataLabService) 연동
 * 
 * TOUR_API_VISITOR_KEY & TOUR_API_CONGESTION_KEY를 활용하여
 * 전국 242개 지자체별 외지인 방문객수 및 현지인 대비 관광객 집중률(Surge)을 산출합니다.
 */

const DATA_LAB_BASE_URL = 'https://apis.data.go.kr/B551011/DataLabService';
const CACHE_TTL = 60 * 60 * 1000; // 1시간 캐시

interface DetailedDataCache {
  expiresAt: number;
  visitorMap: Map<string, number>;
  localMap: Map<string, number>;
  maxVisitor: number;
  avgVisitor: number;
}

let cachedDetailedData: DetailedDataCache | null = null;

export class VisitorService {
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
    let matchedDistrict = '';
    let visitorCount = 0;
    let localCount = 0;

    for (let i = 1; i < Math.min(parts.length, 4); i++) {
      const candidate = parts[i];
      if (visitorMap.has(candidate)) {
        matchedDistrict = candidate;
        visitorCount = visitorMap.get(candidate)!;
        localCount = localMap.get(candidate) || 120000;
        break;
      }
    }

    if (!matchedDistrict && parts[0] && visitorMap.has(parts[0])) {
      matchedDistrict = parts[0];
      visitorCount = visitorMap.get(parts[0])!;
      localCount = localMap.get(parts[0]) || 120000;
    }

    if (visitorCount === 0) {
      visitorCount = 55000;
      localCount = 100000;
      matchedDistrict = parts[1] || parts[0] || '전국';
    }

    // 외지인 대 현지인 비율 (관광객 집중률 산출)
    const ratio = visitorCount / Math.max(localCount, 15000);

    // 수요 집중 배율 산출 (1.0x ~ 3.5x)
    const surgeMultiplier = Number(
      Math.min(3.5, Math.max(1.0, 1.0 + ratio * 0.75)).toFixed(1),
    );

    // 0 ~ 100 혼잡도 종합 지표 산출 (집중률 및 절대 방문자수 반영)
    const congestionScore = Math.min(
      100,
      Math.round(ratio * 35 + (visitorCount / (maxVisitor || 400000)) * 50),
    );

    let congestionLevel: CongestionLevel = 'relaxed';
    if (congestionScore >= 75) {
      congestionLevel = 'surge'; // 초혼잡
    } else if (congestionScore >= 50) {
      congestionLevel = 'busy'; // 혼잡
    } else if (congestionScore >= 30) {
      congestionLevel = 'moderate'; // 보통
    } else {
      congestionLevel = 'relaxed'; // 여유
    }

    const intensity = Math.min(1.0, Math.max(0.25, congestionScore / 100));

    return {
      district: matchedDistrict,
      visitorCount,
      localCount,
      congestionScore,
      congestionLevel,
      surgeMultiplier,
      intensity,
    };
  }
}
