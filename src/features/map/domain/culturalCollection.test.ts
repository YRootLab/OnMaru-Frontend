import { describe, expect, it } from 'vitest';
import { validateCulturalCollections } from './culturalCollection';

describe('validateCulturalCollections', () => {
  it('rejects duplicate collection ids and missing provenance', () => {
    expect(() => validateCulturalCollections([
      { id: 'bukchon', scope: 'hanok-home', title: { ko: '북촌' }, subtitle: { ko: '한옥' }, provenance: 'Editorial', placeRefs: [] },
      { id: 'bukchon', scope: 'hanok-home', title: { ko: '북촌' }, subtitle: { ko: '한옥' }, provenance: '', placeRefs: [] },
    ])).toThrow();
  });
});
