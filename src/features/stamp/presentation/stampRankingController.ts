import { isOnmaruApiError } from '@/lib/api/errors';
import { setStampRankingParticipation } from '../application/updateStampRanking';
import type { StampRepository } from '../application/ports';
import type {
  StampLeaderboardResponse,
  StampRankingStatusResponse,
} from '../domain/models';

export interface StampRankingState {
  leaderboard: StampLeaderboardResponse | null;
  myRanking: StampRankingStatusResponse | null;
  loading: boolean;
  mutationPending: boolean;
  error: unknown;
  retryAfterSeconds: number;
}

const initialState: StampRankingState = {
  leaderboard: null,
  myRanking: null,
  loading: false,
  mutationPending: false,
  error: null,
  retryAfterSeconds: 0,
};

export function createStampRankingController(
  repository: Pick<
    StampRepository,
    'getLeaderboard' | 'getMyRanking' | 'updateRankingParticipation'
  >,
) {
  let state = initialState;
  let requestGeneration = 0;
  const listeners = new Set<(next: StampRankingState) => void>();

  const setState = (patch: Partial<StampRankingState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const load = async (loggedIn: boolean): Promise<void> => {
    const generation = ++requestGeneration;
    setState({ loading: true, error: null });
    try {
      const [leaderboard, myRanking] = await Promise.all([
        repository.getLeaderboard(20),
        loggedIn ? repository.getMyRanking() : Promise.resolve(null),
      ]);
      if (generation !== requestGeneration) return;
      setState({ leaderboard, myRanking, loading: false });
    } catch (error) {
      if (generation !== requestGeneration) return;
      setState({ error, loading: false });
    }
  };

  return {
    getState: () => state,
    subscribe(listener: (next: StampRankingState) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    load,
    async update(participating: boolean): Promise<void> {
      setState({ mutationPending: true, error: null });
      try {
        const myRanking = await setStampRankingParticipation(participating, repository);
        setState({ myRanking, retryAfterSeconds: participating ? 0 : state.retryAfterSeconds });
        await load(true);
      } catch (error) {
        if (participating && isOnmaruApiError(error) && error.code === 'RATE_LIMITED') {
          const retryAfterSeconds = Number(error.details.retryAfterSeconds);
          setState({
            retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 0,
            error,
          });
        } else {
          setState({ error });
        }
        throw error;
      } finally {
        setState({ mutationPending: false });
      }
    },
    tickRetry(): void {
      if (state.retryAfterSeconds > 0) {
        setState({ retryAfterSeconds: state.retryAfterSeconds - 1 });
      }
    },
  };
}
