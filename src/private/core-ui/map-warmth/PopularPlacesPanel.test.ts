import { describe, expect, it } from 'vitest';
import { resolvePopularPlaceThumbnailUrl } from './PopularPlacesPanel';

describe('resolvePopularPlaceThumbnailUrl', () => {
  it('uses a trimmed image URL until that URL has failed to load', () => {
    expect(resolvePopularPlaceThumbnailUrl(' https://example.com/place.jpg ', null))
      .toBe('https://example.com/place.jpg');
    expect(resolvePopularPlaceThumbnailUrl('https://example.com/place.jpg', 'https://example.com/place.jpg'))
      .toBeNull();
  });

  it('uses the placeholder for missing or whitespace-only URLs', () => {
    expect(resolvePopularPlaceThumbnailUrl(null, null)).toBeNull();
    expect(resolvePopularPlaceThumbnailUrl('   ', null)).toBeNull();
  });
});
