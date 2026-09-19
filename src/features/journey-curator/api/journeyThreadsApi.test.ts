import { describe, expect, it } from 'vitest';
import { createJourneyThreadsRepository } from './journeyThreadsApi';

describe('journey threads repository (FE #94)', () => {
  it('calls the backend contract paths, with csrf only on delete', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createJourneyThreadsRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasMore: false } as never;
    }) as never);

    await repository.listThreads({ limit: 10 });
    await repository.getThread('thread-1');
    await repository.deleteThread('thread-1');

    expect(calls).toEqual([
      { path: '/me/journey-threads', options: { method: 'GET', params: { limit: 10, cursor: undefined } } },
      { path: '/me/journey-threads/thread-1', options: { method: 'GET' } },
      { path: '/me/journey-threads/thread-1', options: { method: 'DELETE', csrf: true } },
    ]);
  });
});
