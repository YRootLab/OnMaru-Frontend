import { describe, expect, it } from 'vitest';
import { getAdminNavigationCounts } from './adminNavigation';

describe('getAdminNavigationCounts', () => {
  it('uses live dashboard metrics instead of fixed sidebar counts', () => {
    expect(getAdminNavigationCounts([
      { key: 'today_reviews', label: '전체 온기', value: 12, delta: 0, deltaType: 'neutral', comparisonText: '' },
      { key: 'pending_reports', label: '신고 대기', value: 4, delta: 0, deltaType: 'neutral', comparisonText: '' },
    ])).toEqual({ newReviews: 12, pendingReports: 4 });
  });

  it('returns zero when a metric is absent', () => {
    expect(getAdminNavigationCounts([])).toEqual({ newReviews: 0, pendingReports: 0 });
  });
});
