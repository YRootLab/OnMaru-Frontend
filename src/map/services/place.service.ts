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

/**
 * 🌟 전국 36개 세부 소도시 & 군(郡) 거점 좌표 (한국관광공사 TourAPI 전국 권역 병렬 수집용)
 */
const NATIONWIDE_HUBS = [
  { lat: 37.58, lng: 126.98 }, // 1. 서울 종로/북촌
  { lat: 37.28, lng: 127.01 }, // 2. 경기 수원/용인
  { lat: 37.75, lng: 126.48 }, // 3. 인천 강화
  { lat: 38.33, lng: 128.50 }, // 4. 강원 고성/속초
  { lat: 37.79, lng: 128.89 }, // 5. 강원 강릉
  { lat: 37.38, lng: 128.66 }, // 6. 강원 정선/평창
  { lat: 37.19, lng: 128.45 }, // 7. 강원 영월/삼척
  { lat: 36.73, lng: 127.01 }, // 8. 충남 아산/천안
  { lat: 36.46, lng: 127.12 }, // 9. 충남 공주/부여
  { lat: 36.21, lng: 127.13 }, // 10. 충남 논산/금산
  { lat: 36.75, lng: 126.79 }, // 11. 충남 예산/서산/태안
  { lat: 36.48, lng: 127.72 }, // 12. 충북 보은/괴산/옥천
  { lat: 37.05, lng: 128.35 }, // 13. 충북 제천/단양
  { lat: 35.815, lng: 127.153 }, // 14. 전북 전주/완주
  { lat: 35.40, lng: 127.38 }, // 15. 전북 남원/임실/순창
  { lat: 35.43, lng: 126.70 }, // 16. 전북 고창/부안/정읍
  { lat: 36.00, lng: 127.66 }, // 17. 전북 무주/장수/진안
  { lat: 35.18, lng: 126.99 }, // 18. 전남 담양/장성
  { lat: 34.90, lng: 127.33 }, // 19. 전남 순천/여수/보성
  { lat: 35.26, lng: 127.48 }, // 20. 전남 구례/곡성/광양
  { lat: 34.75, lng: 126.59 }, // 21. 전남 영암/나주/화순
  { lat: 34.55, lng: 126.61 }, // 22. 전남 해남/강진/장흥
  { lat: 34.15, lng: 126.55 }, // 23. 전남 완도/진도/신안
  { lat: 36.54, lng: 128.52 }, // 24. 경북 안동/예천
  { lat: 36.75, lng: 128.62 }, // 25. 경북 영주/봉화/문경
  { lat: 36.41, lng: 129.04 }, // 26. 경북 청송/영양/영덕/울진
  { lat: 35.83, lng: 129.22 }, // 27. 경북 경주/포항
  { lat: 35.88, lng: 128.29 }, // 28. 경북 성주/고령/칠곡/군위
  { lat: 35.59, lng: 127.75 }, // 29. 경남 함양/거창
  { lat: 35.29, lng: 127.97 }, // 30. 경남 산청/하동
  { lat: 35.80, lng: 128.09 }, // 31. 경남 합천/의령/창녕
  { lat: 35.49, lng: 128.75 }, // 32. 경남 밀양/양산
  { lat: 34.72, lng: 127.89 }, // 33. 경남 남해/통영/거제
  { lat: 33.38, lng: 126.79 }, // 34. 제주 서귀포 표선
  { lat: 33.23, lng: 126.28 }, // 35. 제주 서귀포 대정
  { lat: 33.51, lng: 126.52 }, // 36. 제주시
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
   * 한국관광공사 실제 TourAPI 4.0 100% 실시간 공공데이터 호출 (Mock 데이터 배제)
   */
  public static async getNearbyPlaces(opts: {
    lat: number;
    lng: number;
    radius: number;
    category?: PlaceCategory | null;
  }): Promise<Item[]> {
    const isNationwide = opts.radius >= 20000;
    const radius = isNationwide ? 22000 : Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
    const cacheKey = this.getCacheKey(opts.lat, opts.lng, opts.radius, opts.category);

    // 1. 캐시 히트 검사
    const cached = this.placeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    const signal = AbortSignal.timeout(10000);
    const out: Item[] = [];
    const seen = new Set<string>();

    // 🌟 2. 축제/야행(festival) 카테고리 요청 시: TourAPI searchFestival2 & areaBasedList2 실시간 수집
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
          signal,
        ),
        TourApiClient.get(
          'areaBasedList2',
          {
            contentTypeId: '15',
            arrange: 'Q',
            numOfRows: 50,
          },
          signal,
        ),
        TourApiClient.get(
          'searchKeyword2',
          {
            keyword: '야행',
            contentTypeId: '15',
            arrange: 'E',
            numOfRows: 30,
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

          const dLat = (y - opts.lat) * 111000;
          const dLng = (x - opts.lng) * 88800;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

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
      // 🌟 3. 일반/전체 카테고리 TourAPI 4.0 실시간 병렬 호출
      const queryCenters = isNationwide
        ? NATIONWIDE_HUBS
        : [{ lat: opts.lat, lng: opts.lng }];

      const contentTypes = opts.category
        ? [CATEGORY_MAP[opts.category].contentTypeId]
        : ['12', '14', '15', '28', '32', '38', '39'];

      const fetchTasks: Promise<{ cType: string; rows: Record<string, unknown>[] }>[] = [];

      // 3-1. 위치 기반 locationBasedList2 실시간 쿼리
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
                numOfRows: isNationwide ? 6 : 25,
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

      // 3-2. 전국 17개 광역 시·도별 areaBasedList2 실시간 병렬 쿼리 (서울~제주 전역 균형 수집)
      if (isNationwide) {
        const AREA_CODES = ['1', '2', '3', '4', '5', '6', '7', '8', '31', '32', '33', '34', '35', '36', '37', '38', '39'];
        for (const aCode of AREA_CODES) {
          fetchTasks.push(
            TourApiClient.get(
              'areaBasedList2',
              {
                areaCode: aCode,
                contentTypeId: opts.category ? CATEGORY_MAP[opts.category].contentTypeId : '12',
                arrange: 'Q',
                numOfRows: 15,
              },
              signal,
            )
              .then((res) => {
                const raw = res?.response?.body?.items?.item;
                const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
                return { cType: opts.category ? CATEGORY_MAP[opts.category].contentTypeId : '12', rows };
              })
              .catch(() => ({ cType: '12', rows: [] })),
          );
        }
      }

      // 3-3. 전국 각지의 한옥마을 및 전통 문화재 키워드 searchKeyword2 실시간 병렬 쿼리
      const traditionalKeywords = [
        '한옥마을',
        '전통마을',
        '민속마을',
        '고가마을',
        '한옥',
        '고택',
        '종택',
        '서원',
        '향교',
        '사찰',
        '궁궐',
      ];
      for (const kw of traditionalKeywords) {
        fetchTasks.push(
          TourApiClient.get(
            'searchKeyword2',
            {
              keyword: kw,
              arrange: 'Q',
              numOfRows: isNationwide ? 60 : 30,
            },
            signal,
          )
            .then((res) => {
              const raw = res?.response?.body?.items?.item;
              const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[];
              return { cType: '12', rows };
            })
            .catch(() => ({ cType: '12', rows: [] })),
        );
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

          // 사용자 중심점(opts.lat, opts.lng) 기준 절대거리 계산
          const dLat = (y - opts.lat) * 111000;
          const dLng = (x - opts.lng) * 88800;
          const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

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
   * 장소 상세 정보 조회 (TourAPI detailCommon2, detailIntro2, detailImage2 실시간 100% 공공데이터)
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
