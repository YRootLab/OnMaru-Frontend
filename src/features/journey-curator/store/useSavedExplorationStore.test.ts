import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const repoMock = {
  list: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  resume: vi.fn(),
};
vi.mock('../api/savedJourneysApi', () => ({ defaultSavedJourneysRepository: repoMock }));

describe('useSavedExplorationStore (FE #95)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    repoMock.list.mockReset();
    repoMock.create.mockReset();
    repoMock.remove.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    vi.resetModules();
  });

  it('loads and saves through the backend repository when the backend is configured', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    repoMock.list.mockResolvedValue([]);
    repoMock.create.mockResolvedValue({
      id: 'saved-1',
      title: '제목',
      savedStateVersion: 1,
      board,
      pinnedRefs: [],
      savedAt: '2026-09-19T00:00:00.000Z',
    });

    const { useSavedExplorationStore } = await import('./useSavedExplorationStore');
    await useSavedExplorationStore.getState().loadSaved();
    expect(repoMock.list).toHaveBeenCalled();

    await useSavedExplorationStore.getState().saveJourney(board, [], '제목');
    expect(repoMock.create).toHaveBeenCalledWith(board, [], '제목');
    expect(useSavedExplorationStore.getState().details).toHaveLength(1);
    expect(useSavedExplorationStore.getState().details[0].id).toBe('saved-1');
  });

  it('falls back to localStorage when the backend save fails', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.onmaru.test';
    repoMock.create.mockRejectedValue(new Error('network error'));

    const { useSavedExplorationStore } = await import('./useSavedExplorationStore');
    const detail = await useSavedExplorationStore.getState().saveJourney(board, [], '폴백 제목');

    expect(detail.title).toBe('폴백 제목');
    expect(useSavedExplorationStore.getState().details).toHaveLength(1);
  });

  it('uses localStorage directly when no backend is configured', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    const { useSavedExplorationStore } = await import('./useSavedExplorationStore');
    await useSavedExplorationStore.getState().loadSaved();

    expect(repoMock.list).not.toHaveBeenCalled();
  });
});
