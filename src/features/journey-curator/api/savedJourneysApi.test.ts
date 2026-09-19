import { describe, expect, it } from 'vitest';
import { createSavedJourneysRepository } from './savedJourneysApi';
import type { JourneyBoard } from '../types/exploration.types';

const board: JourneyBoard = {
  title: '조용한 하루',
  querySummary: '전주 한옥마을 조용히 걷기',
  regionRef: { type: 'REGION', id: 'r-jeonju' },
  candidates: [],
  legs: [],
  resources: [],
  relations: [],
  evidence: [],
};

describe('saved journeys repository (FE #95)', () => {
  it('calls the backend contract paths, with csrf on write operations', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createSavedJourneysRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      if (path === '/saved-journeys' && (options as { method?: string }).method === 'GET') return { items: [] };
      return { id: 'saved-1', title: '제목', savedStateVersion: 1, board, pinnedRefs: [], savedAt: '2026-09-19T00:00:00.000Z' };
    }) as never);

    await repository.list();
    await repository.create(board, [], '제목');
    await repository.remove('saved-1');
    await repository.resume('saved-1', 'key-1');

    expect(calls).toEqual([
      { path: '/saved-journeys', options: { method: 'GET', cache: 'no-store' } },
      { path: '/saved-journeys', options: { method: 'POST', body: { title: '제목', board, pinnedRefs: [] }, csrf: true } },
      { path: '/saved-journeys/saved-1', options: { method: 'DELETE', csrf: true } },
      { path: '/saved-journeys/saved-1/resume', options: { method: 'POST', body: {}, csrf: true, idempotencyKey: 'key-1' } },
    ]);
  });
});
