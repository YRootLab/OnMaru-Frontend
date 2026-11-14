import { describe, expect, it } from 'vitest';
import { selectCulturalCollection } from './selectCulturalCollection';

const collections = [{
  id: 'bukchon',
  scope: 'hanok-home' as const,
  title: { ko: '북촌' },
  subtitle: { ko: '한옥' },
  provenance: 'Editorial',
  placeRefs: [],
}];

describe('selectCulturalCollection', () => {
  it('returns the collection for an exact discovery scope', () => {
    expect(selectCulturalCollection(collections, 'hanok-home')?.id).toBe('bukchon');
  });

  it('returns null for utility or unmatched scopes', () => {
    expect(selectCulturalCollection(collections, 'utility')).toBeNull();
    expect(selectCulturalCollection(collections, 'region-home')).toBeNull();
  });
});
