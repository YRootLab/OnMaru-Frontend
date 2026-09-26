import { describe, expect, it, vi } from 'vitest';
import type {
  StampLeaderboardResponse,
  StampRankingStatusResponse,
} from '../domain/models';
import { createStampRankingController } from './stampRankingController';

const publicRanking: StampLeaderboardResponse = {
  schemaVersion: '1.3',
  generatedAt: '2026-09-27T03:00:00Z',
  entries: [{
    rank: 1,
    publicId: '550e8400-e29b-41d4-a716-446655440000',
    nickname: '고즈넉한여행자-A7K2',
    nicknameType: 'GENERATED',
    stampCount: 12,
    visitedRegionCount: 7,
    completionRate: 100,
  }],
};

const notParticipating: StampRankingStatusResponse = {
  schemaVersion: '1.3',
  participating: false,
  publicNickname: null,
  nicknameType: null,
  rank: null,
  participantCount: 143,
  stampCount: 8,
  visitedRegionCount: 5,
  completionRate: 66,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

describe('stamp ranking controller', () => {
  it('loads the public list without requesting personal state for a guest', async () => {
    const repository = {
      getLeaderboard: vi.fn(async () => publicRanking),
      getMyRanking: vi.fn(),
      updateRankingParticipation: vi.fn(),
    };
    const controller = createStampRankingController(repository as never);

    await controller.load(false);

    expect(controller.getState()).toMatchObject({
      leaderboard: publicRanking,
      myRanking: null,
      loading: false,
    });
    expect(repository.getMyRanking).not.toHaveBeenCalled();
  });

  it('keeps personal rank even when the member is outside the public limit', async () => {
    const myRanking = { ...notParticipating, participating: true, publicNickname: '담담한여행자-Z9P1', nicknameType: 'GENERATED' as const, rank: 87 };
    const controller = createStampRankingController({
      getLeaderboard: vi.fn(async () => publicRanking),
      getMyRanking: vi.fn(async () => myRanking),
      updateRankingParticipation: vi.fn(),
    } as never);

    await controller.load(true);

    expect(controller.getState().myRanking?.rank).toBe(87);
    expect(controller.getState().leaderboard?.entries).toHaveLength(1);
  });

  it('refreshes both views after joining and withdrawing', async () => {
    const updateRankingParticipation = vi.fn(async (participating: boolean) => ({
      ...notParticipating,
      participating,
      publicNickname: participating ? '고즈넉한여행자-A7K2' : null,
      nicknameType: participating ? 'GENERATED' as const : null,
      rank: participating ? 7 : null,
    }));
    const getLeaderboard = vi.fn(async () => publicRanking);
    const getMyRanking = vi.fn(async () => notParticipating);
    const controller = createStampRankingController({
      getLeaderboard,
      getMyRanking,
      updateRankingParticipation,
    } as never);

    await controller.update(true);
    await controller.update(false);

    expect(updateRankingParticipation.mock.calls).toEqual([[true], [false]]);
    expect(getLeaderboard).toHaveBeenCalledTimes(2);
    expect(getMyRanking).toHaveBeenCalledTimes(2);
  });

  it('exposes retry seconds for a rate-limited join without blocking withdrawal', async () => {
    const limited = {
      status: 429,
      code: 'RATE_LIMITED',
      requestId: 'req-rate',
      details: { retryAfterSeconds: 5 },
    };
    const updateRankingParticipation = vi.fn()
      .mockRejectedValueOnce(limited)
      .mockResolvedValueOnce(notParticipating);
    const controller = createStampRankingController({
      getLeaderboard: vi.fn(async () => publicRanking),
      getMyRanking: vi.fn(async () => notParticipating),
      updateRankingParticipation,
    } as never);

    await expect(controller.update(true)).rejects.toBe(limited);
    expect(controller.getState().retryAfterSeconds).toBe(5);
    await expect(controller.update(false)).resolves.toBeUndefined();
  });

  it('ignores an older public response that arrives after a newer reload', async () => {
    const oldRequest = deferred<StampLeaderboardResponse>();
    const newRanking = { ...publicRanking, generatedAt: '2026-09-27T04:00:00Z', entries: [] };
    const getLeaderboard = vi.fn()
      .mockReturnValueOnce(oldRequest.promise)
      .mockResolvedValueOnce(newRanking);
    const controller = createStampRankingController({
      getLeaderboard,
      getMyRanking: vi.fn(),
      updateRankingParticipation: vi.fn(),
    } as never);

    const olderLoad = controller.load(false);
    await controller.load(false);
    oldRequest.resolve(publicRanking);
    await olderLoad;

    expect(controller.getState().leaderboard).toEqual(newRanking);
  });
});
