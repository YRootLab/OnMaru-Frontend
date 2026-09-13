import { NextRequest, NextResponse } from 'next/server';

export class SorimaruService {
  // 실제 한국관광공사 공공데이터 상품명은 'Odii'다 — '소리마루'는 온마루 자체 브랜드명일 뿐,
  // data.go.kr에 등록된 엔드포인트 경로는 이름을 바꿔도 그대로다.
  private static readonly BASE_URL =
    process.env.SORIMARU_API_URL ||
    process.env.NEXT_PUBLIC_SORIMARU_API_URL ||
    'https://apis.data.go.kr/B551011/Odii';

  private static getApiKey(): string {
    const key = process.env.SORIMARU_API_KEY || process.env.NEXT_PUBLIC_SORIMARU_API_KEY || '';
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
   * Sorimaru 오디오 가이드 공공 API 프록시 요청을 수행합니다.
   * 공공포털 장애/타임아웃 시 502로 크래시되는 대신 빈 목록과 degraded 플래그를 반환하여
   * 클라이언트가 안전하게 동작하도록 합니다.
   */
  public static async proxyRequest(request: NextRequest): Promise<NextResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return NextResponse.json({
        response: {
          header: { resultCode: '9000', resultMsg: 'SORIMARU_API_KEY_MISSING' },
          body: { items: { item: [] }, numOfRows: 0, pageNo: 1, totalCount: 0 },
        },
        degraded: true,
        error: 'SORIMARU_API_KEY가 설정되지 않았습니다',
      }, { status: 200 });
    }

    try {
      const upstream = await fetch(this.buildUpstreamUrl(request), {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000), // 공공 API 6초 타임아웃
      });

      const text = await upstream.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        // XML 에러 또는 비정상 텍스트 응답 시
        return NextResponse.json({
          response: {
            header: { resultCode: '9001', resultMsg: 'INVALID_JSON_RESPONSE' },
            body: { items: { item: [] }, numOfRows: 0, pageNo: 1, totalCount: 0 },
          },
          degraded: true,
          error: '공공데이터포털에서 유효하지 않은 응답을 수신했습니다',
        }, { status: 200 });
      }

      return NextResponse.json(body, {
        status: upstream.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      // ConnectTimeout, AbortError 등 공공포털 서버 다운/지연 시 안전한 폴백 제공
      return NextResponse.json({
        response: {
          header: { resultCode: '9999', resultMsg: 'SORIMARU_SERVICE_TIMEOUT_OR_UNAVAILABLE' },
          body: { items: { item: [] }, numOfRows: 0, pageNo: 1, totalCount: 0 },
        },
        degraded: true,
        error: error instanceof Error ? error.message : 'Sorimaru API 호출에 실패했습니다',
      }, { status: 200 });
    }
  }
}
