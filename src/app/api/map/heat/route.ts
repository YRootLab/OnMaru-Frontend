import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function GET(request: Request) {
  if (!BACKEND) {
    console.error('[heat] NEXT_PUBLIC_API_URL not configured — heatmap upstream unavailable');
    return NextResponse.json({ spots: [], error: 'upstream not configured' }, { status: 502 });
  }

  const { searchParams } = new URL(request.url);
  const upstream = `${BACKEND}/api/map/heat?${searchParams.toString()}`;

  const signal = AbortSignal.any
    ? AbortSignal.any([request.signal, AbortSignal.timeout(10_000)])
    : AbortSignal.timeout(10_000);

  try {
    const res = await fetch(upstream, {
      next: { revalidate: 0 },
      signal,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('히트맵 백엔드 프록시 실패:', error);
    return NextResponse.json({ spots: [], error: 'upstream error' }, { status: 502 });
  }
}
