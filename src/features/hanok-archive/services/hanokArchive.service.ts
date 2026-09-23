import { STAY_TYPE } from '@/features/hanok-archive/types';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import { apiGet } from '@/lib/api/client';
import {
  CATEGORY_MAPPINGS,
  classifyHeritageHouse,
  resolveRegion,
  assignBadges,
  inKorea,
  toHttps,
} from '@/features/hanok-archive/lib/classify.mjs';


interface BackendHanokItem {
  placeId: string;
  name: string;
  category: string;
  regionName: string;
  thumbnailUrl: string | null;
  summary: string;
  tags: string[];
}

interface BackendHanokListResponse {
  items: BackendHanokItem[];
}








function mapBackendCategoryToVillageType(category: string): Village['type'] | null {
  const normalized = category.toUpperCase();
  if (normalized.includes('CAFE') || category === '카페') return null;
  if (normalized.includes('STAY')) return STAY_TYPE;
  return '고택';
}

function mapBackendHanokToVillage(item: BackendHanokItem): Village | null {
  const type = mapBackendCategoryToVillageType(item.category);
  if (!type) return null;

  return {
    id: item.placeId,
    name: item.name,
    rawTitle: item.name,
    type,
    region: item.regionName,

    lat: null,
    lng: null,
    addr: item.regionName,
    image: item.thumbnailUrl,
    hasImage: Boolean(item.thumbnailUrl),
    summary: item.summary,
    overview: '',
    badges: item.tags,
  };
}


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





























const CURATION_KEYWORDS = [
  '경복궁', '강릉 선교장', '남산골한옥마을', '구례 운조루', '하회마을',
  '학인당', '봉정사', '안동 임청각', '외암민속마을', '경주 최부자댁',
  '논산 명재고택', '은평한옥마을',
];

export class HanokArchiveService {











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






  public static async fetchRealtimeHanoks(signal?: AbortSignal): Promise<{
    villages: Village[];
    curatedVillages: Village[];
    meta: VillageMeta;
  }> {
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        return await this.fetchFromBackend();
      } catch (err) {
        console.warn('[HanokArchiveService] backend /hanoks failed, falling back to TourAPI:', err);
      }
    }
    return this.fetchFromTourApi(signal);
  }

  private static async fetchFromBackend(): Promise<{
    villages: Village[];
    curatedVillages: Village[];
    meta: VillageMeta;
  }> {
    const res = await apiGet<BackendHanokListResponse>('/hanoks', { limit: 50 });
    const villages = res.items
      .map(mapBackendHanokToVillage)
      .filter((v): v is Village => v !== null);

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
        sourceTotals: { backend: villages.length },
      },
    };
  }




  private static async fetchFromTourApi(signal?: AbortSignal): Promise<{
    villages: Village[];
    curatedVillages: Village[];
    meta: VillageMeta;
  }> {

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
          type: (config.type === '고택' ? classifyHeritageHouse(title, addr) : config.type) as Village['type'],
          region: resolveRegion(String(item.areacode || ''), addr),
          lat: validCoords ? lat : null,
          lng: validCoords ? lng : null,
          addr,
          image: toHttps(item.firstimage || item.firstimage2),
          hasImage,



          summary: addr,
          overview: '',
          badges: assignBadges(title, addr),
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
