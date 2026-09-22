import { NextResponse } from 'next/server';
import { PlaceService, PLACE_CATEGORIES } from '@/features/map/services/place.service';
import { getCuratedPlace } from '@/features/map/data/curatedPlaces';
import { seedWarmth } from '@/features/map/warmth/seed';
import { distanceInMeters } from '@/features/map/utils/geo';
import type { Item, PlaceCategory } from '@/features/map/types';








function fallbackPlaces(lat: number, lng: number): Item[] {

  const seen = new Set<string>();

  return seedWarmth()
    .filter((s) => {
      const key = s.placeId || s.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s) => {
      const curated = getCuratedPlace(s.placeId || s.id, s.placeName);

      return {
        id: s.placeId || s.id,
        name: s.placeName,
        category: 'spot' as PlaceCategory,
        lat: s.lat,
        lng: s.lng,
        addr: curated?.addr1 ?? '',
        image: curated?.images?.[0] ?? null,
        tel: null,
        dist: Math.round(distanceInMeters({ lat, lng }, { lat: s.lat, lng: s.lng })),
        isTraditional: true,
      };
    })







    .sort((a, b) => a.dist - b.dist)
    .slice(0, 60);
}





export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const lat = Number(q.get('lat'));
  const lng = Number(q.get('lng'));
  const radius = Number(q.get('radius')) || 3000;
  const raw = q.get('category');
  const category = PLACE_CATEGORIES.includes(raw as PlaceCategory)
    ? (raw as PlaceCategory)
    : null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ items: [], error: 'lat/lng 좌표 필요' });
  }

  try {
    const items = await PlaceService.getNearbyPlaces({ lat, lng, radius, category });
    return NextResponse.json({ items });
  } catch (error) {

    const fallback = fallbackPlaces(lat, lng);

    return NextResponse.json({
      items: fallback,
      degraded: true,
      error: error instanceof Error ? error.message : '장소 목록을 불러오지 못했습니다',
    });
  }
}
