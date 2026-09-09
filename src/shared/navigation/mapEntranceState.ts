'use client';

import { create } from 'zustand';

interface MapEntranceState {
  /** 한옥·오디·홈 등 다른 페이지에서 /map으로 이동하여 들어온 순간인지 여부 */
  isRouteEntrance: boolean;
  setRouteEntrance: (val: boolean) => void;
  recordNavigation: (pathname: string) => void;
}

export const useMapEntranceStore = create<MapEntranceState>((set) => ({
  isRouteEntrance: false,
  setRouteEntrance: (val: boolean) => set({ isRouteEntrance: val }),
  recordNavigation: (pathname: string) => {
    // /map 이외의 페이지(한옥, 오디, 홈 등)를 방문한 경우, 다음 지도 진입 시 등장 애니메이션 플래그 활성화
    if (pathname && !pathname.startsWith('/map')) {
      set({ isRouteEntrance: true });
    }
  },
}));
