import { NextResponse } from 'next/server';
import { fetchBackendHanoksAsArchive } from '@/features/hanok-archive/infrastructure/backendHanokSource';

export async function GET() {
  try {
    const data = await fetchBackendHanoksAsArchive();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '한옥 아카이브 데이터를 불러오지 못했습니다' },
      { status: 500 },
    );
  }
}
