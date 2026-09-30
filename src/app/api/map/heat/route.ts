import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstream = `${BACKEND}/api/map/heat?${searchParams.toString()}`;

  try {
    const res = await fetch(upstream, { next: { revalidate: 0 } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('히트맵 백엔드 프록시 실패:', error);
    return NextResponse.json({ spots: [], error: 'upstream error' }, { status: 502 });
  }
}
