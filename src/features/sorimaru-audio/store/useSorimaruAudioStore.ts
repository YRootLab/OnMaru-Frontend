import { create } from 'zustand';
import { ScriptLine } from '@/features/sorimaru-audio/types/sorimaru.types';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';
import type { SorimaruRepository } from '@/features/sorimaru-audio/application/SorimaruRepository';
import type { SorimaruStoryDetail, SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { parseScriptToLines } from '@/features/sorimaru-audio/utils/scriptParser';
import { toast } from 'sonner';
import { hasAuthenticatedUser } from '@/features/auth/privateState';
import { saveOdiiStory, unsaveOdiiStory } from '@/features/sorimaru-audio/api/odiiEngagementApi';
import { defaultSavedResourcesRepository } from '@/features/saved-resources/api/savedResourcesApi';

interface SorimaruAudioState {
  currentStory: SorimaruStoryDetail | null;
  availableStories: SorimaruStorySummary[];
  detailById: Record<string, SorimaruStoryDetail>;
  detailStatusById: Record<string, 'loading' | 'success' | 'error'>;
  detailErrorById: Record<string, unknown>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeScriptIndex: number;
  parsedScriptLines: ScriptLine[];
  selectedCategory: string;
  searchQuery: string;
  isBookmarked: boolean;
  savedStories: SorimaruStorySummary[];
  isPlayerExpanded: boolean;
  playbackRate: number;


  setAvailableStories: (stories: SorimaruStorySummary[]) => void;
  selectAndLoadStory: (
    summary: Pick<SorimaruStorySummary, 'storyId'>,
    intent?: 'select' | 'play',
    repository?: SorimaruRepository,
    owner?: symbol,
  ) => Promise<SorimaruStoryDetail | void>;
  cancelPendingDetailSelection: (owner: symbol) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setActiveScriptIndex: (index: number) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  toggleBookmark: () => void;
  hydrateSavedStories: () => Promise<void>;
  toggleSavedStory: (story: SorimaruStorySummary) => void;
  removeSavedStory: (storyId: string) => void;
  setIsPlayerExpanded: (isExpanded: boolean) => void;
  setPlaybackRate: (rate: number) => void;


  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

export const useSorimaruAudioStore = create<SorimaruAudioState>((set, get) => {
  const pendingDetails = new Map<string, Promise<SorimaruStoryDetail>>();
  let selectionGeneration = 0;
  let activeSelectionOwner: symbol | null = null;

  return ({
  currentStory: null,
  availableStories: [],
  detailById: {},
  detailStatusById: {},
  detailErrorById: {},
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

  setAvailableStories: (availableStories) => set({ availableStories }),

  selectAndLoadStory: async (summary, intent = 'select', repository = sorimaruApiAdapter, owner) => {
    const storyId = summary.storyId;
    const generation = ++selectionGeneration;
    activeSelectionOwner = owner ?? null;
    let detail = get().detailById[storyId];

    if (!detail) {
      let request = pendingDetails.get(storyId);
      if (!request) {
        set((state) => ({
          detailStatusById: { ...state.detailStatusById, [storyId]: 'loading' },
          detailErrorById: { ...state.detailErrorById, [storyId]: undefined },
        }));
        request = repository.getStoryDetail(storyId, 'ko-KR');
        pendingDetails.set(storyId, request);
        void request.finally(() => {
          if (pendingDetails.get(storyId) === request) pendingDetails.delete(storyId);
        }).catch(() => undefined);
      }
      try {
        detail = await request;
        set((state) => ({
          detailById: { ...state.detailById, [storyId]: detail },
          detailStatusById: { ...state.detailStatusById, [storyId]: 'success' },
          detailErrorById: { ...state.detailErrorById, [storyId]: undefined },
        }));
      } catch (error) {
        set((state) => ({
          detailStatusById: { ...state.detailStatusById, [storyId]: 'error' },
          detailErrorById: { ...state.detailErrorById, [storyId]: error },
        }));
        throw error;
      }
    }

    if (generation !== selectionGeneration) return;
    const transcriptLines: Array<{ text: string; timeSec?: number }> = [];
    for (const line of detail.transcript) {
      if (line.startTimeSeconds === undefined) {
        transcriptLines.push(...parseScriptToLines(line.text, detail.durationSeconds).map(({ text }) => ({ text })));
      } else {
        transcriptLines.push({ text: line.text, timeSec: line.startTimeSeconds });
      }
    }
    const timeStep = Math.max(1, detail.durationSeconds / transcriptLines.length);
    set({
      currentStory: detail,
      currentTime: 0,
      duration: detail.durationSeconds,
      activeScriptIndex: 0,
      parsedScriptLines: transcriptLines.map((line, index) => ({
        id: index + 1,
        timeSec: line.timeSec ?? Math.floor(index * timeStep),
        text: line.text,
      })),
      isPlaying: intent === 'play',
    });
    return detail;
  },
  cancelPendingDetailSelection: (owner) => {
    if (activeSelectionOwner !== owner) return;
    selectionGeneration += 1;
    activeSelectionOwner = null;
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
  hydrateSavedStories: async () => {
    if (!hasAuthenticatedUser()) {
      set({ savedStories: [] });
      return;
    }
    try {
      const response = await defaultSavedResourcesRepository.listOdiiStories({ limit: 50 });
      set({ savedStories: response.items.map((item) => ({
        storyId: item.storyId,
        title: item.title,
        audioTitle: item.title,
        category: '소리 이야기',
        region: { regionCode: '', name: '', level: '', parentRegionCode: null },
        coordinates: null,
        durationSeconds: item.durationSeconds ?? 0,
        imageUrl: null,
        linkedPlaceId: item.placeId,
        contentTags: [],
        savedByMe: true,
      })) });
    } catch {
      set({ savedStories: [] });
    }
  },
  toggleSavedStory: (story: SorimaruStorySummary) => {
    const state = get();
      if (!hasAuthenticatedUser()) {
        toast.info('로그인해주세요.');
        return;
      }
      const storyKey = story.storyId;
      const alreadySaved = state.savedStories.some((saved) => saved.storyId === storyKey);
      const savedStories = alreadySaved
        ? state.savedStories.filter((saved) => saved.storyId !== storyKey)
        : [...state.savedStories, story];
      set({ savedStories });
      const request = alreadySaved ? unsaveOdiiStory(storyKey) : saveOdiiStory(storyKey);
      void request.catch(() => {
        set({ savedStories: state.savedStories });
        toast.error('찜 상태를 저장하지 못했습니다.');
      });
  },
  removeSavedStory: (storyId: string) => {
    const previous = get().savedStories;
    set({ savedStories: previous.filter((saved) => saved.storyId !== storyId) });
    void unsaveOdiiStory(storyId).catch(() => {
      set({ savedStories: previous });
      toast.error('찜 상태를 저장하지 못했습니다.');
    });
  },
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
  });
});
