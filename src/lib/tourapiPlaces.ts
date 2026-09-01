import type { Item, PlaceCategory } from '@/map/types';

const BASE = 'https://apis.data.go.kr/B551011/KorService2/locationBasedList2';

/** locationBasedList2가 받는 최대 반경. */
const MAX_RADIUS = 20000;

/**
 * 분류 규칙 — 실제 응답에서 확인한 값이다 (전주 한옥마을 반경 3km 기준).
 * cat3까지 API 파라미터로 넘기지 않고 contentTypeId로 한 번만 받아 여기서 가른다.
 * 식당/카페가 같은 39를 쓰기 때문에 어차피 한쪽은 후처리가 필요하다.
 */
const CATEGORY_QUERY: Record<
  PlaceCategory,
  { contentTypeId: string; keep: (cat3: string, title: string) => boolean }
> = {
  spot: { contentTypeId: '12', keep: () => true },
  stay: { contentTypeId: '32', keep: (cat3) => cat3 === 'B02011600' }, // B02011600 = 한옥
  food: { contentTypeId: '39', keep: (cat3) => cat3 !== 'A05020900' },
  cafe: { contentTypeId: '39', keep: (cat3) => cat3 === 'A05020900' },
  market: {
    contentTypeId: '38',
    keep: (cat3, title) => cat3 === 'A04010200' || title.includes('시장'),
  },
};

export const PLACE_CATEGORIES = Object.keys(CATEGORY_QUERY) as PlaceCategory[];

function toHttps(url?: string | null): string | null {
  const s = String(url ?? '').trim();
  if (!s) return null;
  return s.startsWith('http://') ? `https://${s.slice(7)}` : s;
}

async function fetchOne(
  category: PlaceCategory,
  lat: number,
  lng: number,
  radius: number,
  apiKey: string,
): Promise<Item[]> {
  const { contentTypeId, keep } = CATEGORY_QUERY[category];
  const url =
    `${BASE}?serviceKey=${encodeURIComponent(apiKey)}` +
    `&MobileOS=ETC&MobileApp=OnMaru&_type=json&arrange=E` +
    `&mapX=${lng}&mapY=${lat}&radius=${radius}` +
    `&contentTypeId=${contentTypeId}&numOfRows=50`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TourAPI ${res.status}`);

  const json = await res.json();
  const raw = json?.response?.body?.items?.item;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const out: Item[] = [];
  for (const row of rows) {
    const title = String(row.title ?? '').trim();
    const cat3 = String(row.cat3 ?? '');
    if (!title || !keep(cat3, title)) continue;

    const y = Number(row.mapy);
    const x = Number(row.mapx);
    if (!Number.isFinite(y) || !Number.isFinite(x)) continue;

    out.push({
      id: String(row.contentid),
      name: title,
      category,
      lat: y,
      lng: x,
      addr: String(row.addr1 ?? '').trim(),
      image: toHttps(row.firstimage || row.firstimage2),
      tel: String(row.tel ?? '').trim() || null,
      dist: Number.isFinite(Number(row.dist)) ? Math.round(Number(row.dist)) : null,
    });
  }
  return out;
}

/**
 * 지도 뷰포트 기준 장소 검색.
 * category를 비우면 다섯 카테고리를 한 번에 받아 거리순으로 섞는다.
 */
export async function fetchPlaces(opts: {
  lat: number;
  lng: number;
  radius: number;
  category?: PlaceCategory | null;
}): Promise<Item[]> {
  const apiKey = process.env.TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY;
  if (!apiKey) throw new Error('TOUR_API_KEY 없음');

  const radius = Math.min(MAX_RADIUS, Math.max(1000, Math.round(opts.radius)));
  const targets = opts.category ? [opts.category] : PLACE_CATEGORIES;

  const settled = await Promise.allSettled(
    targets.map((c) => fetchOne(c, opts.lat, opts.lng, radius, apiKey)),
  );

  // 카테고리 하나가 죽어도 나머지는 보여준다. 지도가 통째로 비는 것보다 낫다.
  const merged = new Map<string, Item>();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) if (!merged.has(item.id)) merged.set(item.id, item);
  }

  return Array.from(merged.values()).sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9));
}
