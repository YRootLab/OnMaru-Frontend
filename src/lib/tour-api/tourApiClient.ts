





import { apiRequest } from '@/lib/api/client';

export class TourApiClient {
  private static readonly DEFAULT_TIMEOUT_MS = 10000;

  public static async get<T = any>(
    endpoint: string,
    params: Record<string, string | number>,
    externalSignal?: AbortSignal,
  ): Promise<T | null> {
    // 1. First attempt to call backend proxy if NEXT_PUBLIC_API_URL is configured
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        const result = await apiRequest<T>(`/api/tour/${endpoint}`, {
          method: 'GET',
          params: params as Record<string, any>,
          signal: externalSignal,
          timeoutMs: TourApiClient.DEFAULT_TIMEOUT_MS,
          retry: false,
        });
        if (result) return result;
      } catch {
        // Fall through to direct TourAPI request
      }
    }

    // 2. Direct TourAPI fallback — server-side only so the key is never shipped to the browser
    const apiKey = typeof window === 'undefined' ? process.env.TOUR_API_KEY : undefined;
    if (apiKey) {
      try {
        const cleanParams: Record<string, string> = {
          serviceKey: apiKey,
          MobileOS: 'ETC',
          MobileApp: 'OnMaru',
          _type: 'json',
        };
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && !k.endsWith('YN')) {
            cleanParams[k] = String(v);
          }
        }
        const qs = new URLSearchParams(cleanParams).toString();
        const url = `https://apis.data.go.kr/B551011/KorService2/${endpoint}?${qs}`;
        const res = await fetch(url, {
          signal: externalSignal || AbortSignal.timeout(TourApiClient.DEFAULT_TIMEOUT_MS),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data as T;
      } catch {
        return null;
      }
    }

    return null;
  }
}

