import { apiRequest, getApiRootBaseUrl, setAccessToken, removeAccessToken, USE_MOCK } from '@/lib/api/client';
import type { AdminRole, AdminUser } from '@/features/admin/types';

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

export interface BackendLoginResponse {
  schemaVersion?: string;
  accessToken: string;
  expiresIn?: number;
  admin?: {
    id: string;
    email: string;
    role: AdminRole;
    nickname?: string;
  };
  user?: AdminUser;
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
  const res = await apiRequest<BackendLoginResponse>('/auth/admin/login', {
    method: 'POST',
    body: { email, password },
    csrf: false,
    headers: { [csrf.headerName]: csrf.token },
  });

  const rawUser = res.admin || res.user;
  const now = new Date().toISOString();
  const user: AdminUser = rawUser
    ? {
        id: rawUser.id,
        email: rawUser.email,
        nickname: rawUser.nickname || rawUser.email.split('@')[0] || '온마루지기',
        role: rawUser.role,
        status: 'ACTIVE',
        reviewCount: 0,
        reportCount: 0,
        createdAt: now,
        lastLoginAt: now,
      }
    : {
        id: 'admin_usr',
        email,
        nickname: '온마루지기',
        role: 'ADMIN',
        status: 'ACTIVE',
        reviewCount: 0,
        reportCount: 0,
        createdAt: now,
        lastLoginAt: now,
      };

  return { accessToken: res.accessToken, user };
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

let adminRefreshPromise: Promise<string | null> | null = null;

async function requestAdminRefresh(): Promise<string | null> {
  if (USE_MOCK) return null;
  const res = await apiRequest<{ accessToken: string }>('/auth/admin/refresh', {
    method: 'POST',
    csrf: true,
    auth: false,
    retry: false,
  });
  if (res?.accessToken) {
    setAccessToken(res.accessToken);
    return res.accessToken;
  }
  return null;
}

export function adminRefresh(): Promise<string | null> {
  if (adminRefreshPromise) return adminRefreshPromise;

  adminRefreshPromise = requestAdminRefresh().finally(() => {
    adminRefreshPromise = null;
  });
  return adminRefreshPromise;
}

export async function waitForAdminRefresh(): Promise<void> {
  if (!adminRefreshPromise) return;
  try {
    await adminRefreshPromise;
  } catch {
    // A pre-login refresh failure must settle before a new session is created.
  }
}

export async function adminGetMe(): Promise<AdminUser> {
  const principal = await apiRequest<{ id: string; email: string; role: AdminRole; nickname?: string }>(
    '/auth/admin/me',
    { method: 'GET' }
  );
  const now = new Date().toISOString();
  return {
    id: principal.id,
    email: principal.email,
    nickname: principal.nickname || principal.email.split('@')[0] || '온마루지기',
    role: principal.role,
    status: 'ACTIVE',
    reviewCount: 0,
    reportCount: 0,
    createdAt: now,
    lastLoginAt: now,
  };
}
