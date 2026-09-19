/**
 * 한국관광공사 TourAPI 공통 통신 클라이언트
 * - 환경 변수 키 자동 탐색 및 인코딩 폴백 시도
 * - 타임아웃(10초) 및 AbortSignal 지원
 * - JSON 파싱 방어 및 에러 캡슐화
 */
export class TourApiClient {
  private static readonly BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
  private static readonly DEFAULT_TIMEOUT_MS = 10000;

  private static getApiKey(): string | null {
    return (
      process.env.TOUR_API_KEY ||
      process.env.TOUR_API_CONGESTION_KEY ||
      process.env.NEXT_PUBLIC_TOUR_API_KEY ||
      null
    );
  }

  /**
   * TourAPI 엔드포인트에 GET 요청을 보내고 원시 JSON 응답을 안전하게 파싱합니다.
   */
  public static async get<T = any>(
    endpoint: string,
    params: Record<string, string | number>,
    externalSignal?: AbortSignal,
  ): Promise<T | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const query = new URLSearchParams({
      MobileOS: 'ETC',
      MobileApp: 'OnMaru',
      _type: 'json',
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    }).toString();

    const signal =
      externalSignal || AbortSignal.timeout(this.DEFAULT_TIMEOUT_MS);

    const urls = [
      `${this.BASE_URL}/${endpoint}?serviceKey=${encodeURIComponent(apiKey)}&${query}`,
      `${this.BASE_URL}/${endpoint}?serviceKey=${apiKey}&${query}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          signal,
          next: { revalidate: 3600 },
        });
        if (!res.ok) continue;

        const text = await res.text();
        if (!text.trim().startsWith('{')) continue;

        const json = JSON.parse(text);
        const body = json?.response?.body;
        if (!body) continue;

        return json as T;
      } catch {
        continue;
      }
    }

    return null;
  }
}
