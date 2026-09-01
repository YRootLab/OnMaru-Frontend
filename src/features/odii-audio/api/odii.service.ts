import { NextRequest, NextResponse } from 'next/server';

export class OdiiService {
  private static readonly BASE_URL =
    process.env.ODII_API_URL ||
    process.env.NEXT_PUBLIC_ODII_API_URL ||
    'https://apis.data.go.kr/B551011/Odii';

  private static getApiKey(): string {
    const key = process.env.ODII_API_KEY || process.env.NEXT_PUBLIC_ODII_API_KEY || '';
    try {
      return decodeURIComponent(key);
    } catch {
      return key;
    }
  }

  private static buildUpstreamUrl(request: NextRequest): URL {
    const query = request.nextUrl.searchParams;
    const type = query.get('type') || 'stories';
    const operation =
      type === 'nearby'
        ? 'storyLocationBasedList'
        : type === 'themes'
          ? query.get('keyword')
            ? 'themeSearchList'
            : 'themeBasedList'
          : query.get('keyword')
            ? 'storySearchList'
            : 'storyBasedList';

    const upstream = new URL(`${this.BASE_URL}/${operation}`);

    upstream.searchParams.set('MobileOS', 'ETC');
    upstream.searchParams.set('MobileApp', 'OnMaruFE');
    upstream.searchParams.set('_type', 'json');
    upstream.searchParams.set('langCode', 'ko');
    upstream.searchParams.set('serviceKey', this.getApiKey());

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

  /**
   * Odii 오디오 가이드 공공 API 프록시 요청을 수행합니다.
   */
  public static async proxyRequest(request: NextRequest): Promise<NextResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'ODII_API_KEY가 설정되지 않았습니다' }, { status: 503 });
    }

    try {
      const upstream = await fetch(this.buildUpstreamUrl(request), {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const body = await upstream.json();

      return NextResponse.json(body, {
        status: upstream.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Odii API 호출에 실패했습니다' }, { status: 502 });
    }
  }
}
