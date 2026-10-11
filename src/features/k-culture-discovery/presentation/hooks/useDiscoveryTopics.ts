import { useState, useEffect } from 'react';
import { getDiscoveryTopics } from '../../application/useCases';
import type { DiscoveryTopic } from '../../domain/types';

export interface UseDiscoveryTopicsResult {
  topics: DiscoveryTopic[];
  isLoading: boolean;
  isError: boolean;
}

export function useDiscoveryTopics(): UseDiscoveryTopicsResult {
  const [topics, setTopics] = useState<DiscoveryTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setIsError(false);

    getDiscoveryTopics()
      .then((data) => {
        if (!ignore) setTopics(data.filter((t) => t.active && t.placeCount > 0));
      })
      .catch(() => {
        if (!ignore) setIsError(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  return { topics, isLoading, isError };
}
