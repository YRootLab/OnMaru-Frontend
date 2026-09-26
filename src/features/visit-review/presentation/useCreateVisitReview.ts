'use client';

import { useCallback, useState } from 'react';
import { defaultVisitReviewRepository } from '../api/visitReviewApi';
import { createVisitReviewWarmth } from '../application/visitReviewUseCases';

type CreateInput = Parameters<typeof createVisitReviewWarmth>[1];

export function useCreateVisitReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const create = useCallback(async (input: CreateInput) => {
    setLoading(true);
    setError(null);
    try {
      return await createVisitReviewWarmth(defaultVisitReviewRepository, input);
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
