import { NextResponse } from 'next/server';
import { PlaceService } from '@/map/services/place.service';

/**
 * 장소 상세 정보 조회 API (Thin Controller)
 * 비즈니스 로직은 PlaceService에 위임합니다.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> },
) {
  const { contentId } = await params;
  const { searchParams } = new URL(request.url);
  const contentTypeId = searchParams.get('contentTypeId') || '12';

  const data = await PlaceService.getPlaceDetail(contentId, contentTypeId);
  return NextResponse.json(data);
}
