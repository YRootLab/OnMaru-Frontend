import { describe, expect, it } from 'vitest';
import { createSavedResourcesRepository } from './savedResourcesApi';

describe('saved resources repository', () => {
  it('uses canonical placeId for place save and unsave', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createSavedResourcesRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { resourceType: 'PLACE', resourceId: 'p-hanok-01', savedByMe: true, savedAt: '2026-09-14T00:00:00.000Z' };
    }) as never);

    await repository.savePlace('p-hanok-01');
    await repository.unsavePlace('p-hanok-01');

    expect(calls).toEqual([
      { path: '/saved-resources/places/p-hanok-01', options: { method: 'PUT', csrf: true } },
      { path: '/saved-resources/places/p-hanok-01', options: { method: 'DELETE', csrf: true } },
    ]);
  });
});
