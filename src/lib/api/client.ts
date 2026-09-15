// ============================================================
// 온마루 공용 API 클라이언트 (src/lib/api/client.ts)
// ============================================================

import { ApiError } from '@/features/admin/types';
import { createCsrfTokenProvider } from './csrf';
import { isOnmaruApiError, normalizeApiError } from './errors';

const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
export const USE_MOCK = !DEFAULT_BASE;

const TIMEOUT_MS = 10000;

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
};

type ApiClientConfig = {
  baseUrl: string;
  fetcher: typeof fetch;
};

let apiClientConfig: ApiClientConfig = {
  baseUrl: DEFAULT_BASE,
  fetcher: (...args) => fetch(...args),
};

let csrfProvider = createCsrfTokenProvider(apiClientConfig.fetcher, resolveApiBase(apiClientConfig.baseUrl));

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function resolveApiBase(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/api/v1`;
}

function isInternalNextApiPath(path: string): boolean {
  return path.startsWith('/api/');
}

function buildUrl(path: string, params?: Record<string, any>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = apiClientConfig.baseUrl.replace(/\/+$/, '');
  const urlPath = isInternalNextApiPath(normalizedPath)
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
  csrfProvider = createCsrfTokenProvider(apiClientConfig.fetcher, resolveApiBase(apiClientConfig.baseUrl));
}

// 모의 응답 딜레이 (200ms ~ 500ms 지연 시뮬레이션)
export const mockDelay = (min = 200, max = 500): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// 토큰 가져오기 (클라이언트 환경)
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('onmaru_access_token');
};

export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('onmaru_access_token', token);
  }
};

export const removeAccessToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onmaru_access_token');
    localStorage.removeItem('onmaru_admin_user');
  }
};

// 401 Unauthorized 시 Refresh 시도 및 로그인 화면 리다이렉트
let isRefreshing = false;
async function handleUnauthorized(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem('onmaru_refresh_token');
    if (!refreshToken || !apiClientConfig.baseUrl) {
      throw new Error('Refresh token not found');
    }
    // 실제 백엔드 연동 시 토큰 갱신 엔드포인트 호출
    const res = await apiClientConfig.fetcher(`${apiClientConfig.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      throw new Error('Failed to refresh token');
    }
    const data = await res.json();
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      isRefreshing = false;
      return;
    }
  } catch {
    removeAccessToken();
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
  } finally {
    isRefreshing = false;
  }
}

// Mock 핸들러 레지스트리 (URL 패턴별 핸들러 등록)
type MockHandler = (params?: any, body?: any) => Promise<any> | any;
const mockHandlers: Map<string, MockHandler> = new Map();

export function registerMockHandler(key: string, handler: MockHandler): void {
  mockHandlers.set(key, handler);
}

// 공통 요청 빌더
async function request<T>(
  method: HttpMethod,
  path: string,
  params?: Record<string, any>,
  body?: any
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Mock 모드 처리
  if (!apiClientConfig.baseUrl) {
    await mockDelay();

    // 등록된 모의 핸들러 검사
    const handlerKey = `${method} ${normalizedPath.split('?')[0]}`;
    const handler = mockHandlers.get(handlerKey) || mockHandlers.get(normalizedPath.split('?')[0]);
    if (handler) {
      return handler(params, body);
    }

    // 기본 모의 성공 응답 (구체적 mock 데이터는 각 도메인 mock 파일에서 핸들러 등록)
    return { success: true, message: 'Mock response', path: normalizedPath } as unknown as T;
  }

  // 실제 HTTP 요청 처리
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = buildUrl(normalizedPath, params);

  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await apiClientConfig.fetcher(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      await handleUnauthorized();
      throw {
        message: '인증이 만료되었습니다. 다시 로그인해 주세요.',
        status: 401,
      } as ApiError;
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // ignore json parse error
      }
      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw {
        message: '요청 시간이 초과되었습니다 (10초). 잠시 후 다시 시도해 주세요.',
        status: 408,
      } as ApiError;
    }

    if (error.status && error.message) {
      throw error;
    }

    throw {
      message: error.message || '네트워크 오류가 발생했습니다.',
      status: 500,
    } as ApiError;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';

  if (!apiClientConfig.baseUrl) {
    return request<T>(method, path, options.params, options.body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
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

  try {
    const response = await apiClientConfig.fetcher(buildUrl(path, options.params), {
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
    const payload = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      const error = normalizeApiError(response.status, payload);
      if (error.code === 'CSRF_INVALID' && options.csrf) {
        csrfProvider.reset();
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
    throw normalizeApiError(500, { code: 'NETWORK_ERROR', message: error.message || '네트워크 오류가 발생했습니다.' });
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
