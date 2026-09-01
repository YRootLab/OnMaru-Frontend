import { NextResponse } from 'next/server';
import { PopularPlaceService } from '@/map/services/popular.service';

/**
 * 실시간 인기 장소 랭킹 목록 조회 API (Thin Controller)
 * 비즈니스 로직은 PopularPlaceService에 위임합니다.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'all';

  const data = await PopularPlaceService.getPopularPlaces(region);
  return NextResponse.json(data);
}
