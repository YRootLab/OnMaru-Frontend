import { NextRequest, NextResponse } from 'next/server';

const ODII_BASE_URL = process.env.ODII_API_URL || process.env.NEXT_PUBLIC_ODII_API_URL || 'https://apis.data.go.kr/B551011/Odii';
const ODII_API_KEY = process.env.ODII_API_KEY || process.env.NEXT_PUBLIC_ODII_API_KEY || '';

const COMMON_PARAMS = {
  MobileOS: 'ETC',
  MobileApp: 'OnMaruFE',
  _type: 'json',
  langCode: 'ko',
};

function getUpstreamUrl(request: NextRequest): URL {
  const query = request.nextUrl.searchParams;
  const type = query.get('type') || 'stories';
  const upstream = new URL(`${ODII_BASE_URL}/${type === 'nearby' ? 'storyLocationBasedList' : query.get('keyword') ? 'storySearchList' : 'storyBasedList'}`);

  Object.entries(COMMON_PARAMS).forEach(([key, value]) => upstream.searchParams.set(key, value));
  upstream.searchParams.set('serviceKey', ODII_API_KEY);

  if (type === 'nearby') {
    upstream.searchParams.set('xCoord', query.get('xCoord') || '');
    upstream.searchParams.set('yCoord', query.get('yCoord') || '');
    upstream.searchParams.set('radius', query.get('radius') || '3000');
    return upstream;
  }

  upstream.searchParams.set('numOfRows', query.get('numOfRows') || '7');
  upstream.searchParams.set('pageNo', query.get('pageNo') || '1');
  const keyword = query.get('keyword')?.trim();
  if (keyword) upstream.searchParams.set('keyword', keyword);
  return upstream;
}

export async function GET(request: NextRequest) {
  if (!ODII_API_KEY) {
    return NextResponse.json({ error: 'ODII_API_KEY is not configured' }, { status: 503 });
  }

  try {
    const upstream = await fetch(getUpstreamUrl(request), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const body = await upstream.json();

    return NextResponse.json(body, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Odii API Proxy] upstream request failed', error);
    return NextResponse.json({ error: 'Failed to fetch Odii API' }, { status: 502 });
  }
}
