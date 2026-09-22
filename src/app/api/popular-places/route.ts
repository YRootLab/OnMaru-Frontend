import { NextResponse } from 'next/server';
import { PopularPlaceService } from '@/features/map/services/popular.service';





export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'all';

  const data = await PopularPlaceService.getPopularPlaces(region);
  return NextResponse.json(data);
}
