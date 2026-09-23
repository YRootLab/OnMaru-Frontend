





import { apiGet } from '@/lib/api/client';

// Single Source of Truth: 백엔드 API만 호출
// TourAPI는 백엔드에서만 처리

export class TourApiClient {
  private static readonly DEFAULT_TIMEOUT_MS = 10000;

  public static async get<T = any>(
    endpoint: string,
    params: Record<string, string | number>,
    externalSignal?: AbortSignal,
  ): Promise<T | null> {
    // 모든 TourAPI 호출을 백엔드로 위임
    // 백엔드 경로: /api/tour/{endpoint}
    try {
      const result = await apiGet<T>(`/api/tour/${endpoint}`, params as Record<string, any>);
      return result ?? null;
    } catch {
      return null;
    }
  }
}
