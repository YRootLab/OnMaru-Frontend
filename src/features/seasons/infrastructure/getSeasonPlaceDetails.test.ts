import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSeasonPlaceDetails } from './getSeasonPlaceDetails';

describe('getSeasonPlaceDetails', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('resolves a TourAPI snapshot ID through the backend canonical place ID', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ placeId: 'p-tourapi-1877312', name: '운영 양소당' }) }));
    vi.stubGlobal('fetch', fetcher);
    const result = await getSeasonPlaceDetails(['1877312']);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/api/v1/places/p-tourapi-1877312'), expect.any(Object));
    expect(result.get('1877312')?.name).toBe('운영 양소당');
  });
});
