import { NextResponse } from 'next/server';
import { fetchPlaces, PLACE_CATEGORIES } from '@/lib/tourapiPlaces';
import type { PlaceCategory } from '@/map/types';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const lat = Number(q.get('lat'));
  const lng = Number(q.get('lng'));
  const radius = Number(q.get('radius')) || 3000;
  const raw = q.get('category');

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat/lng 필요' }, { status: 400 });
  }

  const category = PLACE_CATEGORIES.includes(raw as PlaceCategory)
    ? (raw as PlaceCategory)
    : null;

  try {
    const items = await fetchPlaces({ lat, lng, radius, category });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TourAPI 호출 실패';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
