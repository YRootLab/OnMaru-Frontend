import { apiRequest, getApiRootBaseUrl, setAccessToken, removeAccessToken, USE_MOCK } from '@/lib/api/client';
import type { AdminUser } from '@/features/admin/types';

export interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export interface CsrfResponse {
  token: string;
  headerName: string;
}

async function fetchCsrf(): Promise<CsrfResponse> {
  const base = getApiRootBaseUrl();
  const res = await fetch(`${base}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CSRF fetch failed: ${res.status}`);
  return res.json() as Promise<CsrfResponse>;
}

export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const role = email.includes('editor') ? 'EDITOR' : 'ADMIN';
    const mockUser: AdminUser = {
      id: role === 'ADMIN' ? 'usr-admin-01' : 'usr-editor-01',
      email,
      nickname: role === 'ADMIN' ? '김온마루' : '이마루',
      role,
      status: 'ACTIVE',
      reviewCount: 42,
      reportCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    };
    return { accessToken: `mock_admin_jwt_${Date.now()}`, user: mockUser };
  }

  const csrf = await fetchCsrf();
  return apiRequest<LoginResponse>('/auth/admin/login', {
    method: 'POST',
    body: { email, password },
    csrf: false,
    headers: { [csrf.headerName]: csrf.token },
  });
}

export async function adminLogout(): Promise<void> {
  if (USE_MOCK) {
    removeAccessToken();
    return;
  }
  try {
    await apiRequest<void>('/auth/admin/logout', { method: 'POST', csrf: true });
  } finally {
    removeAccessToken();
  }
}

export async function adminRefresh(): Promise<string | null> {
  if (USE_MOCK) return null;
  const res = await apiRequest<{ accessToken: string }>('/auth/admin/refresh', {
    method: 'POST',
    retry: false,
  });
  if (res?.accessToken) {
    setAccessToken(res.accessToken);
    return res.accessToken;
  }
  return null;
}
