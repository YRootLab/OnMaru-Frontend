import { NextResponse } from 'next/server';
import { seedWarmth } from '@/features/map/warmth/seed';






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
