export type OdiiNetworkRequestType = 'stories' | 'nearby';

export interface OdiiNetworkRequest {
  type: OdiiNetworkRequestType;
  params: Record<string, string>;
}

export interface OdiiNetworkClient {
  request<TResponse>(request: OdiiNetworkRequest): Promise<TResponse>;
}

const CLIENT_API_ENDPOINT = '/api/odii';
const REQUEST_TIMEOUT_MS = 45_000;

function summarizeResponse(payload: unknown): string {
  const body = (payload as { response?: { body?: { items?: { item?: unknown } } } })?.response?.body;
  const rawItems = body?.items?.item;
  const count = Array.isArray(rawItems) ? rawItems.length : rawItems ? 1 : 0;
  return `${count} item(s)`;
}

/**
 * Odii 전용 네트워크 경계.
 * 요청 URL/타임아웃/로그/HTTP 오류 처리를 UI나 데이터 매퍼에서 분리한다.
 */
export const odiiNetworkClient: OdiiNetworkClient = {
  async request<TResponse>({ type, params }: OdiiNetworkRequest): Promise<TResponse> {
    const query = new URLSearchParams({ type, ...params });
    const url = `${CLIENT_API_ENDPOINT}?${query.toString()}`;
    const startedAt = performance.now();

    console.info('[Odii Network] request', { type, params });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const payload = await response.json() as TResponse;
      console.info('[Odii Network] response', {
        type,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        summary: summarizeResponse(payload),
      });
      return payload;
    } catch (error) {
      console.warn('[Odii Network] request warning', {
        type,
        durationMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message : error,
      });
      throw error instanceof Error ? error : new Error('Odii network request failed');
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
