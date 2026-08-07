import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_TOUR_API_KEY || process.env.TOUR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const url = `${BASE_URL}/detailCommon2?serviceKey=${encodeURIComponent(apiKey)}&MobileOS=ETC&MobileApp=OnMaru&_type=json&contentId=${id}&defaultYN=Y&overviewYN=Y&addrinfoYN=Y&mapinfoYN=Y&firstImageYN=Y`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();

    const raw = json?.response?.body?.items?.item;
    const item = Array.isArray(raw) ? raw[0] : raw;

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const overview = String(item.overview ?? '').trim();
    const homepage = String(item.homepage ?? '').trim();

    return NextResponse.json({ overview: overview || null, homepage: homepage || null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'fetch failed' }, { status: 500 });
  }
}
