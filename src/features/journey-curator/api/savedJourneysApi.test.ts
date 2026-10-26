import { describe, expect, it } from 'vitest';
import { createSavedJourneysRepository } from './savedJourneysApi';
import type { SavedJourneyDetail } from '../types/exploration.types';

const mockDetail: SavedJourneyDetail = {
  id: 'saved-1',
  title: '제목',
  savedStateVersion: 1,
  board: { title: '조용한 하루', querySummary: '', regionRef: { type: 'REGION', id: 'r-jeonju' }, candidates: [], legs: [], resources: [], relations: [], evidence: [] },
  pinnedRefs: [],
  savedAt: '2026-09-19T00:00:00.000Z',
};

describe('saved journeys repository (FE #95)', () => {
  it('calls the backend contract paths, with csrf on write operations', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createSavedJourneysRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      if (path === '/saved-journeys' && (options as { method?: string }).method === 'GET') return { items: [] };
      return mockDetail;
    }) as never);

    await repository.list();
    await repository.create({ explorationId: 'exp-1', baseVersion: 1, title: '제목' });
    await repository.remove('saved-1');
    await repository.resume('saved-1', 'key-1');

    expect(calls).toEqual([
      { path: '/saved-journeys', options: { method: 'GET', cache: 'no-store' } },
      { path: '/saved-journeys', options: { method: 'POST', body: { explorationId: 'exp-1', baseVersion: 1, title: '제목' }, csrf: true } },
      { path: '/saved-journeys/saved-1', options: { method: 'DELETE', csrf: true } },
      { path: '/saved-journeys/saved-1/resume', options: { method: 'POST', body: {}, csrf: true, idempotencyKey: 'key-1' } },
    ]);
  });
});
