import { create } from 'zustand';
import { STAGES } from '../data/hanok.data';

export interface HanokViewerState {
  activeSectionId: string;
  activeStageIndex: number;
  scrollProgress: number;
  stageProgress: number;

  // 히어로 섹션 전역 상태 정의
  isLoaded: boolean;
  isReducedMotion: boolean;
  heroTime: number;
  heroSequenceComplete: boolean;

  // 개발자 툴 및 카메라 제어 상태 정의
  isOrbitEnabled: boolean;
  customTarget: [number, number, number] | null;
  camPos: [number, number, number];
  camTarget: [number, number, number];
  camFov: number;

  // 상태 변경 액션 정의
  setActiveSectionId: (id: string) => void;
  setActiveStageIndex: (index: number) => void;
  setScrollProgress: (p: number) => void;
  setStageProgress: (p: number) => void;
  setIsLoaded: (loaded: boolean) => void;
  setIsReducedMotion: (val: boolean) => void;
  setHeroTime: (t: number) => void;
  setHeroSequenceComplete: (complete: boolean) => void;
  setIsOrbitEnabled: (enabled: boolean) => void;
  setCustomTarget: (target: [number, number, number] | null) => void;
  setCameraInfo: (pos: [number, number, number], target: [number, number, number], fov: number) => void;
}

export const useHanokViewerStore = create<HanokViewerState>((set) => ({
  activeSectionId: 'hero',
  activeStageIndex: 0,
  scrollProgress: 0,
  stageProgress: 0,

  isLoaded: false,
  isReducedMotion: false,
  heroTime: 0,
  heroSequenceComplete: false,

  isOrbitEnabled: false,
  customTarget: null,
  camPos: STAGES[0].cameraPos,
  camTarget: STAGES[0].cameraTarget,
  camFov: STAGES[0].fov,

  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setActiveStageIndex: (index) => set({ activeStageIndex: index }),
  setScrollProgress: (p) => set({ scrollProgress: p }),
  setStageProgress: (p) => set({ stageProgress: p }),
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  setIsReducedMotion: (val) => set({ isReducedMotion: val }),
  setHeroTime: (t) => set({ heroTime: t }),
  setHeroSequenceComplete: (complete) => set({ heroSequenceComplete: complete }),
  setIsOrbitEnabled: (enabled) => set({ isOrbitEnabled: enabled }),
  setCustomTarget: (target) => set({ customTarget: target }),
  setCameraInfo: (pos, target, fov) =>
    set({
      camPos: pos,
      camTarget: target,
      camFov: fov,
    }),
}));
