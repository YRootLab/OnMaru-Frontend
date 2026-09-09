// ============================================================
// 대시보드 Mock 데이터 (src/admin/mock/dashboard.mock.ts)
// ============================================================

import { DashboardStatCard } from '@/admin/types';

export const mockDashboardStats: DashboardStatCard[] = [
  {
    key: 'today_reviews',
    label: '오늘 온기',
    value: 24,
    delta: 8,
    deltaType: 'increase',
    comparisonText: '어제 대비',
  },
  {
    key: 'pending_reports',
    label: '신고 대기',
    value: 3,
    delta: 0,
    deltaType: 'neutral',
    highlight: true,
    comparisonText: '신속 조치 필요',
  },
  {
    key: 'new_users',
    label: '신규 가입',
    value: 12,
    delta: 5,
    deltaType: 'increase',
    comparisonText: '어제 대비',
  },
  {
    key: 'total_users',
    label: '전체 사용자',
    value: 428,
    delta: 12,
    deltaType: 'increase',
    comparisonText: '누적 계정',
  },
];

export interface RecentReviewSummary {
  id: string;
  nickname: string;
  placeName: string;
  mood: number;
  timeAgo: string;
}

export const mockRecentReviews: RecentReviewSummary[] = [
  {
    id: 'rev_001',
    nickname: '기와사랑',
    placeName: '북촌 한옥마을 청원산방',
    mood: 5,
    timeAgo: '12분 전',
  },
  {
    id: 'rev_002',
    nickname: '달빛나그네',
    placeName: '전주 경기전 돌담길',
    mood: 4,
    timeAgo: '35분 전',
  },
  {
    id: 'rev_003',
    nickname: '소소한일상',
    placeName: '안동 하회마을 북촌댁',
    mood: 5,
    timeAgo: '1시간 전',
  },
  {
    id: 'rev_004',
    nickname: '바람여행자',
    placeName: '은평 한옥마을 셋이서문학관',
    mood: 3,
    timeAgo: '2시간 전',
  },
  {
    id: 'rev_005',
    nickname: '한옥러버',
    placeName: '경주 교촌마을 최부자댁',
    mood: 5,
    timeAgo: '3시간 전',
  },
];

export interface PendingReportSummary {
  id: string;
  reason: string;
  targetAuthor: string;
  targetPlace: string;
  timeAgo: string;
}

export const mockPendingReports: PendingReportSummary[] = [
  {
    id: 'rep_001',
    reason: '욕설/비방',
    targetAuthor: '불만투성이',
    targetPlace: '전주 한옥마을 다우원',
    timeAgo: '25분 전',
  },
  {
    id: 'rep_002',
    reason: '광고/스팸',
    targetAuthor: '핫딜홍보봇',
    targetPlace: '북촌 계동길 게스트하우스',
    timeAgo: '1시간 전',
  },
  {
    id: 'rep_003',
    reason: '허위정보',
    targetAuthor: '루머유포자',
    targetPlace: '안동 하회마을 양진당',
    timeAgo: '3시간 전',
  },
];

export const mockPipelineSummary = {
  lastBuildAt: '2026.08.04 04:00 (2시간 전)',
  duration: '4분 32초',
  villageCount: 17,
  stayCount: 172,
  routeCount: 41,
  apiCallUsed: 1247,
  apiCallLimit: 5000,
  failureCount: 3,
};
