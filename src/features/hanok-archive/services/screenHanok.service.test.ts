import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/hanok-archive/infrastructure/screenHanokSource', () => ({
  fetchBackendScreenHanoks: vi.fn().mockRejectedValue(new Error('backend unavailable')),
  saveScreenHanokPlace: vi.fn(),
  unsaveScreenHanokPlace: vi.fn(),
}));

import { screenHanokService } from './screenHanok.service';

describe('screenHanokService (Issue #103)', () => {
  it('returns screen hanok items including fallback when backend is unreachable', async () => {
    const items = await screenHanokService.getScreenHanoks();
    expect(items.length).toBeGreaterThan(0);

    const first = items[0];
    expect(first).toHaveProperty('placeId');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('region');
    expect(first).toHaveProperty('workTitle');
    expect(first).toHaveProperty('subtitle');
    expect(first).toHaveProperty('categoryLabel');
    expect(first).toHaveProperty('categoryIcon');
    expect(first).toHaveProperty('tags');
    expect(first).toHaveProperty('savedByMe');
  });

  it('filters fallback items by mediaType correctly', async () => {
    const dramas = await screenHanokService.getScreenHanoks({ mediaType: 'K_DRAMA' });
    expect(dramas.every((item) => item.mediaType === 'K_DRAMA')).toBe(true);

    const movies = await screenHanokService.getScreenHanoks({ mediaType: 'CINEMA' });
    expect(movies.every((item) => item.mediaType === 'CINEMA')).toBe(true);
  });
});
