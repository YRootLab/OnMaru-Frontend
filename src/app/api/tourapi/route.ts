import { NextResponse } from 'next/server';
import { HanokArchiveService } from '@/hanok/services/hanokArchive.service';

/**
 * 한옥 아카이브 실시간 목록 조회 API (Thin Controller)
 */
export async function GET(request: Request) {
  try {
    const data = await HanokArchiveService.fetchRealtimeHanoks(request.signal);
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '한옥 아카이브 데이터를 불러오지 못했습니다' },
      { status: 500 },
    );
  }
}
