export type SorimaruNetworkRequestType = 'stories' | 'nearby' | 'themes';

export interface SorimaruNetworkRequest {
  type: SorimaruNetworkRequestType;
  params: Record<string, string>;
}

export interface SorimaruTransportResponse {
  items: Record<string, unknown>[];
  totalCount: number;
}

export type SorimaruEndpointResolver = (request: SorimaruNetworkRequest) => string;
export type SorimaruResponseDecoder = (
  payload: unknown,
  request: SorimaruNetworkRequest,
) => SorimaruTransportResponse;

export interface SorimaruNetworkClient {
  request(request: SorimaruNetworkRequest): Promise<SorimaruTransportResponse>;
}

export interface CreateSorimaruNetworkClientOptions {
  resolveEndpoint?: SorimaruEndpointResolver;
  decodeResponse?: SorimaruResponseDecoder;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

const CLIENT_API_ENDPOINT = process.env.NEXT_PUBLIC_SORIMARU_API_URL || process.env.NEXT_PUBLIC_ODII_API_URL || 'https://apis.data.go.kr/B551011/Odii';
const CLIENT_API_KEY = process.env.NEXT_PUBLIC_SORIMARU_API_KEY || process.env.NEXT_PUBLIC_ODII_API_KEY || '';
const REQUEST_TIMEOUT_MS = 45_000;

function getApiKey(): string {
  try {
    return decodeURIComponent(CLIENT_API_KEY);
  } catch {
    return CLIENT_API_KEY;
  }
}

export const defaultSorimaruEndpointResolver: SorimaruEndpointResolver = ({ type, params }) => {
  const operation =
    type === 'nearby'
      ? 'storyLocationBasedList'
      : type === 'themes'
        ? params.keyword
          ? 'themeSearchList'
          : 'themeBasedList'
        : params.keyword
          ? 'storySearchList'
          : 'storyBasedList';

  const upstream = new URL(`${CLIENT_API_ENDPOINT}/${operation}`);
  
  upstream.searchParams.set('MobileOS', 'ETC');
  upstream.searchParams.set('MobileApp', 'OnMaruFE');
  upstream.searchParams.set('_type', 'json');
  upstream.searchParams.set('langCode', 'ko');
  upstream.searchParams.set('serviceKey', getApiKey());

  if (type === 'nearby') {
    // 실제 Odii storyLocationBasedList는 xCoord/yCoord가 아니라 mapX/mapY를 필수로 요구한다
    // (xCoord로 보내면 NO_MANDATORY_REQUEST_PARAMETERS_ERROR1(mapX)로 늘 빈 결과였다).
    if (params.xCoord) upstream.searchParams.set('mapX', params.xCoord);
    if (params.yCoord) upstream.searchParams.set('mapY', params.yCoord);
    upstream.searchParams.set('radius', params.radius || '3000');
    upstream.searchParams.set('numOfRows', params.numOfRows || '10');
    upstream.searchParams.set('pageNo', params.pageNo || '1');
    return upstream.toString();
  }

  upstream.searchParams.set('numOfRows', params.numOfRows || '7');
  upstream.searchParams.set('pageNo', params.pageNo || '1');
  
  const keyword = params.keyword?.trim();
  if (keyword) upstream.searchParams.set('keyword', keyword);

  return upstream.toString();
};

export const defaultSorimaruResponseDecoder: SorimaruResponseDecoder = (payload) => {
  const body = (payload as {
    response?: {
      body?: {
        items?: { item?: Record<string, unknown> | Record<string, unknown>[] };
        totalCount?: number | string;
      };
    };
  })?.response?.body;
  const rawItems = body?.items?.item;
  const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];

  return {
    items,
    totalCount: Number(body?.totalCount) || items.length,
  };
};

function summarizeResponse(response: SorimaruTransportResponse): string {
  return `${response.items.length} item(s)`;
}

/** URL and raw payload details remain replaceable behind one normalized result. */
export function createSorimaruNetworkClient({
  resolveEndpoint = defaultSorimaruEndpointResolver,
  decodeResponse = defaultSorimaruResponseDecoder,
  fetcher = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
}: CreateSorimaruNetworkClientOptions = {}): SorimaruNetworkClient {
  return {
    async request(request): Promise<SorimaruTransportResponse> {
      const url = resolveEndpoint(request);
      const startedAt = performance.now();

      console.info('[Sorimaru Network] request', { type: request.type, params: request.params });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetcher(url, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const payload: unknown = await response.json();
        const decoded = decodeResponse(payload, request);
        console.info('[Sorimaru Network] response', {
          type: request.type,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          summary: summarizeResponse(decoded),
        });
        return decoded;
      } catch (error) {
        console.warn('[Sorimaru Network] error', {
          type: request.type,
          durationMs: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message : error,
        });
        throw error instanceof Error ? error : new Error('Sorimaru network request failed');
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}

export const sorimaruNetworkClient = createSorimaruNetworkClient();
