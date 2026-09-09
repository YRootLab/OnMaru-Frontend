// ============================================================
// 온마루 공용 API 클라이언트 (src/lib/api/client.ts)
// ============================================================

import { ApiError } from '@/admin/types';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
export const USE_MOCK = !BASE;

const TIMEOUT_MS = 10000;

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
    if (!refreshToken || USE_MOCK) {
      throw new Error('Refresh token not found');
    }
    // 실제 백엔드 연동 시 토큰 갱신 엔드포인트 호출
    const res = await fetch(`${BASE}/api/auth/refresh`, {
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
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  params?: Record<string, any>,
  body?: any
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Mock 모드 처리
  if (USE_MOCK) {
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

  let url = `${BASE}${normalizedPath}`;
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

  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  return request<T>('GET', path, params);
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  return request<T>('POST', path, undefined, body);
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
  return request<T>('PATCH', path, undefined, body);
}

export async function apiDelete(path: string): Promise<void> {
  return request<void>('DELETE', path);
}
