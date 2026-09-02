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

const NATIONWIDE_HUBS = [
  { lat: 37.58, lng: 126.98 }, // 서울·북촌·경복궁
  { lat: 35.815, lng: 127.153 }, // 전주 한옥마을
  { lat: 36.54, lng: 128.80 }, // 안동 하회마을·서원
  { lat: 35.83, lng: 129.22 }, // 경주 양동마을·유적
  { lat: 35.15, lng: 127.15 }, // 담양·순천 낙안읍성
  { lat: 37.79, lng: 128.89 }, // 강릉 선교장·오죽헌
];

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
    const isNationwide = opts.radius >= 20000;
    const radius = isNationwide ? 15000 : Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
    const cacheKey = this.getCacheKey(opts.lat, opts.lng, opts.radius, opts.category);

    // 1. 캐시 히트 검사
    const cached = this.placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    const signal = AbortSignal.timeout(10000);
    const out: Item[] = [];
    const seen = new Set<string>();

    // 🌟 2. 축제/야행(festival) 카테고리 요청 시: TourAPI searchFestival2 및 전국 문화재 야행 병렬 수집
    if (opts.category === 'festival') {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const yearStart = `${new Date().getFullYear() - 1}0101`;

      const festivalQueries = await Promise.allSettled([
        TourApiClient.get(
          'searchFestival2',
          {
            eventStartDate: yearStart,
            arrange: 'E',
            numOfRows: 30,
          },
          signal,
        ),
        TourApiClient.get(
          'areaBasedList2',
          {
            contentTypeId: '15',
            arrange: 'Q',
            numOfRows: 30,
          },
          signal,
        ),
        TourApiClient.get(
          'locationBasedList2',
          {
            mapX: opts.lng,
            mapY: opts.lat,
            radius: Math.max(15000, radius),
            contentTypeId: '15',
            arrange: 'E',
            numOfRows: 25,
          },
          signal,
        ),
      ]);

      festivalQueries.forEach((res) => {
        if (res.status !== 'fulfilled' || !res.value) return;
        const raw = res.value?.response?.body?.items?.item;
        const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];

        for (const row of rows) {
          const id = String(row.contentid);
          if (seen.has(id)) continue;
          seen.add(id);

          const title = String(row.title ?? '').trim();
          const y = Number(row.mapy);
          const x = Number(row.mapx);
          if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;

          out.push({
            id,
            name: title,
            category: 'festival',
            lat: y,
            lng: x,
            addr: String(row.addr1 ?? '').trim(),
            image: toHttps(String(row.firstimage || row.firstimage2 || '')),
            tel: row.tel ? String(row.tel).trim() : null,
            dist: row.dist !== undefined ? Number(row.dist) : null,
          });
        }
      });

      // 전국 대표 문화재 야행 및 고택 축제 보장 리스트 병합
      const DEFAULT_FESTIVALS = [
        {
          id: '2941014',
          name: '2026 전주 한옥마을 문화재 야행',
          category: 'festival' as PlaceCategory,
          lat: 35.815,
          lng: 127.153,
          addr: '전북 전주시 완산구 태조로 44',
          image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
          tel: '063-281-2114',
        },
        {
          id: '2684898',
          name: '경복궁 별빛야행 & 달빛기행',
          category: 'festival' as PlaceCategory,
          lat: 37.58,
          lng: 126.98,
          addr: '서울 종로구 사직로 161 경복궁 일원',
          image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
          tel: '02-3700-3900',
        },
        {
          id: '139433',
          name: '안동 하회마을 선유줄불놀이',
          category: 'festival' as PlaceCategory,
          lat: 36.54,
          lng: 128.80,
          addr: '경북 안동시 풍천면 하회리 만송정 일원',
          image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
          tel: '054-853-0103',
        },
        {
          id: '141364',
          name: '수원화성 문화제 & 미디어아트',
          category: 'festival' as PlaceCategory,
          lat: 37.287,
          lng: 127.015,
          addr: '경기 수원시 팔달구 정조로 825',
          image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
          tel: '031-290-3600',
        },
        {
          id: '1038753',
          name: '남산골 한옥마을 전통세시풍속 축제',
          category: 'festival' as PlaceCategory,
          lat: 37.559,
          lng: 126.994,
          addr: '서울 중구 퇴계로34길 28',
          image: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
          tel: '02-2261-0517',
        },
      ];

      for (const fes of DEFAULT_FESTIVALS) {
        if (!seen.has(fes.id)) {
          seen.add(fes.id);
          const dLat = (fes.lat - opts.lat) * 111000;
          const dLng = (fes.lng - opts.lng) * 88800;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
          out.push({ ...fes, dist });
        }
      }
    } else {
      // 🌟 일반/전체 카테고리 요청
      const queryCenters = isNationwide
        ? NATIONWIDE_HUBS
        : [{ lat: opts.lat, lng: opts.lng }];

      const contentTypes = opts.category
        ? [CATEGORY_MAP[opts.category].contentTypeId]
        : ['12', '14', '15', '28', '32', '38', '39'];

      const fetchTasks: Promise<{ cType: string; rows: Record<string, unknown>[] }>[] = [];

      for (const center of queryCenters) {
        for (const cType of contentTypes) {
          fetchTasks.push(
            TourApiClient.get(
              'locationBasedList2',
              {
                mapX: center.lng,
                mapY: center.lat,
                radius,
                contentTypeId: cType,
                arrange: 'E',
                numOfRows: isNationwide ? 12 : 25,
              },
              signal,
            )
              .then((res) => {
                const raw = res?.response?.body?.items?.item;
                const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
                return { cType, rows };
              })
              .catch(() => ({ cType, rows: [] })),
          );
        }
      }

      const results = await Promise.allSettled(fetchTasks);

      results.forEach((res) => {
        if (res.status !== 'fulfilled' || !res.value) return;
        const { cType, rows } = res.value;

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

          if (opts.category && category !== opts.category) continue;

          out.push({
            id,
            name: title,
            category,
            lat: y,
            lng: x,
            addr: String(row.addr1 ?? '').trim(),
            image: toHttps(String(row.firstimage || row.firstimage2 || '')),
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
