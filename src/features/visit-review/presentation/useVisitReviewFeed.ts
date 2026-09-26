'use client';

import { useEffect, useState } from 'react';
import type { Warmth } from '@/features/map/types';
import { defaultVisitReviewRepository } from '../api/visitReviewApi';
import { listReviewWarmths } from '../application/visitReviewUseCases';

export function useVisitReviewFeed(regionCode?: string) {
  const [data, setData] = useState<Warmth[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listReviewWarmths(defaultVisitReviewRepository, regionCode)
      .then((reviews) => {
        if (!cancelled) setData(reviews);
      })
      .catch((nextError) => {
        if (!cancelled) setError(nextError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [regionCode]);

  return { data, loading, error };
}
