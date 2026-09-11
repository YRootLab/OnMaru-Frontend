import { NextResponse } from 'next/server';
import { HanokDetailService } from '@/features/hanok-archive/services/hanokDetail.service';

/**
 * 한옥 아카이브 항목 상세 조회 API (Thin Controller)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('id');
  const contentTypeId = searchParams.get('contentTypeId');

  if (!contentId) {
    return NextResponse.json({ error: 'contentId 파라미터 필요' }, { status: 400 });
  }

  const data = await HanokDetailService.getHanokDetail(contentId, contentTypeId);
  return NextResponse.json(data);
}
