import { create } from 'zustand';
import { OdiiStoryItem, TourWaypoint } from '@/features/odii-audio/types/odii.types';
import { useMapStore } from '@/features/map/hooks/useMapStore';

export function parseScriptSentences(script: string): string[] {
  if (!script) return [];
  // 1. 개행 및 특수문자 공백화
  const clean = script.replace(/\r?\n+/g, ' ').trim();
  // 2. 마침표(.), 물음표(?), 느낌표(!) 기준으로 문장 분할
  const rawSentences = clean.split(/(?<=[.?!])\s+/);
  const result: string[] = [];

  for (const item of rawSentences) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    // 50자 이상의 긴 문장은 쉼표(,) 기준으로 추가 분할하여 한 줄에 읽기 편하게 제공
    if (trimmed.length > 50 && trimmed.includes(',')) {
      const parts = trimmed.split(/,\s+/);
      result.push(...parts.map((p) => p.trim()).filter(Boolean));
    } else {
      result.push(trimmed);
    }
  }

  return result.length > 0 ? result : [clean];
}

/**
 * 문장별 글자 수 및 호흡 쉼표 가중치를 기반으로 현재 재생 시간(currentTime)에 일치하는 문장 인덱스를 정밀 계산
 */
export function calculateActiveSentenceIndex(
  sentences: string[],
  currentTime: number,
  duration: number,
): { index: number; sentence: string } {
  if (sentences.length === 0) return { index: 0, sentence: '' };
  if (sentences.length === 1) return { index: 0, sentence: sentences[0] };

  const validDuration = Math.max(1, duration);

  // 각 문장의 발화 예상 시간 가중치 계산 (글자수 + 문장 끝 쉼표/마침표 호흡 4글자분량 가중치)
  const weights = sentences.map((s) => Math.max(8, s.length + 4));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  // 누적 타임스탬프 계산
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
  story: OdiiStoryItem | null;
  activeWaypointIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSubtitle: string;
  activeSentenceIndex: number;
  totalSentences: number;
  currentPhotoTip?: string;

  // Actions
  startTour: (story: OdiiStoryItem, initialWaypointIndex?: number) => void;
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

  startTour: (story: OdiiStoryItem, initialWaypointIndex = 0) => {
    const waypoints = story.waypoints ?? [];
    const initialWp = waypoints[initialWaypointIndex];
    const playTimeSec = parseInt(story.playTime, 10) || 300;
    const sentences = parseScriptSentences(story.script);

    // 🌟 UX 최적화: 시네마틱 투어가 시작되면 화면을 가리는 상세 패널을 닫고
    // 지도의 비행 궤적(Glide Pan)과 동선이 한눈에 보이도록 전체 지도 뷰를 개방합니다.
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

    // 지도를 첫 번째 경유지로 즉시 부드럽게 이동
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

    // 현재 시간에 맞는 경유지 인덱스 찾기
    let newWpIdx = 0;
    for (let i = 0; i < waypoints.length; i++) {
      if (currentTime >= waypoints[i].timeSec) {
        newWpIdx = i;
      } else {
        break;
      }
    }

    // 경유지가 바뀌었으면 지도 카메라 자동 이동
    if (newWpIdx !== state.activeWaypointIndex && waypoints[newWpIdx]) {
      const targetWp = waypoints[newWpIdx];
      const map = useMapStore.getState().map;
      if (map && window.kakao?.maps) {
        map.setLevel(targetWp.zoomLevel ?? 2, { animate: true });
        map.panTo(new window.kakao.maps.LatLng(targetWp.lat, targetWp.lng));
      }
    }

    // 🌟 글자 수 가중치 기반 문장 싱크 정밀 계산
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
