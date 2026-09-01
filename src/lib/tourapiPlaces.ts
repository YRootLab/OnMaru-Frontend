import { logger } from '@/lib/log';
import type { Item, PlaceCategory } from '@/map/types';

const log = logger('map');

const BASE = 'https://apis.data.go.kr/B551011/KorService2/locationBasedList2';

/** locationBasedList2가 받는 최대 반경. */
const MAX_RADIUS = 20000;

/**
 * TourAPI 전체 데드라인. 타임아웃이 없으면 상대가 안 끊는 한 요청이 그대로 매달리고,
 * 그게 그대로 클라이언트 무한 로딩이 된다.
 */
const TIMEOUT_MS = 10_000;

/**
 * 인메모리 캐시 — 동일 좌표/반경 반복 요청 시 0ms 즉각 반환
 */
interface CacheEntry {
  expiresAt: number;
  items: Item[];
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

function getCacheKey(lat: number, lng: number, radius: number, category?: PlaceCategory | null): string {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  const roundedRadius = Math.round(radius / 500) * 500;
  return `${roundedLat}_${roundedLng}_${roundedRadius}_${category || 'all'}`;
}

const CATEGORY_MAP: Record<
  PlaceCategory,
  { contentTypeId: string; keep: (cat3: string, title: string) => boolean }
> = {
  spot: { contentTypeId: '12', keep: () => true },
  stay: { contentTypeId: '32', keep: (cat3) => cat3 === 'B02011600' || true }, // 한옥 또는 일반 숙소
  food: { contentTypeId: '39', keep: (cat3) => cat3 !== 'A05020900' },
  cafe: { contentTypeId: '39', keep: (cat3, title) => cat3 === 'A05020900' || /(카페|찻집|커피|다원)/.test(title) },
  market: {
    contentTypeId: '38',
    keep: (cat3, title) => cat3 === 'A04010100' || cat3 === 'A04010200' || title.includes('시장'),
  },
};

export const PLACE_CATEGORIES = Object.keys(CATEGORY_MAP) as PlaceCategory[];

function toHttps(url?: string | null): string | null {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}

interface TourApiRawItem {
  contentid?: string | number;
  title?: string;
  cat3?: string;
  mapy?: string | number;
  mapx?: string | number;
  addr1?: string;
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  dist?: string | number;
}

async function fetchByContentType(
  contentTypeId: string,
  lat: number,
  lng: number,
  radius: number,
  apiKey: string,
  signal?: AbortSignal,
): Promise<TourApiRawItem[]> {
  const query =
    `MobileOS=ETC&MobileApp=OnMaru&_type=json&arrange=E` +
    `&mapX=${lng}&mapY=${lat}&radius=${radius}` +
    `&contentTypeId=${contentTypeId}&numOfRows=30`;

  const urls = [
    `${BASE}?serviceKey=${encodeURIComponent(apiKey)}&${query}`,
    `${BASE}?serviceKey=${apiKey}&${query}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        log.warn('tourapi non-ok', contentTypeId, res.status);
        continue;
      }

      const text = await res.text();
      if (!text.trim().startsWith('{')) continue;

      const json = JSON.parse(text);
      const raw = json?.response?.body?.items?.item;
      return Array.isArray(raw) ? raw : raw ? [raw] : [];
    } catch (e) {
      // TimeoutError면 10초 데드라인에 걸린 것.
      log.warn('tourapi 호출 실패', contentTypeId, e instanceof Error ? e.name : e);
      continue;
    }
  }
  return [];
}

/**
 * 지도 뷰포트 기준 장소 검색.
 * - 인메모리 캐시 우선 반환 (0ms)
 * - contentTypeId 중복 제거 (12, 32, 38, 39 병렬 1회 호출)
 */
export async function fetchPlaces(opts: {
  lat: number;
  lng: number;
  radius: number;
  category?: PlaceCategory | null;
}): Promise<Item[]> {
  const apiKey =
    process.env.TOUR_API_KEY ||
    process.env.TOUR_API_CONGESTION_KEY ||
    process.env.NEXT_PUBLIC_TOUR_API_KEY;
  if (!apiKey) throw new Error('TOUR_API_KEY 없음');

  const radius = Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
  const cacheKey = getCacheKey(opts.lat, opts.lng, radius, opts.category);

  // 1. 캐시 히트 검사
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    log.log('cache hit', cacheKey, cached.items.length);
    return cached.items;
  }

  // 병렬 호출 전체가 하나의 데드라인을 공유한다. 호출당 걸면 4개 × 2회 = 최악 80초.
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  const out: Item[] = [];

  // 2. 단일 카테고리 요청인 경우 (단 1회의 API 호출)
  if (opts.category) {
    const config = CATEGORY_MAP[opts.category];
    const rows = await fetchByContentType(
      config.contentTypeId, opts.lat, opts.lng, radius, apiKey, signal,
    );

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
        tel: String(row.tel ?? '').trim() || null,
        dist: Number.isFinite(Number(row.dist)) ? Math.round(Number(row.dist)) : null,
      });
    }
  } else {
    // 3. 전체 카테고리인 경우: 12(관광), 32(숙박), 39(음식/카페), 38(쇼핑) 4개만 병렬 호출
    const [spots, stays, foodsAndCafes, shops] = await Promise.all([
      fetchByContentType('12', opts.lat, opts.lng, radius, apiKey, signal),
      fetchByContentType('32', opts.lat, opts.lng, radius, apiKey, signal),
      fetchByContentType('39', opts.lat, opts.lng, radius, apiKey, signal),
      fetchByContentType('38', opts.lat, opts.lng, radius, apiKey, signal),
    ]);

    // spots
    for (const row of spots) {
      const title = String(row.title ?? '').trim();
      const y = Number(row.mapy);
      const x = Number(row.mapx);
      if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;
      out.push({
        id: String(row.contentid),
        name: title,
        category: 'spot',
        lat: y,
        lng: x,
        addr: String(row.addr1 ?? '').trim(),
        image: toHttps(row.firstimage || row.firstimage2),
        tel: String(row.tel ?? '').trim() || null,
        dist: Number.isFinite(Number(row.dist)) ? Math.round(Number(row.dist)) : null,
      });
    }

    // stays
    for (const row of stays) {
      const title = String(row.title ?? '').trim();
      const y = Number(row.mapy);
      const x = Number(row.mapx);
      if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;
      out.push({
        id: String(row.contentid),
        name: title,
        category: 'stay',
        lat: y,
        lng: x,
        addr: String(row.addr1 ?? '').trim(),
        image: toHttps(row.firstimage || row.firstimage2),
        tel: String(row.tel ?? '').trim() || null,
        dist: Number.isFinite(Number(row.dist)) ? Math.round(Number(row.dist)) : null,
      });
    }

    // foods & cafes
    for (const row of foodsAndCafes) {
      const title = String(row.title ?? '').trim();
      const cat3 = String(row.cat3 ?? '');
      const y = Number(row.mapy);
      const x = Number(row.mapx);
      if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;

      const isCafe = cat3 === 'A05020900' || /(카페|찻집|커피|다원)/.test(title);
      out.push({
        id: String(row.contentid),
        name: title,
        category: isCafe ? 'cafe' : 'food',
        lat: y,
        lng: x,
        addr: String(row.addr1 ?? '').trim(),
        image: toHttps(row.firstimage || row.firstimage2),
        tel: String(row.tel ?? '').trim() || null,
        dist: Number.isFinite(Number(row.dist)) ? Math.round(Number(row.dist)) : null,
      });
    }

    // markets
    for (const row of shops) {
      const title = String(row.title ?? '').trim();
      const cat3 = String(row.cat3 ?? '');
      const y = Number(row.mapy);
      const x = Number(row.mapx);
      if (!title || !Number.isFinite(y) || !Number.isFinite(x)) continue;
      if (cat3 === 'A04010100' || cat3 === 'A04010200' || title.includes('시장')) {
        out.push({
          id: String(row.contentid),
          name: title,
          category: 'market',
          lat: y,
          lng: x,
          addr: String(row.addr1 ?? '').trim(),
          image: toHttps(row.firstimage || row.firstimage2),
          tel: String(row.tel ?? '').trim() || null,
          dist: Number.isFinite(Number(row.dist)) ? Math.round(Number(row.dist)) : null,
        });
      }
    }
  }

  const sorted = out.sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9));

  // 실패해서 빈 결과가 나온 걸 10분간 캐시하면 그 지역이 10분 내내 빈다.
  if (sorted.length === 0) return sorted;

  // 캐시 저장 (최대 100개 유지)
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL,
    items: sorted,
  });

  return sorted;
}
