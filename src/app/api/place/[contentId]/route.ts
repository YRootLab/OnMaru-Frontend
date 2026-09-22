import { NextResponse } from 'next/server';
import { PlaceService } from '@/features/map/services/place.service';





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
