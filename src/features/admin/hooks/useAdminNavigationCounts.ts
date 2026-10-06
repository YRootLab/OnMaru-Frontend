'use client';

import { useEffect, useState } from 'react';
import { getDashboardSummary, getReports } from '@/features/admin/api/adminApi';
import {
  getAdminNavigationCounts,
  type AdminNavigationCounts,
} from '@/features/admin/services/adminNavigation';

const EMPTY_COUNTS: AdminNavigationCounts = { newReviews: 0, pendingReports: 0 };

export function useAdminNavigationCounts(): AdminNavigationCounts {
  const [counts, setCounts] = useState<AdminNavigationCounts>(EMPTY_COUNTS);

  useEffect(() => {
    let active = true;
    Promise.all([getDashboardSummary(), getReports({ limit: 1 })])
      .then(([summary, reports]) => {
        if (!active) return;
        setCounts({
          ...getAdminNavigationCounts(summary.stats),
          pendingReports: reports.totalCount,
        });
      })
      .catch(() => {
        if (active) setCounts(EMPTY_COUNTS);
      });
    return () => {
      active = false;
    };
  }, []);

  return counts;
}
