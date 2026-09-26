import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import { apiGet } from '@/lib/api/client';
import { getCuratedPlace, toPlaceDetailData } from '@/features/map/data/curatedPlaces';
import type { Item, PlaceCategory, PlaceDetailData } from '@/features/map/types';
import { sanitizeHtml, toHttps } from '@/features/map/utils/formatters';
import { distanceInMeters, isTraditionalPlace } from '@/features/map/utils/geo';


interface BackendMapPlaceItem {
  placeId: string;
  name: string;
  category: string;
  region: { regionCode: string; name: string };
  coordinates: { lat: number; lng: number };
  thumbnailUrl: string | null;
  summary: string;
  savedByMe: boolean;
}

interface BackendMapPlacesResponse {
  items: BackendMapPlaceItem[];
}

function mapBackendCategoryToPlaceCategory(category: string): PlaceCategory {
  if (category === '카페' || category.toUpperCase().includes('CAFE')) return 'cafe';
  if (category === '숙소' || category.toUpperCase().includes('STAY')) return 'stay';
  return 'spot';
}

const MAX_RADIUS = 20000;
const CACHE_TTL = 2 * 60 * 60 * 1000;





const CACHE_MAX_ENTRIES = 500;








const MAX_CONCURRENCY = 4;


const REQUEST_TIMEOUT_MS = 8000;


async function runPooled<T>(tasks: (() => Promise<T>)[], limit = MAX_CONCURRENCY): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit).map((task) => task());
    out.push(...(await Promise.all(batch)));
  }
  return out;
}

interface CacheEntry {
  expiresAt: number;
  items: Item[];
}

const CATEGORY_MAP: Record<PlaceCategory, { contentTypeId: string }> = {
  spot: { contentTypeId: '12' },
  experience: { contentTypeId: '28' },
  culture: { contentTypeId: '14' },
  festival: { contentTypeId: '15' },
  stay: { contentTypeId: '32' },
  food: { contentTypeId: '39' },
  cafe: { contentTypeId: '39' },
  market: { contentTypeId: '38' },
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











  private static async fetchFromBackend(opts: {
    lat: number;
    lng: number;
    radius: number;
  }): Promise<Item[] | null> {
    try {
      const latDelta = opts.radius / 111_000;
      const lngDelta = opts.radius / (111_000 * Math.cos((opts.lat * Math.PI) / 180));

      const swLat = opts.lat - latDelta;
      const swLng = opts.lng - lngDelta;
      const neLat = opts.lat + latDelta;
      const neLng = opts.lng + lngDelta;
      const res = await apiGet<BackendMapPlacesResponse>('/map/places', {
        bbox: `${swLng},${swLat},${neLng},${neLat}`,
      });

      if (!res.items || res.items.length === 0) return null;

      const center = { lat: opts.lat, lng: opts.lng };
      const items = res.items
        .map((it) => {
          const dist = Math.round(distanceInMeters(center, it.coordinates));
          return {
            id: it.placeId,
            name: it.name,
            category: mapBackendCategoryToPlaceCategory(it.category),
            lat: it.coordinates.lat,
            lng: it.coordinates.lng,
            addr: it.region?.name || '',
            image: it.thumbnailUrl,
            tel: null,
            dist,
            isTraditional: it.category === '한옥' || it.category.toUpperCase().includes('HANOK'),
            savedByMe: it.savedByMe,
          };
        })
        .filter((item) => item.dist <= opts.radius);



      return items.length > 0 ? items : null;
    } catch (err) {
      console.warn('[PlaceService] backend /map/places failed, falling back to TourAPI:', err);
      return null;
    }
  }


  public static async getNearbyPlaces(opts: {
    lat: number;
    lng: number;
    radius: number;
    category?: PlaceCategory | null;
  }): Promise<Item[]> {
    const isNationwide = opts.radius >= 20000;
    const radius = isNationwide ? 22000 : Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
    const cacheKey = this.getCacheKey(opts.lat, opts.lng, opts.radius, opts.category);


    const cached = this.placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    if (!opts.category && process.env.NEXT_PUBLIC_API_URL) {
      const backendItems = await this.fetchFromBackend({
        lat: opts.lat,
        lng: opts.lng,
        radius: opts.radius,
      });
      if (backendItems) {
        this.placeCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL, items: backendItems });
        return backendItems;
      }
    }


    const signal = () => AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const out: Item[] = [];
    const seen = new Set<string>();


    if (opts.category === 'festival') {
      const yearStart = `${new Date().getFullYear() - 1}0101`;

      const festivalQueries = await Promise.allSettled([
        TourApiClient.get(
          'searchFestival2',
          {
            eventStartDate: yearStart,
            arrange: 'E',
            numOfRows: 50,
          },
          signal(),
        ),
        TourApiClient.get(
          'areaBasedList2',
          {
            contentTypeId: '15',
            arrange: 'Q',
            numOfRows: 50,
          },
          signal(),
        ),
        TourApiClient.get(
          'searchKeyword2',
          {
            keyword: '야행',
            contentTypeId: '15',
            arrange: 'E',
            numOfRows: 30,
          },
          signal(),
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

          const dist = Math.round(distanceInMeters({ lat: opts.lat, lng: opts.lng }, { lat: y, lng: x }));


          if (!isNationwide && dist > radius) continue;

          out.push({
            id,
            name: title,
            category: 'festival',
            lat: y,
            lng: x,
            addr: String(row.addr1 ?? '').trim(),
            image: toHttps(String(row.firstimage || row.firstimage2 || '')),
            tel: row.tel ? String(row.tel).trim() : null,
            dist,
          });
        }
      });
    } else {

      const fetchTasks: (() => Promise<{ cType: string; rows: Record<string, unknown>[] }>)[] = [];

      if (isNationwide) {

        const coreKeywords = ['한옥', '고택', '문화재'];
        for (const kw of coreKeywords) {
          fetchTasks.push(() =>
            TourApiClient.get(
              'searchKeyword2',
              {
                keyword: kw,
                arrange: 'Q',
                numOfRows: 60,
              },
              signal(),
            )
              .then((res) => {

                if (res === null) return { cType: '12', rows: [], failed: true };
                const raw = res?.response?.body?.items?.item;
                const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
                return { cType: '12', rows };
              })
              .catch(() => ({ cType: '12', rows: [], failed: true })),
          );
        }
      } else {


        const targetParams: Record<string, string | number> = {
          mapX: opts.lng,
          mapY: opts.lat,
          radius,
          arrange: 'E',
          numOfRows: 80,
        };
        if (opts.category) {
          targetParams.contentTypeId = CATEGORY_MAP[opts.category].contentTypeId;
        }

        fetchTasks.push(() =>
          TourApiClient.get(
            'locationBasedList2',
            targetParams,
            signal(),
          )
            .then((res) => {

              if (res === null) return { cType: '', rows: [], failed: true };
              const raw = res?.response?.body?.items?.item;
              const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
              return { cType: String(targetParams.contentTypeId || ''), rows };
            })
            .catch(() => ({ cType: '', rows: [], failed: true })),
        );
      }

      const results = await runPooled(fetchTasks);











      if (results.length > 0 && results.every((r) => 'failed' in r && r.failed)) {
        throw new Error('관광공사 API 응답을 받지 못했습니다');
      }

      results.forEach((value) => {
        const { cType, rows } = value;

        for (const row of rows) {
          const id = String(row.contentid);
          if (seen.has(id)) continue;
          seen.add(id);

          const title = String(row.title ?? '').trim();
          const cat3 = String(row.cat3 ?? '');
          const y = Number(row.mapy);
          const x = Number(row.mapx);
          if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;

          const rowCType = String(row.contenttypeid || cType || '12');
          let category: PlaceCategory = 'spot';
          if (rowCType === '32') category = 'stay';
          else if (rowCType === '28') category = 'experience';
          else if (rowCType === '14') category = 'culture';
          else if (rowCType === '15') category = 'festival';
          else if (rowCType === '38') category = 'market';
          else if (rowCType === '39') {
            category =
              cat3 === 'A05020900' || /(카페|찻집|커피|다원)/.test(title)
                ? 'cafe'
                : 'food';
          }

          if (opts.category && category !== opts.category) continue;


          const dist = Math.round(
            distanceInMeters({ lat: opts.lat, lng: opts.lng }, { lat: y, lng: x }),
          );

          const isTraditional = isTraditionalPlace(title, cat3);

          out.push({
            id,
            name: title,
            category,
            lat: y,
            lng: x,
            addr: String(row.addr1 ?? '').trim(),
            image: toHttps(String(row.firstimage || row.firstimage2 || '')),
            tel: row.tel ? String(row.tel).trim() : null,
            dist,
            isTraditional,
          });
        }
      });
    }


    this.placeCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL,
      items: out,
    });
    while (this.placeCache.size > CACHE_MAX_ENTRIES) {
      const oldest = this.placeCache.keys().next().value;
      if (oldest === undefined) break;
      this.placeCache.delete(oldest);
    }

    return out;
  }


  public static async getPlaceDetail(
    contentId: string,
    contentTypeId: string = '12',
  ): Promise<PlaceDetailData> {

    const curated = getCuratedPlace(contentId);
    if (curated && !/^\d+$/.test(contentId)) {
      return toPlaceDetailData(curated);
    }

    const signal = () => AbortSignal.timeout(REQUEST_TIMEOUT_MS);

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
          signal(),
        ),
        TourApiClient.get(
          'detailIntro2',
          { contentId, contentTypeId },
          signal(),
        ),
        TourApiClient.get(
          'detailImage2',
          { contentId, imageYN: 'Y', subImageYN: 'Y', numOfRows: '10' },
          signal(),
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
    const curated = getCuratedPlace(contentId);
    if (curated) {
      return toPlaceDetailData(curated);
    }

    return {
      contentId,
      contentTypeId,
      title: '상세 정보',
      overview: '',
      addr1: '',
      addr2: '',
      tel: null,
      images: [],
      mapx: 0,
      mapy: 0,
      intro: {},
      homepage: null,
    };
  }
}
