'use client';

import { useEffect, useState } from 'react';
import { defaultVisitReviewRepository } from '../api/visitReviewApi';
import type { VisitReviewRegionItem } from '../api/visitReviewContract';
import { listSelectableVisitReviewRegions } from '../application/visitReviewUseCases';

export function useVisitReviewRegions() {
  const [data, setData] = useState<VisitReviewRegionItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    listSelectableVisitReviewRegions(defaultVisitReviewRepository)
      .then((regions) => {
        if (!cancelled) setData(regions);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
