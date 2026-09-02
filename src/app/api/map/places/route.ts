import { NextResponse } from 'next/server';
import { PlaceService, PLACE_CATEGORIES } from '@/map/services/place.service';
import type { PlaceCategory } from '@/map/types';

/**
 * 지도 뷰포트 기준 장소 목록 API (Thin Controller)
 * 비즈니스 로직 및 캐싱은 PlaceService에 위임합니다.
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

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ items: [], error: 'lat/lng 좌표 필요' });
  }

  try {
    const items = await PlaceService.getNearbyPlaces({ lat, lng, radius, category });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({
      items: [],
      error: error instanceof Error ? error.message : '장소 목록을 불러오지 못했습니다',
    });
  }
}
