import { describe, expect, it } from 'vitest';
import { createSaveIntentStore } from './saveIntentStore';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

describe('save intent store', () => {
  it('stores only place id and desired saved state for guest login recovery', () => {
    const store = createSaveIntentStore(memoryStorage(), {
      now: () => new Date('2026-09-14T00:00:00.000Z'),
    });

    store.savePlaceIntent('p-hanok-01');

    expect(store.consume()).toEqual({
      resourceType: 'PLACE',
      placeId: 'p-hanok-01',
      desiredSaved: true,
      createdAt: '2026-09-14T00:00:00.000Z',
    });
    expect(store.consume()).toBeNull();
  });
});
