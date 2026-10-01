/**
 * Admin API 클라이언트
 * BE 미준비 시 USE_MOCK=true 환경에서 mock 데이터 fallback
 */

import { apiRequest, USE_MOCK } from '@/lib/api/client';

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
import {
  mockDashboardStats,
  mockRecentReviews,
  mockPendingReports,
  mockPipelineSummary,
} from '@/features/admin/mock/dashboard.mock';
import { mockReviews } from '@/features/admin/mock/reviews.mock';
import { mockReports } from '@/features/admin/mock/reports.mock';
import { mockUsers } from '@/features/admin/mock/users.mock';
import { mockVillages, mockStays, mockRoutes } from '@/features/admin/mock/curation.mock';
import { mockPipelineStatus } from '@/features/admin/mock/pipeline.mock';
import type {
  AdminUser,
  WarmthReview,
  ReportItem,
  CurationItem,
  CursorPageResponse,
  PaginatedResponse,
  ModerationQueueItem,
  ModerationQueuePageResponse,
  DashboardStatCard,
} from '@/features/admin/types';
import type { RecentReviewSummary, PendingReportSummary } from '@/features/admin/mock/dashboard.mock';

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  stats: DashboardStatCard[];
  recentReviews: RecentReviewSummary[];
  pendingReports: PendingReportSummary[];
  pipeline: typeof mockPipelineSummary;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (USE_MOCK) {
    await delay(200);
    return {
      stats: mockDashboardStats,
      recentReviews: mockRecentReviews,
      pendingReports: mockPendingReports,
      pipeline: mockPipelineSummary,
    };
  }
  return apiRequest<DashboardSummary>('/admin/dashboard/summary');
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface ReviewsQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  status?: string;
  query?: string;
  search?: string;
  sort?: string;
}

export async function getReviews(query: ReviewsQuery = {}): Promise<CursorPageResponse<WarmthReview>> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const rawStatus = query.status === 'ALL' ? undefined : query.status;
  const status = rawStatus === 'DELETED' ? 'REMOVED' : rawStatus;
  const q = (query.query ?? query.search)?.trim();
  const searchParam = q && q.length > 0 ? q.slice(0, 120) : undefined;

  if (USE_MOCK) {
    await delay(150);
    const filtered = mockReviews.filter((r) => {
      if (status && r.status !== status && !(status === 'REMOVED' && r.status === 'DELETED')) return false;
      if (searchParam) {
        const lower = searchParam.toLowerCase();
        return (
          r.author.nickname.toLowerCase().includes(lower) ||
          r.place.name.toLowerCase().includes(lower) ||
          r.content.toLowerCase().includes(lower)
        );
      }
      return true;
    });
    return paginateCursor(filtered, limit, query.cursor);
  }

  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;
  if (status) params.status = status;
  if (searchParam) params.query = searchParam;

  return apiRequest<CursorPageResponse<WarmthReview>>('/admin/reviews', { params });
}

export async function moderateReview(reviewId: string, action: string, reason: string): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  return apiRequest<void>(`/admin/reviews/${reviewId}/moderation-actions`, {
    method: 'POST',
    body: { action, reason },
    csrf: true,
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportsQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  reason?: string;
  status?: string;
}

export async function getReports(query: ReportsQuery = {}): Promise<CursorPageResponse<ReportItem>> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const reason = query.reason === 'ALL' ? undefined : query.reason;

  if (USE_MOCK) {
    await delay(150);
    const filtered = mockReports.filter((r) => {
      if (reason && r.reason !== reason) return false;
      if (query.status && query.status !== 'ALL' && r.status !== query.status) return false;
      return true;
    });
    return paginateCursor(filtered, limit, query.cursor);
  }

  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;
  if (reason) params.reason = reason;

  return apiRequest<CursorPageResponse<ReportItem>>('/admin/reports', { params });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UsersQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  status?: string;
  search?: string;
}

export async function getUsers(query: UsersQuery = {}): Promise<CursorPageResponse<AdminUser>> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const normalizedStatus = query.status === 'ALL' ? undefined : query.status?.trim().toUpperCase();
  const serverStatus = normalizedStatus === 'ACTIVE' || normalizedStatus === 'DELETING' ? normalizedStatus : undefined;

  if (USE_MOCK) {
    await delay(150);
    const filtered = mockUsers.filter((u) => {
      if (normalizedStatus && u.status !== normalizedStatus) return false;
      if (query.search) {
        const q = query.search.toLowerCase();
        return u.email.toLowerCase().includes(q) || u.nickname.toLowerCase().includes(q);
      }
      return true;
    });
    return paginateCursor(filtered, limit, query.cursor);
  }

  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;
  if (serverStatus) params.status = serverStatus;

  return apiRequest<CursorPageResponse<AdminUser>>('/admin/users', { params });
}

export interface SanctionInput {
  type: string;
  reason: string;
  durationDays?: number;
}

export async function createSanction(memberId: string, input: SanctionInput): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  return apiRequest<void>(`/admin/users/${memberId}/sanctions`, {
    method: 'POST',
    body: input,
    csrf: true,
    idempotencyKey: newIdempotencyKey(),
  });
}

export async function revokeSanction(memberId: string, sanctionId: string): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  return apiRequest<void>(`/admin/users/${memberId}/sanctions/${sanctionId}`, {
    method: 'DELETE',
    csrf: true,
  });
}

export async function getSanctions(memberId: string): Promise<SanctionInput[]> {
  if (USE_MOCK) { await delay(150); return []; }
  return apiRequest<SanctionInput[]>(`/admin/users/${memberId}/sanctions`);
}

// ── Curations ─────────────────────────────────────────────────────────────────

export interface CurationsQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  category?: 'VILLAGE' | 'STAY' | 'ROUTE';
  included?: boolean;
}

const allMockCurations = () => [...mockVillages, ...mockStays, ...mockRoutes];

export async function getCurations(query: CurationsQuery = {}): Promise<CursorPageResponse<CurationItem>> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const category = query.category;
  const included = query.included;

  if (USE_MOCK) {
    await delay(150);
    const filtered = allMockCurations().filter((c) => {
      if (category && c.category !== category) return false;
      if (included !== undefined && c.isIncluded !== included) return false;
      return true;
    });
    return paginateCursor(filtered, limit, query.cursor);
  }

  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;
  if (category && ['VILLAGE', 'STAY', 'ROUTE'].includes(category)) params.category = category;
  if (included !== undefined) params.included = included;

  return apiRequest<CursorPageResponse<CurationItem>>('/admin/curations', { params });
}

export async function updateCuration(placeId: string, update: Partial<CurationItem>): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  return apiRequest<void>(`/admin/curations/${placeId}`, {
    method: 'PUT',
    body: update,
    csrf: true,
  });
}

// ── Moderation Queue ──────────────────────────────────────────────────────────

export interface ModerationQueueQuery {
  limit?: number;
  cursor?: string;
}

export async function getModerationQueue(
  query: ModerationQueueQuery = {}
): Promise<ModerationQueuePageResponse> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));

  if (USE_MOCK) {
    await delay(150);
    return {
      schemaVersion: '1.2',
      generatedAt: new Date().toISOString(),
      oldestOpenReportAgeSeconds: 0,
      items: [],
      hasNext: false,
      nextCursor: null,
    };
  }

  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;

  return apiRequest<ModerationQueuePageResponse>('/admin/moderation/queue', { params });
}

export async function getOperationsModerationQueue(
  query: ModerationQueueQuery = {}
): Promise<ModerationQueuePageResponse> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));

  if (USE_MOCK) {
    await delay(150);
    return {
      schemaVersion: '1.2',
      generatedAt: new Date().toISOString(),
      oldestOpenReportAgeSeconds: 0,
      items: [],
      hasNext: false,
      nextCursor: null,
    };
  }

  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;

  return apiRequest<ModerationQueuePageResponse>('/operations/moderation/queue', { params });
}

// ── Pipelines ─────────────────────────────────────────────────────────────────

export async function getPipelineStatus(dataset: string) {
  if (USE_MOCK) {
    await delay(150);
    return mockPipelineStatus;
  }
  return apiRequest(`/admin/pipelines/${dataset}/status`);
}

export async function runPipeline(dataset: string = 'hanok'): Promise<void> {
  if (USE_MOCK) { await delay(400); return; }
  return apiRequest<void>(`/admin/pipelines/${dataset}/runs`, {
    method: 'POST',
    csrf: true,
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── helpers ───────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function paginateCursor<T extends { id?: string }>(
  items: T[],
  limit: number,
  cursor?: string
): CursorPageResponse<T> {
  let startIndex = 0;
  if (cursor) {
    try {
      const decodedId = typeof atob !== 'undefined' ? atob(cursor) : cursor;
      const foundIdx = items.findIndex((i) => i.id === decodedId);
      if (foundIdx !== -1) {
        startIndex = foundIdx + 1;
      }
    } catch {
      // ignore invalid cursor in mock
    }
  }
  const pageItems = items.slice(startIndex, startIndex + limit);
  const hasNext = startIndex + limit < items.length;
  const nextItem = pageItems[pageItems.length - 1];
  const nextCursor = hasNext && nextItem?.id
    ? (typeof btoa !== 'undefined' ? btoa(nextItem.id) : nextItem.id)
    : null;

  return {
    schemaVersion: '1.0',
    items: pageItems,
    hasNext,
    hasMore: hasNext,
    nextCursor,
  };
}

// ── Testable Repository Factory ───────────────────────────────────────────────

export function createAdminRepository(
  fetcher: (path: string, options?: { method?: string; params?: Record<string, unknown>; body?: unknown }) => Promise<unknown>
) {
  return {
    listReviews: (query: ReviewsQuery = {}) => {
      const limit = Math.max(1, Math.min(100, query.limit ?? 20));
      const rawStatus = query.status === 'ALL' ? undefined : query.status;
      const status = rawStatus === 'DELETED' ? 'REMOVED' : rawStatus;
      const q = (query.query ?? query.search)?.trim();
      const searchParam = q && q.length > 0 ? q.slice(0, 120) : undefined;
      const params: Record<string, unknown> = { limit };
      if (query.cursor) params.cursor = query.cursor;
      if (status) params.status = status;
      if (searchParam) params.query = searchParam;
      return fetcher('/admin/reviews', { method: 'GET', params }) as Promise<CursorPageResponse<WarmthReview>>;
    },
    listReports: (query: ReportsQuery = {}) => {
      const limit = Math.max(1, Math.min(100, query.limit ?? 20));
      const reason = query.reason === 'ALL' ? undefined : query.reason;
      const params: Record<string, unknown> = { limit };
      if (query.cursor) params.cursor = query.cursor;
      if (reason) params.reason = reason;
      return fetcher('/admin/reports', { method: 'GET', params }) as Promise<CursorPageResponse<ReportItem>>;
    },
    listUsers: (query: UsersQuery = {}) => {
      const limit = Math.max(1, Math.min(100, query.limit ?? 20));
      const normalizedStatus = query.status === 'ALL' ? undefined : query.status?.trim().toUpperCase();
      const serverStatus = normalizedStatus === 'ACTIVE' || normalizedStatus === 'DELETING' ? normalizedStatus : undefined;
      const params: Record<string, unknown> = { limit };
      if (query.cursor) params.cursor = query.cursor;
      if (serverStatus) params.status = serverStatus;
      return fetcher('/admin/users', { method: 'GET', params }) as Promise<CursorPageResponse<AdminUser>>;
    },
    listCurations: (query: CurationsQuery = {}) => {
      const limit = Math.max(1, Math.min(100, query.limit ?? 20));
      const params: Record<string, unknown> = { limit };
      if (query.cursor) params.cursor = query.cursor;
      if (query.category && ['VILLAGE', 'STAY', 'ROUTE'].includes(query.category)) params.category = query.category;
      if (query.included !== undefined) params.included = query.included;
      return fetcher('/admin/curations', { method: 'GET', params }) as Promise<CursorPageResponse<CurationItem>>;
    },
    getModerationQueue: (query: ModerationQueueQuery = {}) => {
      const limit = Math.max(1, Math.min(100, query.limit ?? 20));
      const params: Record<string, unknown> = { limit };
      if (query.cursor) params.cursor = query.cursor;
      return fetcher('/admin/moderation/queue', { method: 'GET', params }) as Promise<ModerationQueuePageResponse>;
    },
    getOperationsModerationQueue: (query: ModerationQueueQuery = {}) => {
      const limit = Math.max(1, Math.min(100, query.limit ?? 20));
      const params: Record<string, unknown> = { limit };
      if (query.cursor) params.cursor = query.cursor;
      return fetcher('/operations/moderation/queue', { method: 'GET', params }) as Promise<ModerationQueuePageResponse>;
    },
  };
}
