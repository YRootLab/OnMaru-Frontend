import { NextResponse } from 'next/server';
import { logger } from '@/lib/log';
import { fetchPlaces, PLACE_CATEGORIES } from '@/lib/tourapiPlaces';
import type { PlaceCategory } from '@/map/types';

const log = logger('map');

/**
 * 어떤 경우에도 200 + items 배열을 돌려준다.
 * 4xx/5xx로 던지면 클라이언트가 로딩을 못 끝내는 경로가 하나 더 생긴다.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const lat = Number(q.get('lat'));
  const lng = Number(q.get('lng'));
  const radius = Number(q.get('radius')) || 3000;
  const raw = q.get('category');
  const category = PLACE_CATEGORIES.includes(raw as PlaceCategory)
    ? (raw as PlaceCategory)
    : null;

  log.log('route: start', { lat, lng, radius, category });
  // 값은 절대 찍지 않는다. 있는지 없는지만.
  log.log('route: key present:', Boolean(process.env.TOUR_API_KEY || process.env.NEXT_PUBLIC_TOUR_API_KEY));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    log.error('route: lat/lng 없음', { lat, lng });
    return NextResponse.json({ items: [], error: 'lat/lng 필요' });
  }

  const t0 = Date.now();
  try {
    log.log('route: tourapi call');
    const items = await fetchPlaces({ lat, lng, radius, category });
    log.log('route: done', items.length, `${Date.now() - t0}ms`);
    return NextResponse.json({ items });
  } catch (error) {
    log.error('fetch failed', `${Date.now() - t0}ms`, error);
    return NextResponse.json({
      items: [],
      error: error instanceof Error ? error.message : 'TourAPI 호출 실패',
    });
  }
}
