import { useState, useEffect } from 'react';
import { getDiscoveryPlaceDetail } from '../../application/useCases';
import type { DiscoveryPlaceDetail } from '../../domain/types';

export interface UseDiscoveryPlaceDetailResult {
  place: DiscoveryPlaceDetail | null;
  isLoading: boolean;
  isNotFound: boolean;
  isError: boolean;
}

export function useDiscoveryPlaceDetail(placeId: string): UseDiscoveryPlaceDetailResult {
  const [place, setPlace] = useState<DiscoveryPlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!placeId) return;
    let ignore = false;
    setIsLoading(true);
    setIsNotFound(false);
    setIsError(false);
    setPlace(null);

    getDiscoveryPlaceDetail(placeId)
      .then((data) => {
        if (!ignore) {
          if (data) {
            setPlace(data);
          } else {
            setIsNotFound(true);
          }
        }
      })
      .catch(() => {
        if (!ignore) setIsError(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => { ignore = true; };
  }, [placeId]);

  return { place, isLoading, isNotFound, isError };
}
