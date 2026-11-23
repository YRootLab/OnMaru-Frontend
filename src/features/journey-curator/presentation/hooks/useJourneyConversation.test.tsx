import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ConversationRepository } from '../../application/conversationRepository';
import type { RunAccepted } from '../../api/journeyApi';
import type { ConversationSnapshot } from '../../domain/conversation';
import { useJourneyConversation } from './useJourneyConversation';

const snapshot: ConversationSnapshot = {
  schemaVersion: '1.3',
  explorationId: 'existing-exploration',
  stateVersion: 1,
  board: null,
  pinnedRefs: [],
  excludedRefs: [],
  unavailableRefs: [],
  latestRun: null,
  pendingProposal: null,
  updatedAt: '2026-11-23T00:00:00.000Z',
};

function createRepository(overrides: Partial<ConversationRepository> = {}): ConversationRepository {
  return {
    listExplorations: vi.fn().mockResolvedValue({ schemaVersion: '1.3', items: [], totalCount: 0, nextCursor: null, hasMore: false }),
    getExploration: vi.fn().mockResolvedValue(snapshot),
    listTurns: vi.fn().mockResolvedValue({ schemaVersion: '1.3', items: [], nextCursor: null, hasMore: false }),
    createExploration: vi.fn(),
    createTurn: vi.fn(),
    getAcceptedSnapshots: vi.fn(),
    subscribeToRunEvents: vi.fn(() => vi.fn()),
    cancelRun: vi.fn(),
    deleteExploration: vi.fn(),
    ...overrides,
  };
}

describe('useJourneyConversation', () => {
  it('shows the load error when the initial turn page request fails', async () => {
    const repository = createRepository({
      listTurns: vi.fn().mockRejectedValue(new Error('turns unavailable')),
    });
    const { result } = renderHook(() => useJourneyConversation('existing-exploration', repository));

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.turns).toEqual([]);
  });

  it('invalidates a pending create request when another exploration starts loading', async () => {
    let resolveCreate: ((value: RunAccepted) => void) | undefined;
    const repository = createRepository({
      createExploration: vi.fn(() => new Promise<RunAccepted>((resolve) => { resolveCreate = resolve; })),
    });
    const { result } = renderHook(() => useJourneyConversation(null, repository));

    let pendingCreate: Promise<string | null>;
    act(() => {
      pendingCreate = result.current.startConversation('새 여정');
      void result.current.loadConversation('existing-exploration');
    });

    await waitFor(() => expect(repository.getExploration).toHaveBeenCalledWith('existing-exploration'));
    resolveCreate?.({
      schemaVersion: '1.3',
      explorationId: 'new-exploration',
      runId: 'new-run',
      stateVersion: 1,
      runUrl: '/runs/new-run',
      eventsUrl: '/events/new-run',
      snapshotUrl: '/explorations/new-exploration',
    });

    await expect(pendingCreate!).resolves.toBeNull();
    expect(repository.getAcceptedSnapshots).not.toHaveBeenCalled();
  });
});
