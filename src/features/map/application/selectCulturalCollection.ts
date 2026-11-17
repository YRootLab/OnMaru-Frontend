import type {
  CulturalCollection,
  CulturalCollectionScope,
} from '@/features/map/domain/culturalCollection';

export function selectCulturalCollection(
  collections: readonly CulturalCollection[],
  scope: CulturalCollectionScope,
): CulturalCollection | null {
  if (scope === 'utility') return null;
  return collections.find((collection) => collection.scope === scope) ?? null;
}
