



export type AdminRole = 'ADMIN' | 'EDITOR' | 'USER';

export interface AdminUser {
  id: string;
  email: string;
  nickname: string;
  role: AdminRole;
  status: 'ACTIVE' | 'DELETING' | 'SUSPENDED';
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

export type {
  PaginationParams,
  CursorPaginationParams,
  CursorPageResponse,
  PaginatedResponse,
  ModerationQueueItem,
  ModerationQueuePageResponse,
} from './domain/adminTypes';
