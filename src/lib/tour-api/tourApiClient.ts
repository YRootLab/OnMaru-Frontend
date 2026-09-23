





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
