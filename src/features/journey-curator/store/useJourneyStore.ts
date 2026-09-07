import { create } from 'zustand';
import type { BentoJourneyPlan, MoodId } from '../types/journey.types';
import { JOURNEY_PLANS, matchJourneyPlan, MOOD_OPTIONS } from '../data/curatedJourneys';

interface JourneyState {
  currentQuery: string;
  activeMood: MoodId;
  selectedNodeId: string | null;
  currentPlan: BentoJourneyPlan;
  isGenerating: boolean;

  setQuery: (query: string) => void;
  selectMood: (moodId: MoodId) => void;
  selectNode: (nodeId: string | null) => void;
  submitSearch: (customQuery?: string) => Promise<void>;
  refinePlan: (prompt: string) => Promise<void>;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  currentQuery: '사람이 붐비지 않고 고즈넉하게 한옥 골목을 산책할 수 있는 곳',
  activeMood: 'quiet',
  selectedNodeId: null,
  currentPlan: JOURNEY_PLANS.quiet,
  isGenerating: false,

  setQuery: (query) => set({ currentQuery: query }),

  selectMood: (moodId) => {
    const option = MOOD_OPTIONS.find((m) => m.id === moodId);
    const plan = JOURNEY_PLANS[moodId] || JOURNEY_PLANS.quiet;
    set({
      activeMood: moodId,
      currentQuery: option?.query || '',
      selectedNodeId: null,
      isGenerating: true,
    });

    setTimeout(() => {
      set({
        currentPlan: plan,
        isGenerating: false,
      });
    }, 280);
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  submitSearch: async (customQuery) => {
    const query = customQuery ?? get().currentQuery;
    if (!query.trim()) return;

    set({ isGenerating: true, selectedNodeId: null });

    // 실시간 AI 쿼리 분석 및 그래프 노드 매핑 연출 (280ms)
    setTimeout(() => {
      const matched = matchJourneyPlan(query);
      set({
        currentPlan: matched,
        activeMood: (matched.id as MoodId) || 'quiet',
        isGenerating: false,
      });
    }, 320);
  },

  refinePlan: async (prompt) => {
    if (!prompt.trim()) return;
    set({ isGenerating: true });

    setTimeout(() => {
      const matched = matchJourneyPlan(prompt);
      set({
        currentPlan: matched,
        activeMood: (matched.id as MoodId) || 'quiet',
        currentQuery: prompt,
        isGenerating: false,
      });
    }, 320);
  },
}));
