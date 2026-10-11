import { useState, useEffect } from 'react';
import { getKContents } from '../../application/useCases';
import type { KContentRelation } from '../../domain/types';

export interface UseKContentRelationsResult {
  relations: KContentRelation[];
  isLoading: boolean;
  isError: boolean;
}

export function useKContentRelations(placeId: string): UseKContentRelationsResult {
  const [relations, setRelations] = useState<KContentRelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!placeId) return;
    let ignore = false;
    setIsLoading(true);
    setIsError(false);
    setRelations([]);

    getKContents(placeId)
      .then((page) => {
        if (!ignore) setRelations(page.items.filter((r) => r.relationType === 'FILMING_LOCATION'));
      })
      .catch(() => {
        if (!ignore) setIsError(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => { ignore = true; };
  }, [placeId]);

  return { relations, isLoading, isError };
}
