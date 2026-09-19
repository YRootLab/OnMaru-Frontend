import { create } from 'zustand';
import type { BentoJourneyPlan, SavedJourney } from '../types/journey.types';

const STORAGE_KEY = 'onmaru_saved_journeys';

interface SavedJourneyState {
  savedJourneys: SavedJourney[];
  isLoaded: boolean;
  loadSaved: () => void;
  saveJourney: (plan: BentoJourneyPlan) => void;
  removeJourney: (id: string) => void;
  isSaved: (planId: string, title?: string) => boolean;
}

export const useSavedJourneyStore = create<SavedJourneyState>((set, get) => ({
  savedJourneys: [],
  isLoaded: false,

  loadSaved: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          set({ savedJourneys: parsed, isLoaded: true });
          return;
        }
      }
    } catch (e) {
      console.warn('[useSavedJourneyStore] Failed to load saved journeys:', e);
    }
    set({ savedJourneys: [], isLoaded: true });
  },

  saveJourney: (plan: BentoJourneyPlan) => {
    const { savedJourneys } = get();
    // 이미 같은 ID나 제목의 여정이 있으면 중복 추가 방지
    const exists = savedJourneys.some(
      (item) => item.plan.id === plan.id || item.plan.title === plan.title,
    );
    if (exists) return;

    const newEntry: SavedJourney = {
      id: plan.id || `saved-${Date.now()}`,
      savedAt: new Date().toISOString(),
      plan,
    };

    const next = [newEntry, ...savedJourneys];
    set({ savedJourneys: next });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  },

  removeJourney: (id: string) => {
    const { savedJourneys } = get();
    const next = savedJourneys.filter(
      (item) => item.id !== id && item.plan.id !== id && item.plan.title !== id,
    );
    set({ savedJourneys: next });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  },

  isSaved: (planId: string, title?: string) => {
    const { savedJourneys } = get();
    return savedJourneys.some(
      (item) =>
        item.id === planId ||
        item.plan.id === planId ||
        (title && item.plan.title === title),
    );
  },
}));
