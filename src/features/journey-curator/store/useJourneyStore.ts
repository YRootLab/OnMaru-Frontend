import { create } from 'zustand';
import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';
import type { HanokDoganEntry, NearbyAudioStory, NearbyFoodPlace } from '../types/enrichment.types';
import { JOURNEY_PLANS, MOOD_OPTIONS } from '../data/curatedJourneys';
import { fetchExplorationBoard } from '../api/explorationApi';

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


  explorationBoard: JourneyBoard | null;

  boardCreatedAt: string | null;
  isExploring: boolean;

  hanokDogan: HanokDoganEntry[];
  nearbyAudio: NearbyAudioStory[];
  nearbyFood: NearbyFoodPlace[];


  pinnedRefs: ResourceRef[];

  pendingProposal: PendingProposal | null;

  lastError: string | null;

  setQuery: (query: string) => void;
  selectMood: (moodId: MoodId) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  submitSearch: (customQuery?: string) => Promise<void>;
  refinePlan: (prompt: string) => Promise<void>;
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
  set({ isExploring: true });
  const result = await fetchExplorationBoard(query);
  set({
    isExploring: false,
    ...(result.ok
      ? {
          explorationBoard: result.board,
          boardCreatedAt: new Date().toISOString(),
          hanokDogan: result.hanokDogan,
          nearbyAudio: result.nearbyAudio,
          nearbyFood: result.nearbyFood,
          lastError: null,
        }
      : { lastError: result.message }),
  });
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  currentQuery: '',
  activeMood: null,
  hasSearched: false,
  selectedNodeId: null,
  currentPlan: JOURNEY_PLANS.quiet,
  isGenerating: false,
  explorationBoard: null,
  boardCreatedAt: null,
  isExploring: false,
  hanokDogan: [],
  nearbyAudio: [],
  nearbyFood: [],
  pinnedRefs: [],
  pendingProposal: null,
  lastError: null,

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
    const { explorationBoard, pinnedRefs } = get();
    if (!explorationBoard) return;

    set({ isGenerating: true, hasSearched: true, currentQuery: prompt, lastError: null });

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

      set({ isGenerating: false, lastError: result.ok ? '변경안을 만들지 못했어요.' : result.message });
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
    set({
      currentQuery: '',
      activeMood: null,
      hasSearched: false,
      selectedNodeId: null,
      isGenerating: false,
      explorationBoard: null,
      boardCreatedAt: null,
      isExploring: false,
      hanokDogan: [],
      nearbyAudio: [],
      nearbyFood: [],
      pinnedRefs: [],
      pendingProposal: null,
      lastError: null,
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
