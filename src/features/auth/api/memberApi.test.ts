import { describe, expect, it } from 'vitest';
import { createMemberRepository } from './memberApi';

describe('member repository (FE #97)', () => {
  it('calls the backend contract paths with csrf on mutations', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createMemberRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return undefined as never;
    }) as never);

    await repository.getMyProfile();
    await repository.deleteMyAccount();
    await repository.logout();

    expect(calls).toEqual([
      { path: '/members/me', options: { method: 'GET', cache: 'no-store' } },
      { path: '/members/me', options: { method: 'DELETE', csrf: true } },
      { path: '/auth/logout', options: { method: 'POST', csrf: true } },
    ]);
  });

  it('returns the 202 deletion receipt from DELETE /members/me', async () => {
    const repository = createMemberRepository((async () => ({
      status: 'DELETING',
    })) as never);

    await expect(repository.deleteMyAccount()).resolves.toEqual({ status: 'DELETING' });
  });
});
