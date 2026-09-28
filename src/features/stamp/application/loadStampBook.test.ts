import { describe, expect, it, vi } from 'vitest';
import type { StampBookResponse } from '../domain/models';
import { loadPersonalStampBook } from './loadStampBook';

const book: StampBookResponse = {
  schemaVersion: '1.3',
  summary: {
    collectedCount: 0,
    totalCount: 12,
    visitedRegionCount: 0,
    requiredRegionCount: 5,
    completionRate: 0,
  },
  stamps: [],
};

describe('loadPersonalStampBook', () => {
  it('removes legacy demo data only after a successful server response', async () => {
    const storage = { removeLegacyStampData: vi.fn() };

    await expect(loadPersonalStampBook({
      getMyStampBook: vi.fn(async () => book),
    } as never, storage)).resolves.toEqual(book);
    expect(storage.removeLegacyStampData).toHaveBeenCalledOnce();

    await expect(loadPersonalStampBook({
      getMyStampBook: vi.fn(async () => { throw new Error('offline'); }),
    } as never, storage)).rejects.toThrow('offline');
    expect(storage.removeLegacyStampData).toHaveBeenCalledOnce();
  });
});
