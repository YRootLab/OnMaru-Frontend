import { describe, expect, it } from 'vitest';
import { createConversationHttpRepository, fixtureConversationRepository } from './conversationHttpRepository';

describe('conversation HTTP repository', () => {
  it('returns fixture turns newest first without changing their stored conversation order', async () => {
    const accepted = await fixtureConversationRepository.createExploration({
      query: '첫 번째 질문',
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
    });

    await fixtureConversationRepository.createTurn({
      explorationId: accepted.explorationId,
      query: '두 번째 질문',
      baseVersion: accepted.stateVersion,
      clientTurnId: '22222222-2222-4222-8222-222222222222',
      idempotencyKey: '33333333-3333-4333-8333-333333333333',
    });

    const turns = await fixtureConversationRepository.listTurns({ explorationId: accepted.explorationId });

    expect(turns.items.map((turn) => turn.query)).toEqual(['두 번째 질문', '첫 번째 질문']);
  });

  it('reads conversation lists and transcript pages from the public exploration resources', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createConversationHttpRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { schemaVersion: '1.3', items: [], totalCount: 0, nextCursor: null, hasMore: false };
    }) as never);

    await repository.listExplorations({ limit: 20, cursor: 'next' });
    await repository.listTurns({ explorationId: 'exploration-1', limit: 10, cursor: 'older' });

    expect(calls).toEqual([
      { path: '/explorations', options: { method: 'GET', cache: 'no-store', params: { limit: 20, cursor: 'next' } } },
      {
        path: '/explorations/exploration-1/turns',
        options: { method: 'GET', cache: 'no-store', params: { limit: 10, cursor: 'older' } },
      },
    ]);
  });
});
