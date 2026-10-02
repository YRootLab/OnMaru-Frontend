



import { ApiError } from '@/features/admin/types';
import { createCsrfTokenProvider } from './csrf';
import { isOnmaruApiError, normalizeApiError } from './errors';
import { API_RETRY_POLICIES, delay } from './retryPolicy';

const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_URL || '';
export const USE_MOCK = !DEFAULT_BASE;

function sanitizeForLog(value: unknown): string {
  return String(value).replace(/[\r\n]/g, '');
}

const DEFAULT_TIMEOUT_MS = 45000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = {
  method?: HttpMethod;
  params?: Record<string, any>;
  body?: any;
  csrf?: boolean;
  idempotencyKey?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
  headers?: Record<string, string>;
  rootPath?: boolean;
  retry?: boolean | { maxRetries?: number };
  onWaking?: (attempt: number, delayMs: number) => void;
  timeoutMs?: number;
};

type ApiClientConfig = {
  baseUrl: string;
  fetcher: typeof fetch;
};

let apiClientConfig: ApiClientConfig = {
  baseUrl: DEFAULT_BASE,
  fetcher: (...args) => fetch(...args),
};




let csrfProvider = createCsrfTokenProvider(apiClientConfig.fetcher, apiClientConfig.baseUrl.replace(/\/+$/, ''));

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function resolveApiBase(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/api/v1`;
}


export function getApiV1BaseUrl(): string {
  return resolveApiBase(apiClientConfig.baseUrl);
}





export function getApiRootBaseUrl(): string {
  return apiClientConfig.baseUrl.replace(/\/+$/, '');
}

function isInternalNextApiPath(path: string): boolean {
  return path.startsWith('/api/');
}

function buildUrl(path: string, params?: Record<string, any>, rootPath = false): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = apiClientConfig.baseUrl.replace(/\/+$/, '');
  const urlPath = rootPath
    ? normalizedPath
    : isInternalNextApiPath(normalizedPath)
    ? normalizedPath
    : `/api/v1/${trimSlashes(normalizedPath)}`;
  let url = base ? `${base}${urlPath}` : normalizedPath;

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

export function resetApiClientForTests(config?: Partial<ApiClientConfig>): void {
  apiClientConfig = {
    baseUrl: config?.baseUrl ?? DEFAULT_BASE,
    fetcher: config?.fetcher ?? ((...args) => fetch(...args)),
  };
  csrfProvider = createCsrfTokenProvider(apiClientConfig.fetcher, apiClientConfig.baseUrl.replace(/\/+$/, ''));
}


export const mockDelay = (min = 200, max = 500): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};


// access token은 메모리에만 보관 — localStorage/sessionStorage/cookie에 저장하지 않음
let _accessToken: string | null = null;

export const getAccessToken = (): string | null => _accessToken;

export const setAccessToken = (token: string): void => {
  _accessToken = token;
};

export const removeAccessToken = (): void => {
  _accessToken = null;
  // 이전 버전 localStorage 잔재 정리
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onmaru_access_token');
    localStorage.removeItem('onmaru_admin_user');
    localStorage.removeItem('onmaru_refresh_token');
  }
};


let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function handleUnauthorized(): Promise<void> {
  if (typeof window === 'undefined') return;
  // Single-flight: 동시에 refresh 요청 하나만
  if (refreshPromise) return refreshPromise;
  if (isRefreshing) return;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      if (!apiClientConfig.baseUrl) throw new Error('No base URL');

      // refresh token은 HttpOnly cookie로 자동 전송됨
      const res = await apiClientConfig.fetcher(
        `${apiClientConfig.baseUrl}/api/v1/auth/admin/refresh`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        },
      );

      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      if (data.accessToken) setAccessToken(data.accessToken);
    } catch {
      removeAccessToken();
      if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin') &&
        window.location.pathname !== '/admin/login'
      ) {
        window.location.href = '/admin/login';
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}


type MockHandler = (params?: any, body?: any) => Promise<any> | any;
const mockHandlers: Map<string, MockHandler> = new Map();

export function registerMockHandler(key: string, handler: MockHandler): void {
  mockHandlers.set(key, handler);
}


async function request<T>(
  method: HttpMethod,
  path: string,
  params?: Record<string, any>,
  body?: any
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!apiClientConfig.baseUrl) {
    await mockDelay();

    const handlerKey = `${method} ${normalizedPath.split('?')[0]}`;
    const handler = mockHandlers.get(handlerKey) || mockHandlers.get(normalizedPath.split('?')[0]);
    if (handler) {
      return handler(params, body);
    }

    return { success: true, message: 'Mock response', path: normalizedPath } as unknown as T;
  }

  return apiRequest<T>(normalizedPath, { method, params, body });
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';

  if (!apiClientConfig.baseUrl) {
    return request<T>(method, path, options.params, options.body);
  }

  const allowRetry = options.retry !== false;
  let attempt = 0;
  const startedAt = Date.now();

  while (true) {
    attempt++;
    const controller = new AbortController();
    const requestTimeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
    const signal = options.signal ?? controller.signal;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }
    if (options.csrf) {
      const csrf = await csrfProvider.getToken();
      headers[csrf.headerName] = csrf.token;
    }
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await apiClientConfig.fetcher(buildUrl(path, options.params, options.rootPath), {
        method,
        credentials: 'include',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal,
        cache: options.cache,
      });

      clearTimeout(timeoutId);

      if (response.status === 204) {
        return undefined as T;
      }

      const text = await response.text();
      let payload: unknown;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      if (!response.ok) {
        const error = normalizeApiError(response.status, payload, response.headers, text);
        if (error.code === 'CSRF_INVALID' && options.csrf) {
          csrfProvider.reset();
        }

        // 401: refresh 후 1회 재시도 (admin 경로)
        if (response.status === 401 && attempt === 1 && _accessToken) {
          clearTimeout(timeoutId);
          await handleUnauthorized();
          continue;
        }

        const policy = API_RETRY_POLICIES[error.classification];
        const maxRetries =
          typeof options.retry === 'object' && typeof options.retry.maxRetries === 'number'
            ? options.retry.maxRetries
            : policy.maxRetries;

        const totalElapsed = Date.now() - startedAt;
        const canRetry = allowRetry && attempt <= maxRetries && totalElapsed < policy.maxTotalDurationMs;

        if (canRetry) {
          const delayMs = policy.getDelayMs(attempt, error);
          if (error.classification === 'SERVER_WAKING' && options.onWaking) {
            options.onWaking(attempt, delayMs);
          }
          await delay(delayMs, options.signal);
          continue;
        }

        if (error.requestId) {
          console.error('[api] requestId:', error.requestId, sanitizeForLog(path), response.status);
        }
        throw error;
      }

      return payload as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (isOnmaruApiError(error)) throw error;

      if (error.name === 'AbortError') {
        throw normalizeApiError(408, { code: 'REQUEST_TIMEOUT', message: '요청 시간이 초과되었습니다.', details: {} });
      }

      const netError = normalizeApiError(500, { code: 'NETWORK_ERROR', message: error.message || '네트워크 오류가 발생했습니다.' });
      const policy = API_RETRY_POLICIES.SERVER_ERROR;
      const canRetry = allowRetry && attempt <= policy.maxRetries;

      if (canRetry) {
        await delay(policy.getDelayMs(attempt, netError), options.signal);
        continue;
      }

      throw netError;
    }
  }
}

export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  return request<T>('GET', path, params);
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  return request<T>('POST', path, undefined, body);
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
  return request<T>('PUT', path, undefined, body);
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
  return request<T>('PATCH', path, undefined, body);
}

export async function apiDelete(path: string): Promise<void> {
  return request<void>('DELETE', path);
}
