import { NextResponse } from 'next/server';
import { seedWarmth } from '@/map/warmth/seed';

/**
 * 여행자 온기 이야기(리뷰 및 한줄평) API
 * 
 * 실시간 혼잡도 히트맵과 분리되어, 여행자들이 남긴 순수 한옥 여행 소감 및 온기 이야기 제공.
 */
export async function GET() {
  const now = Date.now();

  try {
    const warmths = seedWarmth(now).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    return NextResponse.json({
      warmths,
      totalCount: warmths.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('온기 이야기 API 조회 실패:', error);
    return NextResponse.json({
      warmths: seedWarmth(now),
      totalCount: seedWarmth(now).length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
