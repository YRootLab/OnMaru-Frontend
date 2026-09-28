import { create } from 'zustand';
import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';
import type { HanokDoganEntry, NearbyAudioStory, NearbyFoodPlace } from '../types/enrichment.types';
import { JOURNEY_PLANS, MOOD_OPTIONS } from '../data/curatedJourneys';
import { defaultJourneyRepository } from '../api/journeyApi';

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


async function runInitialExploration(query: string, set: SetFn) {
  set({ isExploring: true, lastError: null });
  try {
    const accepted = await defaultJourneyRepository.start({
      query,
      idempotencyKey: `journey-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    });

    const snapshot = await defaultJourneyRepository.getExploration(accepted.explorationId);

    const unsubscribe = defaultJourneyRepository.subscribeToRunEvents(
      accepted.explorationId,
      accepted.runId,
      (frame) => {
        if (frame.event === 'run.terminal') {
          set({ isExploring: false });
        }
      },
      {
        onError: (err) => {
          console.warn('[SSE] error:', err);
        },
      },
    );

    set({
      isExploring: false,
      explorationId: accepted.explorationId,
      runId: accepted.runId,
      explorationBoard: snapshot.board as any,
      boardCreatedAt: new Date().toISOString(),
      lastError: null,
      unsubscribeSse: unsubscribe,
    });
  } catch (err) {
    set({
      isExploring: false,
      lastError: err instanceof Error ? err.message : '여정을 생성하지 못했어요.',
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
    const { explorationBoard, explorationId } = get();
    if (!explorationBoard || !explorationId) return;

    set({ isGenerating: true, hasSearched: true, currentQuery: prompt, lastError: null });

    try {
      await defaultJourneyRepository.submitTurn({
        explorationId,
        query: prompt,
        baseVersion: 1,
        clientTurnId: `turn-${Date.now()}`,
        idempotencyKey: `turn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      });

      const snapshot = await defaultJourneyRepository.getExploration(explorationId);
      set({
        isGenerating: false,
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
    } catch (err) {
      set({ isGenerating: false, lastError: err instanceof Error ? err.message : '변경안을 만들지 못했어요.' });
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
