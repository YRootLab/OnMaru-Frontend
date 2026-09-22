import { create } from 'zustand';
import { SorimaruStoryItem, ScriptLine } from '@/features/sorimaru-audio/types/sorimaru.types';
import { parseScriptToLines } from '@/features/sorimaru-audio/utils/scriptParser';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';
import { toast } from 'sonner';
import { hasAuthenticatedUser } from '@/features/auth/privateState';

interface SorimaruAudioState {
  currentStory: SorimaruStoryItem;
  availableStories: SorimaruStoryItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeScriptIndex: number;
  parsedScriptLines: ScriptLine[];
  selectedCategory: string;
  searchQuery: string;
  isBookmarked: boolean;
  savedStories: SorimaruStoryItem[];
  isPlayerExpanded: boolean;
  playbackRate: number;


  setAvailableStories: (stories: SorimaruStoryItem[]) => void;
  fetchRegionalSorimaruStories: (lng?: number, lat?: number) => Promise<void>;
  setCurrentStory: (story: SorimaruStoryItem) => void;
  selectStory: (story: SorimaruStoryItem) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setActiveScriptIndex: (index: number) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  toggleBookmark: () => void;
  hydrateSavedStories: () => void;
  toggleSavedStory: (story: SorimaruStoryItem) => void;
  removeSavedStory: (storyId: string) => void;
  setIsPlayerExpanded: (isExpanded: boolean) => void;
  setPlaybackRate: (rate: number) => void;


  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

const emptyStory: SorimaruStoryItem = {
  tid: '',
  tlid: '',
  stid: '',
  stlid: '',
  title: '온마루 공간 오디오',
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

export const useSorimaruAudioStore = create<SorimaruAudioState>((set, get) => ({
  currentStory: emptyStory,
  availableStories: [],
  isPlaying: false,
  currentTime: 0,
  duration: 300,
  activeScriptIndex: 0,
  parsedScriptLines: [],
  selectedCategory: '전체',
  searchQuery: '',
  isBookmarked: false,
  savedStories: [],
  isPlayerExpanded: false,
  playbackRate: 1.0,

  setAvailableStories: (availableStories: SorimaruStoryItem[]) => set({ availableStories }),

  fetchRegionalSorimaruStories: async (lng?: number, lat?: number) => {
    try {
      const keywords = ['한옥', '고택', '궁', '사찰', '마을'];
      const requests: Promise<SorimaruStoryItem[]>[] = [];

      if (lng && lat) {
        requests.push(sorimaruApiAdapter.getNearbyStories(String(lng), String(lat), 25000).catch(() => []));
      }

      for (const kw of keywords) {
        requests.push(sorimaruApiAdapter.getStoryList(undefined, kw).catch(() => []));
      }

      const results = await Promise.all(requests);
      const flattened = results.flat().filter((s) => Boolean(s.audioUrl));

      const seen = new Set<string>();
      const unique: SorimaruStoryItem[] = [];
      for (const story of flattened) {
        const key = story.stid || story.title;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(story);
        }
      }

      set({ availableStories: unique });
      if ((!get().currentStory || !get().currentStory.audioUrl) && unique.length > 0) {
        get().setCurrentStory(unique[0]);
      }
    } catch {

    }
  },

  setCurrentStory: (story: SorimaruStoryItem) => {
    if (!story.audioUrl?.trim()) return;
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


  selectStory: (story: SorimaruStoryItem) => {
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
  hydrateSavedStories: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('onmaru_saved_sorimaru_stories');
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) set({ savedStories: parsed });
    } catch {
      set({ savedStories: [] });
    }
  },
  toggleSavedStory: (story: SorimaruStoryItem) =>
    set((state) => {
      if (!hasAuthenticatedUser()) {
        toast.info('로그인해주세요.');
        return state;
      }
      const storyKey = story.stid || story.title;
      const alreadySaved = state.savedStories.some((saved) => (saved.stid || saved.title) === storyKey);
      const savedStories = alreadySaved
        ? state.savedStories.filter((saved) => (saved.stid || saved.title) !== storyKey)
        : [...state.savedStories, story];

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('onmaru_saved_sorimaru_stories', JSON.stringify(savedStories));
        } catch {

        }
      }
      return { savedStories };
    }),
  removeSavedStory: (storyId: string) =>
    set((state) => {
      const savedStories = state.savedStories.filter((saved) => saved.stid !== storyId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('onmaru_saved_sorimaru_stories', JSON.stringify(savedStories));
        } catch {

        }
      }
      return { savedStories };
    }),
  setIsPlayerExpanded: (isExpanded: boolean) => set({ isPlayerExpanded: isExpanded }),
  setPlaybackRate: (playbackRate: number) => set({ playbackRate }),

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
