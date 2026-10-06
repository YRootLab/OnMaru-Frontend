import { describe, expect, it } from 'vitest';
import { isInfoUrlReconciliationPending, normalizeInfoCategory } from './infoCategory';

describe('normalizeInfoCategory', () => {
  it.each([null, '', 'all', 'ALL', 'unknown'])(
    'normalizes %s to the HANOK default',
    (value) => {
      expect(normalizeInfoCategory(value)).toBe('hanok');
    },
  );

  it.each(['hanok', 'stay', 'food', 'cafe', 'market', 'spot', 'culture', 'experience', 'festival'] as const)(
    'preserves the valid %s category',
    (value) => {
      expect(normalizeInfoCategory(value)).toBe(value);
    },
  );

  it('defers an outbound URL write while a valid client-navigation category is being applied', () => {
    expect(isInfoUrlReconciliationPending({
      inboundNavigationPending: true,
      queryMode: 'info',
      queryCategory: 'stay',
      queryRegionCode: '11',
      selectedCategory: 'hanok',
      selectedRegionCode: null,
    })).toBe(true);
  });

  it('allows an invalid URL category to be replaced by its HANOK normalization', () => {
    expect(isInfoUrlReconciliationPending({
      inboundNavigationPending: false,
      queryMode: 'info',
      queryCategory: 'all',
      queryRegionCode: null,
      selectedCategory: 'hanok',
      selectedRegionCode: null,
    })).toBe(false);
  });

  it('does not defer an outbound write for a local category change', () => {
    expect(isInfoUrlReconciliationPending({
      inboundNavigationPending: false,
      queryMode: 'info',
      queryCategory: 'hanok',
      queryRegionCode: null,
      selectedCategory: 'stay',
      selectedRegionCode: null,
    })).toBe(false);
  });
});
