import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import type { Item, PlaceCategory, PlaceDetailData } from '../types';
import { sanitizeHtml, toHttps } from '../utils/formatters';

const MAX_RADIUS = 20000;
const CACHE_TTL = 10 * 60 * 1000; // 10분

interface CacheEntry {
  expiresAt: number;
  items: Item[];
}

const CATEGORY_MAP: Record<
  PlaceCategory,
  { contentTypeId: string; keep: (cat3: string, title: string) => boolean }
> = {
  spot: { contentTypeId: '12', keep: () => true },
  experience: { contentTypeId: '28', keep: () => true },
  culture: { contentTypeId: '14', keep: () => true },
  festival: { contentTypeId: '15', keep: () => true },
  stay: { contentTypeId: '32', keep: () => true },
  food: { contentTypeId: '39', keep: (cat3) => cat3 !== 'A05020900' },
  cafe: {
    contentTypeId: '39',
    keep: (cat3, title) => cat3 === 'A05020900' || /(카페|찻집|커피|다원)/.test(title),
  },
  market: {
    contentTypeId: '38',
    keep: (cat3, title) =>
      cat3 === 'A04010100' || cat3 === 'A04010200' || title.includes('시장'),
  },
};

export const PLACE_CATEGORIES = Object.keys(CATEGORY_MAP) as PlaceCategory[];

export class PlaceService {
  private static placeCache = new Map<string, CacheEntry>();

  private static getCacheKey(
    lat: number,
    lng: number,
    radius: number,
    category?: PlaceCategory | null,
  ): string {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    const roundedRadius = Math.round(radius / 500) * 500;
    return `${roundedLat}_${roundedLng}_${roundedRadius}_${category || 'all'}`;
  }

  /**
   * 지도 뷰포트 기준 장소 목록 조회 (캐시 및 카테고리 필터링)
   */
  public static async getNearbyPlaces(opts: {
    lat: number;
    lng: number;
    radius: number;
    category?: PlaceCategory | null;
  }): Promise<Item[]> {
    const radius = Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
    const cacheKey = this.getCacheKey(opts.lat, opts.lng, radius, opts.category);

    // 1. 캐시 히트 검사
    const cached = this.placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    const signal = AbortSignal.timeout(10000);
    const out: Item[] = [];

    // 2. 단일 카테고리 요청
    if (opts.category) {
      const config = CATEGORY_MAP[opts.category];
      const json = await TourApiClient.get(
        'locationBasedList2',
        {
          mapX: opts.lng,
          mapY: opts.lat,
          radius,
          contentTypeId: config.contentTypeId,
          arrange: 'E',
          numOfRows: 30,
        },
        signal,
      );

      const raw = json?.response?.body?.items?.item;
      const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];

      for (const row of rows) {
        const title = String(row.title ?? '').trim();
        const cat3 = String(row.cat3 ?? '');
        if (!title || !config.keep(cat3, title)) continue;

        const y = Number(row.mapy);
        const x = Number(row.mapx);
        if (!Number.isFinite(y) || !Number.isFinite(x)) continue;

        out.push({
          id: String(row.contentid),
          name: title,
          category: opts.category,
          lat: y,
          lng: x,
          addr: String(row.addr1 ?? '').trim(),
          image: toHttps(row.firstimage || row.firstimage2),
          tel: row.tel ? String(row.tel).trim() : null,
          dist: row.dist !== undefined ? Number(row.dist) : null,
        });
      }
    } else {
      // 3. 전체 카테고리 병렬 요청 (12, 14, 15, 28, 32, 38, 39)
      const contentTypes = ['12', '14', '15', '28', '32', '38', '39'];
      const results = await Promise.allSettled(
        contentTypes.map((cType) =>
          TourApiClient.get(
            'locationBasedList2',
            {
              mapX: opts.lng,
              mapY: opts.lat,
              radius,
              contentTypeId: cType,
              arrange: 'E',
              numOfRows: 25,
            },
            signal,
          ),
        ),
      );

      const seen = new Set<string>();

      results.forEach((res, idx) => {
        if (res.status !== 'fulfilled' || !res.value) return;
        const cType = contentTypes[idx];
        const raw = res.value?.response?.body?.items?.item;
        const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];

        for (const row of rows) {
          const id = String(row.contentid);
          if (seen.has(id)) continue;
          seen.add(id);

          const title = String(row.title ?? '').trim();
          const cat3 = String(row.cat3 ?? '');
          const y = Number(row.mapy);
          const x = Number(row.mapx);
          if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;

          let category: PlaceCategory = 'spot';
          if (cType === '32') category = 'stay';
          else if (cType === '28') category = 'experience';
          else if (cType === '14') category = 'culture';
          else if (cType === '15') category = 'festival';
          else if (cType === '38') category = 'market';
          else if (cType === '39') {
            category =
              cat3 === 'A05020900' || /(카페|찻집|커피|다원)/.test(title)
                ? 'cafe'
                : 'food';
          }

          out.push({
            id,
            name: title,
            category,
            lat: y,
            lng: x,
            addr: String(row.addr1 ?? '').trim(),
            image: toHttps(row.firstimage || row.firstimage2),
            tel: row.tel ? String(row.tel).trim() : null,
            dist: row.dist !== undefined ? Number(row.dist) : null,
          });
        }
      });
    }

    // 4. 캐시 저장
    this.placeCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL,
      items: out,
    });

    return out;
  }

  /**
   * 장소 상세 정보 조회 (detailCommon2, detailIntro2, detailImage2 병렬 처리)
   */
  public static async getPlaceDetail(
    contentId: string,
    contentTypeId = '12',
  ): Promise<PlaceDetailData> {
    const signal = AbortSignal.timeout(10000);

    try {
      const [commonRes, introRes, imageRes] = await Promise.allSettled([
        TourApiClient.get(
          'detailCommon2',
          {
            contentId,
            defaultYN: 'Y',
            firstImageYN: 'Y',
            addrinfoYN: 'Y',
            mapinfoYN: 'Y',
            overviewYN: 'Y',
          },
          signal,
        ),
        TourApiClient.get(
          'detailIntro2',
          { contentId, contentTypeId },
          signal,
        ),
        TourApiClient.get(
          'detailImage2',
          { contentId, imageYN: 'Y', subImageYN: 'Y', numOfRows: '10' },
          signal,
        ),
      ]);

      const commonRaw =
        commonRes.status === 'fulfilled' && commonRes.value
          ? commonRes.value?.response?.body?.items?.item
          : null;
      const common = Array.isArray(commonRaw) ? commonRaw[0] : commonRaw;

      const introRawItem =
        introRes.status === 'fulfilled' && introRes.value
          ? introRes.value?.response?.body?.items?.item
          : null;
      const introRaw = Array.isArray(introRawItem) ? introRawItem[0] : introRawItem;

      const imageRaw =
        imageRes.status === 'fulfilled' && imageRes.value
          ? imageRes.value?.response?.body?.items?.item
          : null;
      const imageList = Array.isArray(imageRaw) ? imageRaw : imageRaw ? [imageRaw] : [];

      const images: string[] = [];
      const mainImg = toHttps(common?.firstimage || common?.firstimage2);
      if (mainImg) images.push(mainImg);

      for (const item of imageList) {
        const url = toHttps(item.originimgurl || item.smallimageurl);
        if (url && !images.includes(url)) images.push(url);
      }

      const intro: Record<string, string> = {};
      if (introRaw) {
        if (introRaw.usetime) intro['이용시간'] = sanitizeHtml(introRaw.usetime);
        if (introRaw.usetimeculture) intro['이용시간'] = sanitizeHtml(introRaw.usetimeculture);
        if (introRaw.restdate) intro['쉬는날'] = sanitizeHtml(introRaw.restdate);
        if (introRaw.restdateculture) intro['쉬는날'] = sanitizeHtml(introRaw.restdateculture);
        if (introRaw.parking) intro['주차시설'] = sanitizeHtml(introRaw.parking);
        if (introRaw.parkingculture) intro['주차시설'] = sanitizeHtml(introRaw.parkingculture);
        if (introRaw.usefee) intro['이용요금'] = sanitizeHtml(introRaw.usefee);
        if (introRaw.infocenter) intro['문의전화'] = sanitizeHtml(introRaw.infocenter);
        if (introRaw.infocenterculture) intro['문의전화'] = sanitizeHtml(introRaw.infocenterculture);

        if (introRaw.checkintime) intro['체크인'] = sanitizeHtml(introRaw.checkintime);
        if (introRaw.checkouttime) intro['체크아웃'] = sanitizeHtml(introRaw.checkouttime);
        if (introRaw.roomcount) intro['객실수'] = sanitizeHtml(introRaw.roomcount);
        if (introRaw.chkcooking) intro['취사여부'] = sanitizeHtml(introRaw.chkcooking);

        if (introRaw.opentimefood) intro['영업시간'] = sanitizeHtml(introRaw.opentimefood);
        if (introRaw.restdatefood) intro['쉬는날'] = sanitizeHtml(introRaw.restdatefood);
        if (introRaw.firstmenu) intro['대표메뉴'] = sanitizeHtml(introRaw.firstmenu);
        if (introRaw.treatmenu) intro['취급메뉴'] = sanitizeHtml(introRaw.treatmenu);
      }

      return {
        contentId,
        contentTypeId,
        title: common?.title ? sanitizeHtml(common.title) : '한옥 명소 상세',
        overview: common?.overview ? sanitizeHtml(common.overview) : '',
        addr1: common?.addr1 ? sanitizeHtml(common.addr1) : '',
        addr2: common?.addr2 ? sanitizeHtml(common.addr2) : '',
        tel: common?.tel ? sanitizeHtml(common.tel) : (intro['문의전화'] || null),
        images,
        mapx: Number(common?.mapx) || 0,
        mapy: Number(common?.mapy) || 0,
        intro,
        homepage: common?.homepage ? sanitizeHtml(common.homepage) : null,
      };
    } catch {
      return this.createFallbackDetail(contentId, contentTypeId);
    }
  }

  private static createFallbackDetail(
    contentId: string,
    contentTypeId: string,
  ): PlaceDetailData {
    return {
      contentId,
      contentTypeId,
      title: '한옥 명소 상세',
      overview: '한국의 전통미와 고즈넉한 정취를 품은 한옥 명소입니다.',
      addr1: '대한민국 전통 한옥 명소',
      addr2: '',
      tel: null,
      images: [],
      mapx: 0,
      mapy: 0,
      intro: { 이용시간: '상시 개방', 문의전화: '안내소 문의' },
      homepage: null,
    };
  }
}
