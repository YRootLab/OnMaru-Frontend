import { useState, useEffect } from 'react';
import { getDiscoveryWorkDetail } from '../../application/useCases';
import { isOnmaruApiError } from '@/lib/api/errors';
import type { WorkDetail } from '../../domain/types';

export interface UseDiscoveryWorkDetailResult {
  work: WorkDetail | null;
  isLoading: boolean;
  isNotFound: boolean;
  isError: boolean;
}

export function useDiscoveryWorkDetail(workId: string): UseDiscoveryWorkDetailResult {
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!workId) return;
    let ignore = false;
    setIsLoading(true);
    setIsNotFound(false);
    setIsError(false);
    setWork(null);

    getDiscoveryWorkDetail(workId)
      .then((data) => {
        if (!ignore) {
          if (data) {
            setWork(data);
          } else {
            setIsNotFound(true);
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (isOnmaruApiError(err) && err.status === 404) {
            setIsNotFound(true);
          } else {
            setIsError(true);
          }
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => { ignore = true; };
  }, [workId]);

  return { work, isLoading, isNotFound, isError };
}
