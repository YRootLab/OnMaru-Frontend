import { describe, expect, it } from 'vitest';
import { createRegionResolveRepository } from './regionResolve.service';

describe('region resolve repository (FE #92)', () => {
  it('resolves GPS coordinates to administrative region candidates', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createRegionResolveRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return {
        schemaVersion: '1.2',
        coordinates: { lat: 35.8151, lng: 127.153 },
        candidates: [
          { region: { regionCode: 'kr-45', parentRegionCode: null, name: '전북특별자치도', level: 'PROVINCE' }, confidence: 0.99 },
          { region: { regionCode: 'kr-45-jeonju', parentRegionCode: 'kr-45', name: '전주시', level: 'CITY' }, confidence: 0.99 },
        ],
        resolvedAt: '2026-09-18T18:00:24.186Z',
      };
    }) as never);

    const result = await repository.resolve(35.8151, 127.153);

    expect(calls).toEqual([
      { path: '/regions/resolve', options: { method: 'GET', params: { lat: 35.8151, lng: 127.153 } } },
    ]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[1].region.name).toBe('전주시');
  });
});
