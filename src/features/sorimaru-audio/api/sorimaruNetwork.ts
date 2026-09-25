import { apiGet, USE_MOCK } from '@/lib/api/client';

export type SorimaruNetworkRequestType = 'stories' | 'nearby' | 'themes';

export interface SorimaruRegionGroup {
  label: string;
  regionCodes: string[];
  storyCount: number;
}

export interface SorimaruRegionGroupsResponse {
  schemaVersion?: string;
  language?: string;
  languageStatus?: 'EXACT' | 'FALLBACK' | string;
  groups: SorimaruRegionGroup[];
}

export interface SorimaruNetworkRequest {
  type: SorimaruNetworkRequestType;
  params: Record<string, string>;
  preferBackend?: boolean;
}

export interface SorimaruTransportResponse {
  items: Record<string, unknown>[];
  totalCount: number;
  hasMore?: boolean;
  source?: 'backend' | 'public';
}

export type SorimaruEndpointResolver = (request: SorimaruNetworkRequest) => string;
export type SorimaruResponseDecoder = (
  payload: unknown,
  request: SorimaruNetworkRequest,
) => SorimaruTransportResponse;
export type SorimaruBackendRequester = (
  path: string,
  params?: Record<string, string>,
) => Promise<unknown>;

export interface SorimaruNetworkClient {
  request(request: SorimaruNetworkRequest): Promise<SorimaruTransportResponse>;
}

export interface CreateSorimaruNetworkClientOptions {
  resolveEndpoint?: SorimaruEndpointResolver;
  decodeResponse?: SorimaruResponseDecoder;
  backendRequester?: SorimaruBackendRequester;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

const CLIENT_API_ENDPOINT = process.env.NEXT_PUBLIC_SORIMARU_API_URL || 'https://apis.data.go.kr/B551011/Odii';
const CLIENT_API_KEY = process.env.NEXT_PUBLIC_SORIMARU_API_KEY || '';
const REQUEST_TIMEOUT_MS = 45_000;

interface BackendStorySummary {
  storyId?: string;
  title?: string;
  audioTitle?: string;
  category?: string;
  region?: { name?: string };
  coordinates?: { lat?: number; lng?: number };
  durationSeconds?: number;
  imageUrl?: string;
  contentTags?: string[];
}

interface BackendStoryDetail {
  story?: BackendStorySummary;
  audioUrl?: string;
  transcript?: Array<{ text?: string }>;
}

interface BackendStoryPage {
  items?: BackendStorySummary[];
  hasMore?: boolean;
}

const defaultBackendRequester: SorimaruBackendRequester = (path, params) => apiGet<unknown>(path, params);

// 모든 Odii API 호출은 백엔드 경유
// 백엔드 엔드포인트: /api/stories, /api/stories/nearby, /api/stories/themes

export const defaultSorimaruEndpointResolver: SorimaruEndpointResolver = ({ type }) => {
  // 백엔드 API 경로만 반환
  return type === 'nearby' ? '/api/stories/nearby'
    : type === 'themes' ? '/api/stories/themes'
    : '/api/stories';
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
    source: 'public',
  };
};

function summarizeResponse(response: SorimaruTransportResponse): string {
  return `${response.items.length} item(s)`;
}

function isBackendStoryPage(payload: unknown): payload is BackendStoryPage {
  return typeof payload === 'object' && payload !== null && Array.isArray((payload as BackendStoryPage).items);
}

function toBackendTransportItem(summary: BackendStorySummary, detail: BackendStoryDetail): Record<string, unknown> {
  const story = detail.story ?? summary;

  return {
    tid: story.storyId ?? '',
    stid: story.storyId ?? '',
    title: story.title ?? '',
    audioTitle: story.audioTitle ?? story.title ?? '',
    audioUrl: detail.audioUrl ?? '',
    playTime: String(story.durationSeconds ?? 0),
    imageUrl: story.imageUrl ?? '',
    mapX: String(story.coordinates?.lng ?? ''),
    mapY: String(story.coordinates?.lat ?? ''),
    script: detail.transcript
      ?.map((line) => line.text?.trim())
      .filter((line): line is string => Boolean(line))
      .join('\n') ?? '',
    themaCategory: story.category ?? '',
    contentTags: story.contentTags ?? [],
    tags: story.contentTags ?? [],
    addr1: story.region?.name ?? '',
  };
}

async function requestBackendStories(
  request: SorimaruNetworkRequest,
  backendRequester: SorimaruBackendRequester,
): Promise<SorimaruTransportResponse> {
  const page = await backendRequester('odii/stories', {
    language: 'ko-KR',
    limit: request.params.numOfRows ?? '7',
  });

  if (!isBackendStoryPage(page)) {
    throw new Error('Invalid OnMaru Sorimaru story page');
  }

  const summaries = page.items ?? [];
  const items = await Promise.all(
    summaries.map(async (summary) => {
      const storyId = summary.storyId;
      if (!storyId) throw new Error('OnMaru Sorimaru story is missing storyId');

      const detail = await backendRequester(`odii/stories/${encodeURIComponent(storyId)}`, {
        language: 'ko-KR',
      }) as BackendStoryDetail;

      return toBackendTransportItem(summary, detail);
    }),
  );

  return {
    items,
    totalCount: items.length,
    hasMore: page.hasMore === true,
    source: 'backend',
  };
}


export function createSorimaruNetworkClient({
  resolveEndpoint = defaultSorimaruEndpointResolver,
  decodeResponse = defaultSorimaruResponseDecoder,
  backendRequester = USE_MOCK ? undefined : defaultBackendRequester,
  fetcher = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
}: CreateSorimaruNetworkClientOptions = {}): SorimaruNetworkClient {
  return {
    async request(request): Promise<SorimaruTransportResponse> {
      const startedAt = performance.now();

      console.info('[Sorimaru Network] request', { type: request.type, params: request.params });

      const isFirstPage = !request.params.pageNo || request.params.pageNo === '1';
      if (request.type === 'stories' && isFirstPage && request.preferBackend !== false) {
        if (!backendRequester) {
          return { items: [], totalCount: 0, source: 'public' };
        }
        try {
          const decoded = await requestBackendStories(request, backendRequester);
          console.info('[Sorimaru Network] backend response', {
            type: request.type,
            durationMs: Math.round(performance.now() - startedAt),
            summary: summarizeResponse(decoded),
          });
          return decoded;
        } catch (error) {
          console.warn('[Sorimaru Network] backend error', {
            type: request.type,
            error: error instanceof Error ? error.message : error,
          });
          return { items: [], totalCount: 0, source: 'public' };
        }
      }

      // nearby / themes: 백엔드 경유
      if (backendRequester) {
        const backendPath = request.type === 'nearby' ? 'odii/stories/nearby' : 'odii/stories/themes';
        try {
          const page = await backendRequester(backendPath, request.params);
          if (!isBackendStoryPage(page)) return { items: [], totalCount: 0, source: 'public' };
          const items = (page.items ?? []).map((summary) =>
            toBackendTransportItem(summary, { story: summary }),
          );
          console.info('[Sorimaru Network] backend response', {
            type: request.type,
            durationMs: Math.round(performance.now() - startedAt),
            summary: summarizeResponse({ items, totalCount: items.length }),
          });
          return { items, totalCount: items.length, hasMore: page.hasMore, source: 'backend' };
        } catch (error) {
          console.warn('[Sorimaru Network] backend error', {
            type: request.type,
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      return { items: [], totalCount: 0, source: 'public' };
    },
  };
}

export const sorimaruNetworkClient = createSorimaruNetworkClient();

export async function fetchSorimaruRegionGroups(
  language = 'ko-KR',
  requester: SorimaruBackendRequester = defaultBackendRequester,
): Promise<SorimaruRegionGroupsResponse> {
  const payload = await requester('odii/regions', { language });
  if (typeof payload !== 'object' || payload === null || !Array.isArray((payload as SorimaruRegionGroupsResponse).groups)) {
    throw new Error('Invalid OnMaru Sorimaru region groups response');
  }
  return payload as SorimaruRegionGroupsResponse;
}
