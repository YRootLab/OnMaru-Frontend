'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Warmth } from '@/features/map/types';
import { defaultVisitReviewRepository } from '../api/visitReviewApi';
import { listPlaceReviewWarmths } from '../application/visitReviewUseCases';

export function usePlaceVisitReviews(placeId: string) {
  const [data, setData] = useState<Warmth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reviews = await listPlaceReviewWarmths(defaultVisitReviewRepository, placeId);
      setData(reviews);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const prepend = useCallback((review: Warmth) => {
    setData((current) => [review, ...current.filter((item) => item.id !== review.id)]);
  }, []);

  return { data, loading, error, reload: load, prepend };
}
