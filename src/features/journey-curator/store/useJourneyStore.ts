import { create } from 'zustand';
import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';
import type { HanokDoganEntry, NearbyAudioStory, NearbyFoodPlace } from '../types/enrichment.types';
import { JOURNEY_PLANS, MOOD_OPTIONS } from '../data/curatedJourneys';
import { defaultJourneyRepository, type RunAccepted, type ExplorationSnapshot } from '../api/journeyApi';
import { fetchExplorationBoard } from '../api/explorationApi';
import { isOnmaruApiError } from '@/lib/api/errors';
import { USE_MOCK } from '@/lib/api/client';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function mapJourneyError(err: unknown): string {
  if (isOnmaruApiError(err)) {
    if (err.classification === 'RATE_LIMITED') {
      return '이번 달 AI 여정 횟수를 모두 사용하셨어요. (월 최대 2회)';
    }
    if (err.status === 401 || err.status === 403) {
      return '로그인이 필요해요.';
    }
    if (err.message) return err.message;
  }
  return err instanceof Error ? err.message : '여정을 생성하지 못했어요.';
}

interface EnrichmentBundle {
  hanokDogan: HanokDoganEntry[];
  nearbyAudio: NearbyAudioStory[];
  nearbyFood: NearbyFoodPlace[];
}

interface PendingProposal extends EnrichmentBundle {
  board: JourneyBoard;
  keptRefs: ResourceRef[];
  addedRefs: ResourceRef[];
  removedRefs: ResourceRef[];
}

interface JourneyState {
  currentQuery: string;

  activeMood: MoodId | null;

  hasSearched: boolean;
  selectedNodeId: string | null;
  currentPlan: BentoJourneyPlan;
  isGenerating: boolean;

  explorationId: string | null;
  runId: string | null;
  stateVersion: number;

  explorationBoard: JourneyBoard | null;

  boardCreatedAt: string | null;
  isExploring: boolean;

  hanokDogan: HanokDoganEntry[];
  nearbyAudio: NearbyAudioStory[];
  nearbyFood: NearbyFoodPlace[];


  pinnedRefs: ResourceRef[];

  pendingProposal: PendingProposal | null;

  lastError: string | null;

  unsubscribeSse: (() => void) | null;

  setQuery: (query: string) => void;
  selectMood: (moodId: MoodId) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  submitSearch: (customQuery?: string) => Promise<void>;
  refinePlan: (prompt: string) => Promise<void>;
  cancelRun: () => Promise<void>;
  togglePin: (ref: ResourceRef) => void;
  applyProposal: () => void;
  dismissProposal: () => void;
  resetJourney: () => void;

  hydrateBoard: (
    board: JourneyBoard,
    pinnedRefs: ResourceRef[],
    enrichment: EnrichmentBundle,
    createdAt?: string,
  ) => void;
}

type SetFn = (partial: Partial<JourneyState>) => void;

function runWithSse(accepted: RunAccepted, set: SetFn, timeoutMs = 15000): Promise<ExplorationSnapshot> {
  return new Promise((resolve, reject) => {
    let reconnected = false;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      unsubscribe?.();
      unsubscribe = null;
      set({ unsubscribeSse: null });
    };

    const fetchAndResolve = async () => {
      cleanup();
      try {
        resolve(await defaultJourneyRepository.getExploration(accepted.explorationId));
      } catch (err) {
        reject(err);
      }
    };

    timer = setTimeout(() => {
      if (cancelled) return;
      console.warn('[SSE] Connection timed out after', timeoutMs, 'ms; attempting direct fetch');
      fetchAndResolve();
    }, timeoutMs);

    const doSubscribe = () => {
      unsubscribe = defaultJourneyRepository.subscribeToRunEvents(
        accepted.explorationId,
        accepted.runId,
        (frame) => {
          if (frame.event === 'run.terminal' || frame.event === 'reset') {
            fetchAndResolve();
          } else if (frame.event === 'auth_closed') {
            cleanup();
            reject(new Error('AUTH_CLOSED'));
          }
        },
        {
          onError: async () => {
            if (cancelled) return;
            if (!reconnected) {
              reconnected = true;
              unsubscribe?.();
              unsubscribe = null;
              await sleep(1000);
              if (!cancelled) doSubscribe();
            } else {
              fetchAndResolve();
            }
          },
        },
      );
      set({ unsubscribeSse: unsubscribe });
    };

    doSubscribe();
  });
}

async function runInitialExploration(query: string, set: SetFn) {
  set({ isExploring: true, lastError: null });

  if (!USE_MOCK) {
    try {
      const accepted = await defaultJourneyRepository.start({
        query,
        idempotencyKey: `journey-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      });
      set({ explorationId: accepted.explorationId, runId: accepted.runId });

      const snapshot = await runWithSse(accepted, set);
      set({
        isExploring: false,
        explorationBoard: snapshot.board as any,
        boardCreatedAt: new Date().toISOString(),
        stateVersion: snapshot.stateVersion,
        lastError: null,
      });
      return;
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_CLOSED') {
        set({ isExploring: false, lastError: '로그인이 필요해요.' });
        return;
      }
      console.warn('[runInitialExploration] Backend exploration failed, falling back to local explore:', err);
    }
  }

  try {
    const result = await fetchExplorationBoard(query);
    if (result.ok) {
      set({
        isExploring: false,
        explorationBoard: result.board,
        boardCreatedAt: new Date().toISOString(),
        hanokDogan: result.hanokDogan,
        nearbyAudio: result.nearbyAudio,
        nearbyFood: result.nearbyFood,
        lastError: null,
      });
    } else {
      set({
        isExploring: false,
        lastError: result.message,
      });
    }
  } catch (err) {
    set({
      isExploring: false,
      lastError: mapJourneyError(err),
    });
  }
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  currentQuery: '',
  activeMood: null,
  hasSearched: false,
  selectedNodeId: null,
  currentPlan: JOURNEY_PLANS.quiet,
  isGenerating: false,
  explorationId: null,
  runId: null,
  stateVersion: 0,
  explorationBoard: null,
  boardCreatedAt: null,
  isExploring: false,
  hanokDogan: [],
  nearbyAudio: [],
  nearbyFood: [],
  pinnedRefs: [],
  pendingProposal: null,
  lastError: null,
  unsubscribeSse: null,

  setQuery: (query) => set({ currentQuery: query }),

  selectMood: async (moodId) => {
    const option = MOOD_OPTIONS.find((m) => m.id === moodId);
    const query = option?.query || option?.label || '';
    const fallback = JOURNEY_PLANS[moodId] || JOURNEY_PLANS.quiet;

    set({
      activeMood: moodId,
      currentQuery: query,
      selectedNodeId: null,
      isGenerating: true,
      hasSearched: true,
      pinnedRefs: [],
      pendingProposal: null,
      lastError: null,
      currentPlan: fallback,
    });

    await runInitialExploration(query, set);
    set({ isGenerating: false });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  submitSearch: async (customQuery) => {
    const query = customQuery ?? get().currentQuery;
    if (!query.trim()) return;

    set({
      isGenerating: true,
      selectedNodeId: null,
      hasSearched: true,
      pinnedRefs: [],
      pendingProposal: null,
      lastError: null,
    });

    await runInitialExploration(query, set);
    set({ isGenerating: false });
  },





  refinePlan: async (prompt) => {
    if (!prompt.trim()) return;
    const { explorationBoard, explorationId, stateVersion, pinnedRefs } = get();
    if (!explorationBoard) return;

    set({ isGenerating: true, hasSearched: true, currentQuery: prompt, lastError: null });

    if (!USE_MOCK && explorationId) {
      try {
        const accepted = await defaultJourneyRepository.submitTurn({
          explorationId,
          query: prompt,
          baseVersion: stateVersion,
          clientTurnId: `turn-${Date.now()}`,
          idempotencyKey: `turn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        });

        const snapshot = await runWithSse(accepted, set);
        set({
          isGenerating: false,
          stateVersion: snapshot.stateVersion,
          pendingProposal: snapshot.pendingProposal
            ? {
                board: (snapshot.board as any) || explorationBoard,
                hanokDogan: [],
                nearbyAudio: [],
                nearbyFood: [],
                keptRefs: snapshot.pendingProposal.kept.map((id) => ({ id, type: 'PLACE' as const })),
                addedRefs: snapshot.pendingProposal.added.map((id) => ({ id, type: 'PLACE' as const })),
                removedRefs: snapshot.pendingProposal.excluded.map((id) => ({ id, type: 'PLACE' as const })),
              }
            : null,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.message === 'AUTH_CLOSED') {
          set({
            isGenerating: false,
            lastError: '로그인이 필요해요.',
          });
          return;
        }
        console.warn('[refinePlan] Backend refine failed, falling back to local explore:', err);
      }
    }

    try {
      const pinnedPlaces = explorationBoard.resources.filter(
        (r): r is PlaceResource => r.ref.type === 'PLACE' && pinnedRefs.some((p) => p.id === r.ref.id),
      );
      const previousPlaceIds = explorationBoard.candidates.map((c) => c.placeRef.id);
      const previousRegionId = explorationBoard.regionRef.id;

      const result = await fetchExplorationBoard(prompt, { pinnedPlaces, previousPlaceIds, previousRegionId });

      if (result.ok && result.diff) {
        set({
          isGenerating: false,
          pendingProposal: {
            board: result.board,
            hanokDogan: result.hanokDogan,
            nearbyAudio: result.nearbyAudio,
            nearbyFood: result.nearbyFood,
            keptRefs: result.diff.keptRefs,
            addedRefs: result.diff.addedRefs,
            removedRefs: result.diff.removedRefs,
          },
        });
      } else {
        set({
          isGenerating: false,
          lastError: result.ok ? '변경안을 만들지 못했어요.' : result.message,
        });
      }
    } catch (err) {
      set({
        isGenerating: false,
        lastError: mapJourneyError(err),
      });
    }
  },

  cancelRun: async () => {
    const { explorationId, runId } = get();
    if (!explorationId || !runId) return;

    try {
      await defaultJourneyRepository.cancelRun(explorationId, runId);
      set({ isGenerating: false, explorationBoard: null });
    } catch (err) {
      set({ lastError: err instanceof Error ? err.message : '취소하지 못했어요.' });
    }
  },

  togglePin: (ref) => {
    const { pinnedRefs } = get();
    const exists = pinnedRefs.some((r) => r.id === ref.id);
    set({ pinnedRefs: exists ? pinnedRefs.filter((r) => r.id !== ref.id) : [...pinnedRefs, ref] });
  },

  applyProposal: () => {
    const { pendingProposal } = get();
    if (!pendingProposal) return;
    set({
      explorationBoard: pendingProposal.board,
      boardCreatedAt: new Date().toISOString(),
      hanokDogan: pendingProposal.hanokDogan,
      nearbyAudio: pendingProposal.nearbyAudio,
      nearbyFood: pendingProposal.nearbyFood,
      pendingProposal: null,
    });
  },

  dismissProposal: () => set({ pendingProposal: null }),

  resetJourney: () => {
    const { unsubscribeSse } = get();
    unsubscribeSse?.();
    set({
      currentQuery: '',
      activeMood: null,
      hasSearched: false,
      selectedNodeId: null,
      isGenerating: false,
      explorationId: null,
      runId: null,
      stateVersion: 0,
      explorationBoard: null,
      boardCreatedAt: null,
      isExploring: false,
      hanokDogan: [],
      nearbyAudio: [],
      nearbyFood: [],
      pinnedRefs: [],
      pendingProposal: null,
      lastError: null,
      unsubscribeSse: null,
    });
  },

  hydrateBoard: (board, pinnedRefs, enrichment, createdAt) => {
    set({
      explorationBoard: board,
      boardCreatedAt: createdAt ?? new Date().toISOString(),
      pinnedRefs,
      hanokDogan: enrichment.hanokDogan,
      nearbyAudio: enrichment.nearbyAudio,
      nearbyFood: enrichment.nearbyFood,
      hasSearched: true,
      pendingProposal: null,
      lastError: null,
    });
  },
}));
