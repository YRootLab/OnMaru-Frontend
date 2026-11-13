export type CulturalCollectionScope = 'hanok-home' | 'region-home' | 'utility';

export interface LocalizedText {
  ko: string;
  en?: string;
}

export interface CulturalCollectionPlaceRef {
  placeId: string;
}

export interface CulturalCollection {
  id: string;
  scope: CulturalCollectionScope;
  title: LocalizedText;
  subtitle: LocalizedText;
  provenance: string;
  placeRefs: CulturalCollectionPlaceRef[];
}

export function validateCulturalCollections(collections: readonly CulturalCollection[]): void {
  const ids = new Set<string>();

  for (const collection of collections) {
    if (!collection.id || ids.has(collection.id)) {
      throw new Error('Cultural collection ids must be unique.');
    }
    if (!collection.provenance.trim()) {
      throw new Error('Cultural collections require provenance.');
    }
    ids.add(collection.id);
  }
}
