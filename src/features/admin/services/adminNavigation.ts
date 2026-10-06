import type { DashboardStatCard } from '@/features/admin/types';

export interface AdminNavigationCounts {
  newReviews: number;
  pendingReports: number;
}

export function getAdminNavigationCounts(stats: DashboardStatCard[]): AdminNavigationCounts {
  const valueFor = (key: string) => stats.find((stat) => stat.key === key)?.value ?? 0;

  return {
    newReviews: valueFor('today_reviews'),
    pendingReports: valueFor('pending_reports'),
  };
}
