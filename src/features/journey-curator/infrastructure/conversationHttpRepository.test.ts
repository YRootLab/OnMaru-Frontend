import { describe, expect, it } from 'vitest';
import { createConversationHttpRepository } from './conversationHttpRepository';

describe('conversation HTTP repository', () => {
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
