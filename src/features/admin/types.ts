// ============================================================
// 온마루 관리자 도메인 타입 정의 (src/admin/types.ts)
// ============================================================

export type AdminRole = 'ADMIN' | 'EDITOR' | 'USER';

export interface AdminUser {
  id: string;
  email: string;
  nickname: string;
  role: AdminRole;
  status: 'ACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  reviewCount: number;
  reportCount: number;
  createdAt: string;
  lastLoginAt: string;
  suspendReason?: string;
  suspendedUntil?: string;
}

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'DELETED';
export type ReviewMood = 1 | 2 | 3 | 4 | 5;

export interface WarmthReview {
  id: string;
  author: {
    id: string;
    nickname: string;
    email: string;
    avatarUrl?: string;
  };
  place: {
    id: string;
    name: string;
    region: string;
  };
  mood: ReviewMood;
  content: string;
  tags: string[];
  images: string[];
  helpfulCount: number;
  reportCount: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReportReason = 'ABUSE' | 'SPAM' | 'FALSE_INFO' | 'INAPPROPRIATE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface ReportItem {
  id: string;
  reason: ReportReason;
  reasonLabel: string;
  reporter: {
    id: string;
    nickname: string;
    email: string;
  };
  review: WarmthReview;
  reportedUserAccumReports: number;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type HanokCurationType = 'URBAN' | 'CLAN' | 'EXPERIENCE';
export type CurationCategory = 'VILLAGE' | 'STAY' | 'ROUTE';

export interface CurationItem {
  id: string;
  contentId: string;
  category: CurationCategory;
  thumbnail: string;
  name: string;
  region: string;
  type: HanokCurationType;
  badges: string[];
  isIncluded: boolean;
  lastModifiedBy: string;
  lastModifiedAt: string;
  isModifiedLocally?: boolean;
}

export interface PipelineEndpointStats {
  endpoint: string;
  used: number;
  limit: number;
}

export interface PipelineFailureLog {
  id: string;
  timestamp: string;
  endpoint: string;
  contentId: string;
  errorMessage: string;
}

export interface PipelineStatus {
  lastBuildAt: string;
  duration: string;
  result: 'SUCCESS' | 'FAILURE';
  failureCount: number;
  villageCount: number;
  villageImageRate: number;
  stayCount: number;
  stayImageRate: number;
  routeCount: number;
  apiCallUsed: number;
  apiCallLimit: number;
  endpoints: PipelineEndpointStats[];
  failureLogs: PipelineFailureLog[];
}

export interface DashboardStatCard {
  key: string;
  label: string;
  value: number;
  delta: number;
  deltaType: 'increase' | 'decrease' | 'neutral';
  highlight?: boolean;
  comparisonText: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
