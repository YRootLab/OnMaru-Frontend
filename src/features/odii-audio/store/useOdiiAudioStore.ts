import { create } from 'zustand';
import { OdiiStoryItem, ScriptLine } from '../types/odii.types';
import { parseScriptToLines } from '../utils/scriptParser';

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
  isPlayerExpanded: boolean;

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
  setIsPlayerExpanded: (isExpanded: boolean) => void;
  
  // Audio Seek & Controls
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

const initialStory: OdiiStoryItem = {
  tid: '',
  tlid: '',
  stid: '',
  stlid: '',
  title: '온마루 오디오 해설',
  audioTitle: '한국의 문화유산 이야기',
  speaker: '문화해설사 도슨트',
  category: '한옥',
  mapX: '126.9780',
  mapY: '37.5665',
  script: '장소에 머무는 시간을 소리로 만나보세요.',
  playTime: '300',
  audioUrl: '',
  imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
};

export const useOdiiAudioStore = create<OdiiAudioState>((set, get) => ({
  currentStory: initialStory,
  isPlaying: false,
  currentTime: 0,
  duration: 300,
  activeScriptIndex: 0,
  parsedScriptLines: [],
  selectedCategory: '전체',
  searchQuery: '',
  isBookmarked: false,
  isPlayerExpanded: false,

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
