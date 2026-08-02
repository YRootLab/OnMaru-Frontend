import { create } from 'zustand';
import { OdiiStoryItem, ScriptLine } from '../types/odii.types';
import { MOCK_ODII_STORIES, parseScriptToLines } from '../api/odiiMockData';

interface OdiiAudioState {
  currentStory: OdiiStoryItem;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeScriptIndex: number;
  parsedScriptLines: ScriptLine[];
  selectedCategory: string;
  searchQuery: string;
  isBookmarked: boolean;

  // Actions
  setCurrentStory: (story: OdiiStoryItem) => void;
  selectStory: (story: OdiiStoryItem) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setActiveScriptIndex: (index: number) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  toggleBookmark: () => void;
  
  // Audio Seek & Controls
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

const initialStory = MOCK_ODII_STORIES[0];
const initialParsedScript = parseScriptToLines(
  initialStory.script,
  parseInt(initialStory.playTime, 10) || 494
);

export const useOdiiAudioStore = create<OdiiAudioState>((set, get) => ({
  currentStory: initialStory,
  isPlaying: false,
  currentTime: 0,
  duration: parseInt(initialStory.playTime, 10) || 494,
  activeScriptIndex: 0,
  parsedScriptLines: initialParsedScript,
  selectedCategory: '전체',
  searchQuery: '',
  isBookmarked: false,

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
