export type OdiiNetworkRequestType = 'stories' | 'nearby';

export interface OdiiNetworkRequest {
  type: OdiiNetworkRequestType;
  params: Record<string, string>;
}

export interface OdiiTransportResponse {
  items: Record<string, unknown>[];
  totalCount: number;
}

export type OdiiEndpointResolver = (request: OdiiNetworkRequest) => string;
export type OdiiResponseDecoder = (
  payload: unknown,
  request: OdiiNetworkRequest,
) => OdiiTransportResponse;

export interface OdiiNetworkClient {
  request(request: OdiiNetworkRequest): Promise<OdiiTransportResponse>;
}

export interface CreateOdiiNetworkClientOptions {
  resolveEndpoint?: OdiiEndpointResolver;
  decodeResponse?: OdiiResponseDecoder;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

const CLIENT_API_ENDPOINT = process.env.NEXT_PUBLIC_ODII_API_ENDPOINT || '/api/odii';
const REQUEST_TIMEOUT_MS = 45_000;

export const defaultOdiiEndpointResolver: OdiiEndpointResolver = ({ type, params }) => {
  const query = new URLSearchParams({ type, ...params });
  return `${CLIENT_API_ENDPOINT}?${query.toString()}`;
};

export const defaultOdiiResponseDecoder: OdiiResponseDecoder = (payload) => {
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

function summarizeResponse(response: OdiiTransportResponse): string {
  return `${response.items.length} item(s)`;
}

/** URL and raw payload details remain replaceable behind one normalized result. */
export function createOdiiNetworkClient({
  resolveEndpoint = defaultOdiiEndpointResolver,
  decodeResponse = defaultOdiiResponseDecoder,
  fetcher = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
}: CreateOdiiNetworkClientOptions = {}): OdiiNetworkClient {
  return {
    async request(request): Promise<OdiiTransportResponse> {
      const url = resolveEndpoint(request);
      const startedAt = performance.now();

      console.info('[Odii Network] request', { type: request.type, params: request.params });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetcher(url, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const payload: unknown = await response.json();
        const decoded = decodeResponse(payload, request);
        console.info('[Odii Network] response', {
          type: request.type,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          summary: summarizeResponse(decoded),
        });
        return decoded;
      } catch (error) {
        console.warn('[Odii Network] error', {
          type: request.type,
          durationMs: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message : error,
        });
        throw error instanceof Error ? error : new Error('Odii network request failed');
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}

export const odiiNetworkClient = createOdiiNetworkClient();
