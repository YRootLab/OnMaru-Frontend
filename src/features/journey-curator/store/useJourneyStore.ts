import { create } from 'zustand';
import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import { JOURNEY_PLANS, MOOD_OPTIONS } from '../data/curatedJourneys';
import { fetchCuratedJourney } from '../api/journeyCuratorApi';

interface JourneyState {
  currentQuery: string;
  /** 아직 아무것도 검색하지 않았으면 null. 무드 칩도 눌리지 않은 상태다. */
  activeMood: MoodId | null;
  /** 한 번이라도 검색했는가. 홈은 검색 전에는 검색창만 보여준다. */
  hasSearched: boolean;
  selectedNodeId: string | null;
  currentPlan: BentoJourneyPlan;
  isGenerating: boolean;

  setQuery: (query: string) => void;
  selectMood: (moodId: MoodId) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  submitSearch: (customQuery?: string) => Promise<void>;
  refinePlan: (prompt: string) => Promise<void>;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  currentQuery: '',
  activeMood: null,
  hasSearched: false,
  selectedNodeId: null,
  currentPlan: JOURNEY_PLANS.quiet,
  isGenerating: false,

  setQuery: (query) => set({ currentQuery: query }),

  selectMood: async (moodId) => {
    const option = MOOD_OPTIONS.find((m) => m.id === moodId);
    const query = option?.query || option?.label || '';
    const initialFallback = JOURNEY_PLANS[moodId] || JOURNEY_PLANS.quiet;

    set({
      activeMood: moodId,
      currentQuery: query,
      selectedNodeId: null,
      isGenerating: true,
      hasSearched: true,
    });

    try {
      const plan = await fetchCuratedJourney({ query, mood: moodId });
      set({
        currentPlan: plan,
        isGenerating: false,
      });
    } catch {
      set({
        currentPlan: initialFallback,
        isGenerating: false,
      });
    }
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  submitSearch: async (customQuery) => {
    const query = customQuery ?? get().currentQuery;
    if (!query.trim()) return;

    set({ isGenerating: true, selectedNodeId: null, hasSearched: true });

    try {
      const plan = await fetchCuratedJourney({ query });
      set({
        currentPlan: plan,
        activeMood: (plan.id as MoodId) || null,
        isGenerating: false,
      });
    } catch {
      set({ isGenerating: false });
    }
  },

  refinePlan: async (prompt) => {
    if (!prompt.trim()) return;
    const currentPlan = get().currentPlan;
    set({ isGenerating: true, hasSearched: true });

    try {
      const plan = await fetchCuratedJourney({ query: prompt, previousPlan: currentPlan });
      set({
        currentPlan: plan,
        currentQuery: prompt,
        isGenerating: false,
      });
    } catch {
      set({ isGenerating: false });
    }
  },
}));
