import { create } from 'zustand';
import { SorimaruStoryItem, TourWaypoint } from '@/features/sorimaru-audio/types/sorimaru.types';
import { useMapStore } from '@/features/map/hooks/useMapStore';

export function parseScriptSentences(script: string): string[] {
  if (!script) return [];

  const clean = script.replace(/\r?\n+/g, ' ').trim();

  const rawSentences = clean.split(/(?<=[.?!])\s+/);
  const result: string[] = [];

  for (const item of rawSentences) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    if (trimmed.length > 50 && trimmed.includes(',')) {
      const parts = trimmed.split(/,\s+/);
      result.push(...parts.map((p) => p.trim()).filter(Boolean));
    } else {
      result.push(trimmed);
    }
  }

  return result.length > 0 ? result : [clean];
}




export function calculateActiveSentenceIndex(
  sentences: string[],
  currentTime: number,
  duration: number,
): { index: number; sentence: string } {
  if (sentences.length === 0) return { index: 0, sentence: '' };
  if (sentences.length === 1) return { index: 0, sentence: sentences[0] };

  const validDuration = Math.max(1, duration);


  const weights = sentences.map((s) => Math.max(8, s.length + 4));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);


  let accumulatedTime = 0;
  for (let i = 0; i < sentences.length; i++) {
    const sentenceDuration = (weights[i] / totalWeight) * validDuration;
    accumulatedTime += sentenceDuration;
    if (currentTime < accumulatedTime) {
      return { index: i, sentence: sentences[i] };
    }
  }

  const lastIndex = sentences.length - 1;
  return { index: lastIndex, sentence: sentences[lastIndex] };
}

interface CinematicTourState {
  isActive: boolean;
  story: SorimaruStoryItem | null;
  activeWaypointIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSubtitle: string;
  activeSentenceIndex: number;
  totalSentences: number;
  currentPhotoTip?: string;


  startTour: (story: SorimaruStoryItem, initialWaypointIndex?: number) => void;
  stopTour: () => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (currentTime: number) => void;
  jumpToWaypoint: (index: number) => void;
  nextWaypoint: () => void;
  prevWaypoint: () => void;
}

export const useCinematicTourStore = create<CinematicTourState>((set, get) => ({
  isActive: false,
  story: null,
  activeWaypointIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 300,
  currentSubtitle: '',
  activeSentenceIndex: 0,
  totalSentences: 0,
  currentPhotoTip: undefined,

  startTour: (story: SorimaruStoryItem, initialWaypointIndex = 0) => {
    const waypoints = story.waypoints ?? [];
    const initialWp = waypoints[initialWaypointIndex];
    const playTimeSec = parseInt(story.playTime, 10) || 300;
    const sentences = parseScriptSentences(story.script);



    const mapStore = useMapStore.getState();
    mapStore.setDetailId(null);
    mapStore.setSheetSnap('peek');

    set({
      isActive: true,
      story,
      activeWaypointIndex: initialWaypointIndex,
      isPlaying: true,
      currentTime: initialWp?.timeSec ?? 0,
      duration: playTimeSec,
      currentSubtitle: sentences[0] ?? story.audioTitle,
      activeSentenceIndex: 0,
      totalSentences: sentences.length,
      currentPhotoTip: initialWp?.photoTip,
    });


    if (initialWp) {
      const map = mapStore.map;
      if (map && window.kakao?.maps) {
        map.setLevel(initialWp.zoomLevel ?? 2, { animate: true });
        map.panTo(new window.kakao.maps.LatLng(initialWp.lat, initialWp.lng));
      }
    }
  },

  stopTour: () => {
    set({
      isActive: false,
      isPlaying: false,
      story: null,
      currentTime: 0,
      activeWaypointIndex: 0,
      currentSubtitle: '',
      activeSentenceIndex: 0,
      totalSentences: 0,
      currentPhotoTip: undefined,
    });
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  setCurrentTime: (currentTime: number) => {
    const state = get();
    const story = state.story;
    if (!story) return;

    const waypoints = story.waypoints ?? [];


    let newWpIdx = 0;
    for (let i = 0; i < waypoints.length; i++) {
      if (currentTime >= waypoints[i].timeSec) {
        newWpIdx = i;
      } else {
        break;
      }
    }


    if (newWpIdx !== state.activeWaypointIndex && waypoints[newWpIdx]) {
      const targetWp = waypoints[newWpIdx];
      const map = useMapStore.getState().map;
      if (map && window.kakao?.maps) {
        map.setLevel(targetWp.zoomLevel ?? 2, { animate: true });
        map.panTo(new window.kakao.maps.LatLng(targetWp.lat, targetWp.lng));
      }
    }


    const sentences = parseScriptSentences(story.script);
    const { index: sentenceIdx, sentence: activeSentence } = calculateActiveSentenceIndex(
      sentences,
      currentTime,
      state.duration,
    );

    set({
      currentTime,
      activeWaypointIndex: newWpIdx,
      currentSubtitle: activeSentence,
      activeSentenceIndex: sentenceIdx,
      totalSentences: sentences.length,
      currentPhotoTip: waypoints[newWpIdx]?.photoTip,
    });
  },

  jumpToWaypoint: (index: number) => {
    const state = get();
    const waypoints = state.story?.waypoints ?? [];
    const targetWp = waypoints[index];
    if (!targetWp) return;

    const map = useMapStore.getState().map;
    if (map && window.kakao?.maps) {
      map.setLevel(targetWp.zoomLevel ?? 2, { animate: true });
      map.panTo(new window.kakao.maps.LatLng(targetWp.lat, targetWp.lng));
    }

    set({
      activeWaypointIndex: index,
      currentTime: targetWp.timeSec,
      currentPhotoTip: targetWp.photoTip,
      isPlaying: true,
    });
  },

  nextWaypoint: () => {
    const state = get();
    const waypoints = state.story?.waypoints ?? [];
    if (state.activeWaypointIndex < waypoints.length - 1) {
      state.jumpToWaypoint(state.activeWaypointIndex + 1);
    }
  },

  prevWaypoint: () => {
    const state = get();
    if (state.activeWaypointIndex > 0) {
      state.jumpToWaypoint(state.activeWaypointIndex - 1);
    }
  },
}));
