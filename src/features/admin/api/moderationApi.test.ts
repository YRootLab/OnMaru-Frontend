import { describe, expect, it } from 'vitest';
import { createModerationRepository } from './moderationApi';

describe('moderation repository (FE #96)', () => {
  it('sends the operator header on the queue and moderate calls', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createModerationRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [] } as never;
    }) as never);

    await repository.getQueue('operator-admin', 50);
    await repository.moderateReview('operator-admin', 'review-1', { nextStatus: 'HIDDEN', reason: 'SPAM_CONFIRMED' });

    expect(calls[0]).toMatchObject({
      path: '/operations/moderation/queue',
      options: { method: 'GET', params: { limit: 50 }, headers: { 'X-OnMaru-Operator': 'operator-admin' } },
    });
    expect(calls[1]).toMatchObject({
      path: '/operations/moderation/visit-reviews/review-1',
      options: {
        method: 'POST',
        body: { nextStatus: 'HIDDEN', reason: 'SPAM_CONFIRMED' },
        headers: { 'X-OnMaru-Operator': 'operator-admin' },
      },
    });
  });
});
