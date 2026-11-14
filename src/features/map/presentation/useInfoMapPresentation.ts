'use client';

import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { CulturalCollectionScope } from '@/features/map/domain/culturalCollection';

export function useInfoMapPresentation(): {
  isDiscovery: boolean;
  isUtility: boolean;
  collectionScope: CulturalCollectionScope;
} {
  const mode = useMapStore((state) => state.mode);
  const category = useMapStore((state) => state.infoCategory);
  const regionCode = useMapStore((state) => state.infoRegionCode);
  const searchQuery = useMapStore((state) => state.searchQuery);
  const hasDirectQuery = searchQuery.trim().length > 0;
  const isDiscovery = mode === 'info' && category === 'hanok' && regionCode === null && !hasDirectQuery;

  return {
    isDiscovery,
    isUtility: !isDiscovery,
    collectionScope: isDiscovery ? 'hanok-home' : regionCode ? 'region-home' : 'utility',
  };
}
