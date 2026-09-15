import { describe, expect, it } from 'vitest';
import { createMemberTimelineRepository } from './memberTimelineApi';

describe('member timeline repository', () => {
  it('loads monthly timeline with no-store cache', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createMemberTimelineRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { month: '2026-09', groups: [], nextCursor: null, hasMore: false, unavailableCount: 0 };
    }) as never);

    await repository.getTimeline({ month: '2026-09', limit: 20 });

    expect(calls).toEqual([
      {
        path: '/me/timeline',
        options: { method: 'GET', cache: 'no-store', params: { month: '2026-09', limit: 20, cursor: undefined } },
      },
    ]);
  });
});
