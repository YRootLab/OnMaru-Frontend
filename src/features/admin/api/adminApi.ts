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
  AdminRole,
  WarmthReview,
  ReportItem,
  ReportReason,
  CurationItem,
  CurationCategory,
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

  const raw = await apiRequest<any>('/admin/dashboard/summary');

  const statMap = new Map<string, number>();
  if (Array.isArray(raw?.stats)) {
    raw.stats.forEach((s: any) => {
      statMap.set(s.key, s.value);
    });
  }

  const stats: DashboardStatCard[] = Array.isArray(raw?.stats) && raw.stats[0]?.label
    ? raw.stats
    : [
        {
          key: 'today_reviews',
          label: '전체 온기',
          value: statMap.get('REVIEWS_TOTAL') ?? 0,
          delta: 0,
          deltaType: 'neutral',
          comparisonText: '누적 등록',
        },
        {
          key: 'pending_reports',
          label: '신고 대기',
          value: statMap.get('REPORTS_PENDING') ?? 0,
          delta: 0,
          deltaType: (statMap.get('REPORTS_PENDING') ?? 0) > 0 ? 'decrease' : 'neutral',
          highlight: (statMap.get('REPORTS_PENDING') ?? 0) > 0,
          comparisonText: (statMap.get('REPORTS_PENDING') ?? 0) > 0 ? '신속 조치 필요' : '모두 처리됨',
        },
        {
          key: 'published_reviews',
          label: '게시 중 온기',
          value: statMap.get('REVIEWS_PUBLISHED') ?? 0,
          delta: 0,
          deltaType: 'neutral',
          comparisonText: '정상 노출',
        },
        {
          key: 'hidden_reviews',
          label: '숨김·제재 온기',
          value: (statMap.get('REVIEWS_HIDDEN') ?? 0) + (statMap.get('REVIEWS_REMOVED') ?? 0),
          delta: 0,
          deltaType: 'neutral',
          comparisonText: '비공개 조치',
        },
      ];

  const recentReviews = Array.isArray(raw?.recentReviews)
    ? raw.recentReviews.map((r: any) => ({
        id: r.id,
        nickname: r.author?.nickname || r.nickname || '익명 온마루',
        placeName: r.place?.name || r.placeName || r.content?.slice(0, 16) || '한옥 장소',
        mood: r.mood ?? (r.score ?? 5),
        timeAgo: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ko-KR') : '최근',
      }))
    : [];

  const pendingReports = Array.isArray(raw?.pendingReports)
    ? raw.pendingReports.map((p: any) => ({
        id: p.id,
        reviewId: p.reviewId || p.targetReviewId,
        targetAuthor: p.targetAuthor || '작성자',
        targetPlace: p.targetPlace || '장소',
        reason: p.reason || '신고',
        timeAgo: p.createdAt ? new Date(p.createdAt).toLocaleDateString('ko-KR') : '최근',
      }))
    : [];

  return {
    stats,
    recentReviews,
    pendingReports,
    pipeline: raw?.pipeline || mockPipelineSummary,
  };
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

export function buildReviewsParams(query: ReviewsQuery = {}): Record<string, unknown> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const rawStatus = query.status === 'ALL' ? undefined : query.status;
  const status = rawStatus === 'DELETED' ? 'REMOVED' : rawStatus;
  const q = (query.query ?? query.search)?.trim();
  const searchParam = q && q.length > 0 ? q.slice(0, 120) : undefined;

  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;
  if (status) params.status = status;
  if (searchParam) params.query = searchParam;
  return params;
}

export async function getReviews(query: ReviewsQuery = {}): Promise<CursorPageResponse<WarmthReview>> {
  const params = buildReviewsParams(query);
  const limit = params.limit as number;
  const status = params.status as string | undefined;
  const searchParam = params.query as string | undefined;

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

  const res = await apiRequest<CursorPageResponse<any>>('/admin/reviews', { params });
  const items: WarmthReview[] = (res.items || []).map((r: any) => ({
    id: r.id,
    content: r.content || r.text || '',
    status: (r.status === 'DELETED' ? 'REMOVED' : r.status) || 'PUBLISHED',
    author: r.author || {
      id: r.authorId || 'unknown',
      nickname: r.authorNickname || `회원_${String(r.authorId || r.id).slice(0, 6)}`,
      email: r.authorEmail || `${String(r.authorId || r.id).slice(0, 6)}@onmaru.kr`,
    },
    place: r.place || {
      id: r.placeId || 'hanok_01',
      name: r.placeName || '한옥 장소',
      region: r.placeRegion || '서울/경기',
    },
    mood: r.mood ?? (r.score ?? 5),
    tags: r.tags || [],
    images: r.images || [],
    helpfulCount: r.helpfulCount ?? r.likeCount ?? 0,
    reportCount: r.reportCount ?? 0,
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
  }));

  return {
    schemaVersion: res.schemaVersion || '1.0',
    items,
    totalCount: Number(res.totalCount ?? items.length),
    hasNext: Boolean(res.hasNext),
    hasMore: Boolean(res.hasNext),
    nextCursor: res.hasNext ? res.nextCursor : null,
  };
}

export async function moderateReview(reviewId: string, actionOrStatus: string, reasonText?: string): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  const rawStatus = actionOrStatus.toUpperCase();
  const nextStatus = rawStatus === 'DELETED' ? 'REMOVED' : rawStatus;

  let mappedReason = 'OTHER_POLICY_VIOLATION';
  if (reasonText?.includes('스팸') || reasonText?.includes('광고')) mappedReason = 'SPAM_CONFIRMED';
  else if (reasonText?.includes('욕설') || reasonText?.includes('비방')) mappedReason = 'ABUSE_CONFIRMED';
  else if (reasonText?.includes('개인정보')) mappedReason = 'PII_HIGH_RISK';
  else if (reasonText?.includes('저작권')) mappedReason = 'COPYRIGHT_CONFIRMED';
  else if (nextStatus === 'PUBLISHED') mappedReason = 'FALSE_POSITIVE';

  return apiRequest<void>(`/admin/reviews/${reviewId}/moderation-actions`, {
    method: 'POST',
    body: {
      nextStatus,
      reason: mappedReason,
      note: reasonText || '관리자 조치',
    },
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

export function buildReportsParams(query: ReportsQuery = {}): Record<string, unknown> {
  const limit = Math.max(1, Math.min(100, query.limit ?? 20));
  const reason = query.reason === 'ALL' ? undefined : query.reason;
  const params: Record<string, unknown> = { limit };
  if (query.cursor) params.cursor = query.cursor;
  if (reason) params.reason = reason;
  if (query.status && query.status !== 'ALL') params.status = query.status;
  return params;
}

export async function getReports(query: ReportsQuery = {}): Promise<CursorPageResponse<ReportItem>> {
  const params = buildReportsParams(query);
  const limit = params.limit as number;
  const reason = params.reason as string | undefined;

  if (USE_MOCK) {
    await delay(150);
    const filtered = mockReports.filter((r) => {
      if (reason && r.reason !== reason) return false;
      if (query.status && query.status !== 'ALL' && r.status !== query.status) return false;
      return true;
    });
    return paginateCursor(filtered, limit, query.cursor);
  }

  const res = await apiRequest<CursorPageResponse<any>>('/admin/reports', { params });
  const items: ReportItem[] = (res.items || []).map((r: any) => ({
    id: r.id,
    reason: (r.reason as ReportReason) || 'SPAM',
    reasonLabel:
      r.reasonLabel ||
      (r.reason === 'SPAM' ? '광고/스팸' : r.reason === 'ABUSE' ? '욕설/비방' : r.reason || '기타'),
    reporter: r.reporter || {
      id: r.reporterId || 'usr-reporter',
      nickname: r.reporterNickname || '신고자',
      email: r.reporterEmail || 'reporter@onmaru.kr',
    },
    review: r.review || {
      id: r.reviewId || 'rev-01',
      author: {
        id: r.reviewAuthorId || 'author-01',
        nickname: r.reviewAuthorNickname || '피신고자',
        email: 'user@onmaru.kr',
      },
      place: {
        id: 'place-01',
        name: r.placeName || '한옥 장소',
        region: '서울/경기',
      },
      mood: 3,
      content: r.detail || r.reviewContent || '신고 대상 콘텐츠 내용',
      tags: [],
      images: [],
      helpfulCount: 0,
      reportCount: 1,
      status: 'PUBLISHED',
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.createdAt || new Date().toISOString(),
    },
    reportedUserAccumReports: r.reportedUserAccumReports ?? 1,
    status: r.status === 'OPEN' ? 'PENDING' : r.status || 'PENDING',
    createdAt: r.createdAt || new Date().toISOString(),
  }));

  return {
    schemaVersion: res.schemaVersion || '1.0',
    items,
    totalCount: Number(res.totalCount ?? items.length),
    hasNext: Boolean(res.hasNext),
    hasMore: Boolean(res.hasNext),
    nextCursor: res.hasNext ? res.nextCursor : null,
  };
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

  const res = await apiRequest<CursorPageResponse<any>>('/admin/users', { params });
  const items: AdminUser[] = (res.items || []).map((u: any) => ({
    id: u.id,
    email: u.email || `${String(u.id).slice(0, 8)}@onmaru.kr`,
    nickname: u.nickname || `회원_${String(u.id).slice(0, 6)}`,
    role: (u.role as AdminRole) || 'USER',
    status: (u.status as any) || 'ACTIVE',
    reviewCount: Number(u.reviewCount ?? 0),
    reportCount: Number(u.reportCount ?? 0),
    createdAt: u.createdAt || new Date().toISOString(),
    lastLoginAt: u.lastLoginAt,
  }));

  return {
    schemaVersion: res.schemaVersion || '1.0',
    items,
    totalCount: Number(res.totalCount ?? items.length),
    hasNext: Boolean(res.hasNext),
    hasMore: Boolean(res.hasNext),
    nextCursor: res.hasNext ? res.nextCursor : null,
  };
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

  const res = await apiRequest<CursorPageResponse<any>>('/admin/curations', { params });
  const items: CurationItem[] = (res.items || []).map((c: any) => ({
    id: c.id || c.placeId,
    contentId: c.placeId || c.contentId || c.id,
    category: (c.category as CurationCategory) || category || 'VILLAGE',
    name: c.name || `한옥 큐레이션 #${String(c.placeId || c.id).slice(0, 6)}`,
    region: c.region || '서울/경기',
    type: c.type || 'EXPERIENCE',
    thumbnail: c.thumbnail || '',
    badges: Array.isArray(c.badges) ? c.badges : [],
    isIncluded: typeof c.included === 'boolean' ? c.included : Boolean(c.isIncluded),
    lastModifiedBy: c.lastModifiedBy || '관리자',
    lastModifiedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ko-KR') : '방금 전',
  }));

  return {
    schemaVersion: res.schemaVersion || '1.0',
    items,
    totalCount: Number(res.totalCount ?? items.length),
    hasNext: Boolean(res.hasNext),
    hasMore: Boolean(res.hasNext),
    nextCursor: res.hasNext ? res.nextCursor : null,
  };
}

export async function updateCuration(placeId: string, update: Partial<CurationItem>): Promise<void> {
  if (USE_MOCK) { await delay(300); return; }
  return apiRequest<void>(`/admin/curations/${placeId}`, {
    method: 'PUT',
    body: {
      category: update.category,
      included: update.isIncluded ?? true,
      badges: update.badges ?? [],
    },
    csrf: true,
    idempotencyKey: newIdempotencyKey(),
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
      totalCount: 0,
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
      totalCount: 0,
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
    totalCount: items.length,
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
      const params = buildReviewsParams(query);
      return fetcher('/admin/reviews', { method: 'GET', params }) as Promise<CursorPageResponse<WarmthReview>>;
    },
    listReports: (query: ReportsQuery = {}) => {
      const params = buildReportsParams(query);
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
