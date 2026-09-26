import { describe, expect, it, vi } from 'vitest';
import type { StampRankingStatusResponse } from '../domain/models';
import { setStampRankingParticipation } from './updateStampRanking';

const joined: StampRankingStatusResponse = {
  schemaVersion: '1.3',
  participating: true,
  publicNickname: '고즈넉한여행자-A7K2',
  nicknameType: 'GENERATED',
  rank: 7,
  participantCount: 143,
  stampCount: 8,
  visitedRegionCount: 5,
  completionRate: 66,
};

describe('setStampRankingParticipation', () => {
  it('retries one csrf failure with the same participation value', async () => {
    const updateRankingParticipation = vi.fn()
      .mockRejectedValueOnce({ status: 403, code: 'CSRF_INVALID', requestId: 'req-1' })
      .mockResolvedValueOnce(joined);

    await expect(setStampRankingParticipation(true, {
      updateRankingParticipation,
    } as never)).resolves.toEqual(joined);

    expect(updateRankingParticipation.mock.calls).toEqual([[true], [true]]);
  });

  it('preserves rate-limit metadata without retrying participation', async () => {
    const limited = {
      status: 429,
      code: 'RATE_LIMITED',
      requestId: 'req-2',
      details: { retryAfterSeconds: 5 },
    };
    const updateRankingParticipation = vi.fn().mockRejectedValue(limited);

    await expect(setStampRankingParticipation(true, {
      updateRankingParticipation,
    } as never)).rejects.toBe(limited);
    expect(updateRankingParticipation).toHaveBeenCalledOnce();
  });

  it('allows a withdrawal request without a client-side waiting period', async () => {
    const withdrawn = { ...joined, participating: false, publicNickname: null, nicknameType: null, rank: null };
    const updateRankingParticipation = vi.fn().mockResolvedValue(withdrawn);

    await expect(setStampRankingParticipation(false, {
      updateRankingParticipation,
    } as never)).resolves.toEqual(withdrawn);
    expect(updateRankingParticipation).toHaveBeenCalledWith(false);
  });
});
