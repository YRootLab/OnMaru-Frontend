import { create } from 'zustand';
import { OdiiStoryItem, ScriptLine } from '../types/odii.types';
import { parseScriptToLines } from '../utils/scriptParser';
import { odiiApiAdapter } from '../api/odiiApi';
import { NATIONWIDE_REGIONAL_ODII_STORIES } from '../data/regionalOdiiMaster';

interface OdiiAudioState {
  currentStory: OdiiStoryItem;
  availableStories: OdiiStoryItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeScriptIndex: number;
  parsedScriptLines: ScriptLine[];
  selectedCategory: string;
  searchQuery: string;
  isBookmarked: boolean;
  isPlayerExpanded: boolean;

  // Actions
  setAvailableStories: (stories: OdiiStoryItem[]) => void;
  fetchRegionalOdiiStories: (lng?: number, lat?: number) => Promise<void>;
  setCurrentStory: (story: OdiiStoryItem) => void;
  selectStory: (story: OdiiStoryItem) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setActiveScriptIndex: (index: number) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  toggleBookmark: () => void;
  setIsPlayerExpanded: (isExpanded: boolean) => void;
  
  // Audio Seek & Controls
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

const initialStory: OdiiStoryItem = NATIONWIDE_REGIONAL_ODII_STORIES[0];

export const useOdiiAudioStore = create<OdiiAudioState>((set, get) => ({
  currentStory: initialStory,
  availableStories: NATIONWIDE_REGIONAL_ODII_STORIES,
  isPlaying: false,
  currentTime: 0,
  duration: 360,
  activeScriptIndex: 0,
  parsedScriptLines: [],
  selectedCategory: '전체',
  searchQuery: '',
  isBookmarked: false,
  isPlayerExpanded: false,

  setAvailableStories: (availableStories: OdiiStoryItem[]) => set({ availableStories }),

  fetchRegionalOdiiStories: async (lng?: number, lat?: number) => {
    try {
      const [nearbyStories, generalStories] = await Promise.all([
        lng && lat
          ? odiiApiAdapter.getNearbyStories(String(lng), String(lat), 25000).catch(() => [])
          : Promise.resolve([]),
        odiiApiAdapter.getStoryList('한옥').catch(() => []),
      ]);

      const merged = [
        ...nearbyStories,
        ...NATIONWIDE_REGIONAL_ODII_STORIES,
        ...generalStories,
      ].filter((s) => Boolean(s.audioUrl));

      const seen = new Set<string>();
      const unique = merged.filter((s) => {
        const key = s.stid || s.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      set({ availableStories: unique });
    } catch {
      // 에러 발생 시에도 전국 마스터 데이터 유지
      set({ availableStories: NATIONWIDE_REGIONAL_ODII_STORIES });
    }
  },

  setCurrentStory: (story: OdiiStoryItem) => {
    const playTimeSec = parseInt(story.playTime, 10) || 300;
    const parsed = parseScriptToLines(story.script, playTimeSec);
    set({
      currentStory: story,
      currentTime: 0,
      duration: playTimeSec,
      activeScriptIndex: 0,
      parsedScriptLines: parsed,
      isPlaying: true,
    });
  },

  // 목록 탐색에서 쓰는 선택 액션: 재생은 명시적인 재생 버튼에서만 시작한다.
  selectStory: (story: OdiiStoryItem) => {
    const playTimeSec = parseInt(story.playTime, 10) || 300;
    const parsed = parseScriptToLines(story.script, playTimeSec);
    set({
      currentStory: story,
      currentTime: 0,
      duration: playTimeSec,
      activeScriptIndex: 0,
      parsedScriptLines: parsed,
      isPlaying: false,
    });
  },

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  
  setCurrentTime: (time: number) => {
    const state = get();
    const currentLines = state.parsedScriptLines;
    let newScriptIdx = 0;
    for (let i = 0; i < currentLines.length; i++) {
      if (time >= currentLines[i].timeSec) {
        newScriptIdx = i;
      } else {
        break;
      }
    }
    set({ currentTime: time, activeScriptIndex: newScriptIdx });
  },

  setDuration: (duration: number) => set({ duration }),
  setActiveScriptIndex: (index: number) => set({ activeScriptIndex: index }),
  setSelectedCategory: (selectedCategory: string) => set({ selectedCategory }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  toggleBookmark: () => set((state) => ({ isBookmarked: !state.isBookmarked })),
  setIsPlayerExpanded: (isPlayerExpanded: boolean) => set({ isPlayerExpanded }),

  skipForward: (seconds = 10) => {
    const state = get();
    const nextTime = Math.min(state.currentTime + seconds, state.duration);
    state.setCurrentTime(nextTime);
  },

  skipBackward: (seconds = 10) => {
    const state = get();
    const prevTime = Math.max(state.currentTime - seconds, 0);
    state.setCurrentTime(prevTime);
  },
}));
