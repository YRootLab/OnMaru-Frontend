import { TourApiClient } from '@/lib/tour-api/tourApiClient';
import type { Item, PlaceCategory, PlaceDetailData } from '@/map/types';
import { sanitizeHtml, toHttps } from '@/map/utils/formatters';
import { distanceInMeters, isTraditionalPlace } from '@/map/utils/geo';

const MAX_RADIUS = 20000;
const CACHE_TTL = 10 * 60 * 1000; // 10분

/**
 * 캐시 상한. 지도를 오래 돌아다니면 키가 계속 늘어나 서버 인스턴스 메모리를 먹는다.
 * 가장 오래된 것부터 버린다(Map은 삽입 순서를 지킨다).
 */
const CACHE_MAX_ENTRIES = 200;

/**
 * TourAPI 동시 호출 상한.
 *
 * 전국 조망은 17개 시·도 + 키워드 3개 = 20개를 한 번에 던졌다. 공공데이터포털은
 * 동시 요청을 조이기 때문에 그중 일부가 통째로 비어 돌아왔다. 4개씩 끊어 보내면
 * 전체 소요는 비슷하면서 빈 응답이 사라진다.
 */
const MAX_CONCURRENCY = 4;

/** 요청 하나가 기다리는 시간. 예전에는 signal 하나를 20개가 공유해 함께 죽었다. */
const REQUEST_TIMEOUT_MS = 8000;

/** task를 limit개씩 끊어 실행한다. */
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

/** 한옥 및 전통 문화재 장소 데이터 서비스 */
export class PlaceService {
  private static placeCache = new Map<string, CacheEntry>();

  /** 캐시 키 생성 */
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

  /** 주변 및 전국 장소 목록 실시간 조회 */
  public static async getNearbyPlaces(opts: {
    lat: number;
    lng: number;
    radius: number;
    category?: PlaceCategory | null;
  }): Promise<Item[]> {
    const isNationwide = opts.radius >= 20000;
    const radius = isNationwide ? 22000 : Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
    const cacheKey = this.getCacheKey(opts.lat, opts.lng, opts.radius, opts.category);

    // 캐시 히트 검사
    const cached = this.placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    /* 요청마다 새 타임아웃을 준다. 하나를 공유하면 뒤 배치가 시작도 못 하고 죽는다. */
    const signal = () => AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const out: Item[] = [];
    const seen = new Set<string>();

    // 축제/야행 카테고리 실시간 수집
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

          // 지역을 좁혀 보고 있으면 화면 밖 축제까지 끌어오지 않는다.
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
      // 일반 및 전체 카테고리 실시간 병렬 호출
      const fetchTasks: (() => Promise<{ cType: string; rows: Record<string, unknown>[] }>)[] = [];

      if (isNationwide) {
        // 전국 17개 광역 시·도별 장소 및 핵심 키워드 병렬 쿼리
        const AREA_CODES = ['1', '2', '3', '4', '5', '6', '7', '8', '31', '32', '33', '34', '35', '36', '37', '38', '39'];
        const targetContentType = opts.category ? CATEGORY_MAP[opts.category].contentTypeId : '12';

        for (const aCode of AREA_CODES) {
          fetchTasks.push(() =>
            TourApiClient.get(
              'areaBasedList2',
              {
                areaCode: aCode,
                contentTypeId: targetContentType,
                arrange: 'Q',
                numOfRows: 25,
              },
              signal(),
            )
              .then((res) => {
                const raw = res?.response?.body?.items?.item;
                const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
                return { cType: targetContentType, rows };
              })
              .catch(() => ({ cType: targetContentType, rows: [] })),
          );
        }

        // 전통 문화재 핵심 키워드 쿼리
        const coreKeywords = ['한옥', '고택', '문화재'];
        for (const kw of coreKeywords) {
          fetchTasks.push(() =>
            TourApiClient.get(
              'searchKeyword2',
              {
                keyword: kw,
                arrange: 'Q',
                numOfRows: 80,
              },
              signal(),
            )
              .then((res) => {
                const raw = res?.response?.body?.items?.item;
                const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
                return { cType: '12', rows };
              })
              .catch(() => ({ cType: '12', rows: [] })),
          );
        }
      } else {
        // 현재 지도 중심 기준 위치 쿼리
        const contentTypes = opts.category
          ? [CATEGORY_MAP[opts.category].contentTypeId]
          : ['12', '14', '15', '28', '32', '38', '39'];

        for (const cType of contentTypes) {
          fetchTasks.push(() =>
            TourApiClient.get(
              'locationBasedList2',
              {
                mapX: opts.lng,
                mapY: opts.lat,
                radius,
                contentTypeId: cType,
                arrange: 'E',
                numOfRows: 30,
              },
              signal(),
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

      const results = await runPooled(fetchTasks);

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

          // 검색 중심(opts.lat, opts.lng) 기준 거리 — utils/geo가 유일한 계산기다.
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

    // 4. 캐시 저장 (상한을 넘으면 가장 오래된 항목부터 버린다)
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

  /** 장소 상세 정보 조회 */
  public static async getPlaceDetail(
    contentId: string,
    contentTypeId = '12',
  ): Promise<PlaceDetailData> {
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
