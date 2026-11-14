'use client';
import type { Item } from '@/features/map/types';
import { CULTURAL_COLLECTIONS } from '@/features/map/infrastructure/culturalCollections.fixture';
import { selectCulturalCollection } from '@/features/map/application/selectCulturalCollection';
import { useInfoMapPresentation } from '@/features/map/presentation/useInfoMapPresentation';
import CulturalDiscoveryCollection from './CulturalDiscoveryCollection';
interface Props { items: Item[]; loading?: boolean; onPlaceSelect: (place: Item) => void; }
export default function InfoMapEditorialFeed({ items, loading = false, onPlaceSelect }: Props) {
  const { isDiscovery, collectionScope } = useInfoMapPresentation();
  const collection = selectCulturalCollection(CULTURAL_COLLECTIONS, collectionScope);
  if (!isDiscovery || !collection) return null;
  return <CulturalDiscoveryCollection collection={collection} places={items} loading={loading} onPlaceSelect={onPlaceSelect} />;
}
