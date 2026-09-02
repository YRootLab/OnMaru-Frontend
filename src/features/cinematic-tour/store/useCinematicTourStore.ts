import { create } from 'zustand';
import { OdiiStoryItem, TourWaypoint } from '@/features/odii-audio/types/odii.types';
import { useMapStore } from '@/map/hooks/useMapStore';

interface CinematicTourState {
  isActive: boolean;
  story: OdiiStoryItem | null;
  activeWaypointIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSubtitle: string;
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
  currentPhotoTip: undefined,

  startTour: (story: OdiiStoryItem, initialWaypointIndex = 0) => {
    const waypoints = story.waypoints ?? [];
    const initialWp = waypoints[initialWaypointIndex];
    const playTimeSec = parseInt(story.playTime, 10) || 300;

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
      currentSubtitle: story.script.split('\n')[0] ?? '',
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

    // 대본 자막 싱크 계산
    const lines = story.script.split('\n').filter((l) => l.trim().length > 0);
    const step = state.duration / Math.max(1, lines.length);
    const lineIdx = Math.min(Math.floor(currentTime / step), lines.length - 1);

    set({
      currentTime,
      activeWaypointIndex: newWpIdx,
      currentSubtitle: lines[lineIdx] ?? '',
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
