import { create } from 'zustand';
import { STAGES } from '../data/hanok.data';

export interface HanokViewerState {
  activeSectionId: string;
  activeStageIndex: number;
  scrollProgress: number;
  stageProgress: number;

  // 개발자 툴 및 카메라 오버라이드
  isOrbitEnabled: boolean;
  customTarget: [number, number, number] | null;
  camPos: [number, number, number];
  camTarget: [number, number, number];
  camFov: number;

  // Actions
  setActiveSectionId: (id: string) => void;
  setActiveStageIndex: (index: number) => void;
  setScrollProgress: (p: number) => void;
  setStageProgress: (p: number) => void;
  setIsOrbitEnabled: (enabled: boolean) => void;
  setCustomTarget: (target: [number, number, number] | null) => void;
  setCameraInfo: (pos: [number, number, number], target: [number, number, number], fov: number) => void;
}

export const useHanokViewerStore = create<HanokViewerState>((set) => ({
  activeSectionId: 'assembly',
  activeStageIndex: 0,
  scrollProgress: 0,
  stageProgress: 0,

  isOrbitEnabled: false,
  customTarget: null,
  camPos: STAGES[0].cameraPos,
  camTarget: STAGES[0].cameraTarget,
  camFov: STAGES[0].fov,

  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setActiveStageIndex: (index) => set({ activeStageIndex: index }),
  setScrollProgress: (p) => set({ scrollProgress: p }),
  setStageProgress: (p) => set({ stageProgress: p }),
  setIsOrbitEnabled: (enabled) => set({ isOrbitEnabled: enabled }),
  setCustomTarget: (target) => set({ customTarget: target }),
  setCameraInfo: (pos, target, fov) =>
    set({
      camPos: pos,
      camTarget: target,
      camFov: fov,
    }),
}));
