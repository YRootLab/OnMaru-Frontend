'use client';
import { useCallback } from 'react';
import type { Item } from '@/features/map/types';
import type { CulturalCollectionPath } from '@/features/map/domain/culturalCollection';
import { CULTURAL_COLLECTIONS } from '@/features/map/infrastructure/culturalCollections.fixture';
import { selectCulturalCollection } from '@/features/map/application/selectCulturalCollection';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useInfoMapPresentation } from '@/features/map/presentation/useInfoMapPresentation';
import { useInfoMapHomeNavigation } from '@/features/map/presentation/useInfoMapHomeNavigation';
import CulturalDiscoveryCollection from './CulturalDiscoveryCollection';
interface Props { items: Item[]; loading?: boolean; onPlaceSelect: (place: Item) => void; }
export default function InfoMapEditorialFeed({ items, loading = false, onPlaceSelect }: Props) {
  const { isDiscovery, collectionScope } = useInfoMapPresentation();
  const { captureBeforeNavigation } = useInfoMapHomeNavigation();
  const collection = selectCulturalCollection(CULTURAL_COLLECTIONS, collectionScope);
  const handlePathSelect = useCallback((path: CulturalCollectionPath) => {
    captureBeforeNavigation();
    const store = useMapStore.getState();
    store.setInfoCategory(path.category);
    store.setSearchQuery(path.searchQuery);
    store.setPanelOpen(true);
  }, [captureBeforeNavigation]);

  if (!isDiscovery || !collection) return null;
  return (
    <CulturalDiscoveryCollection
      collection={collection}
      places={items}
      loading={loading}
      onPlaceSelect={onPlaceSelect}
      onPathSelect={handlePathSelect}
    />
  );
}
