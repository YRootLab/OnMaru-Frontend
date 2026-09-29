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
  PaginatedResponse,
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
  status?: string;
  search?: string;
  sort?: string;
}

export async function getReviews(query: ReviewsQuery = {}): Promise<PaginatedResponse<WarmthReview>> {
  if (USE_MOCK) {
    await delay(150);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filtered = mockReviews.filter((r) => {
      if (query.status && query.status !== 'ALL' && r.status !== query.status) return false;
      if (query.search) {
        const q = query.search.toLowerCase();
        return r.author.nickname.toLowerCase().includes(q) || r.place.name.toLowerCase().includes(q);
      }
      return true;
    });
    return paginate(filtered, page, limit);
  }
  return apiRequest<PaginatedResponse<WarmthReview>>('/admin/reviews', { params: query });
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
  status?: string;
}

export async function getReports(query: ReportsQuery = {}): Promise<PaginatedResponse<ReportItem>> {
  if (USE_MOCK) {
    await delay(150);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filtered = mockReports.filter((r) =>
      !query.status || query.status === 'ALL' || r.status === query.status,
    );
    return paginate(filtered, page, limit);
  }
  return apiRequest<PaginatedResponse<ReportItem>>('/admin/reports', { params: query });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UsersQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getUsers(query: UsersQuery = {}): Promise<PaginatedResponse<AdminUser>> {
  if (USE_MOCK) {
    await delay(150);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filtered = mockUsers.filter((u) => {
      if (query.status && query.status !== 'ALL' && u.status !== query.status) return false;
      if (query.search) {
        const q = query.search.toLowerCase();
        return u.email.toLowerCase().includes(q) || u.nickname.toLowerCase().includes(q);
      }
      return true;
    });
    return paginate(filtered, page, limit);
  }
  return apiRequest<PaginatedResponse<AdminUser>>('/admin/users', { params: query });
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

// ── Curations ─────────────────────────────────────────────────────────────────

const allMockCurations = () => [...mockVillages, ...mockStays, ...mockRoutes];

export async function getCurations(query: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<CurationItem>> {
  if (USE_MOCK) {
    await delay(150);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return paginate(allMockCurations(), page, limit);
  }
  return apiRequest<PaginatedResponse<CurationItem>>('/admin/curations', { params: query });
}

export async function updateCuration(placeId: string, update: Partial<CurationItem>): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  return apiRequest<void>(`/admin/curations/${placeId}`, {
    method: 'PUT',
    body: update,
    csrf: true,
  });
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

function paginate<T>(items: T[], page: number, limit: number): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total, page, limit, totalPages };
}
