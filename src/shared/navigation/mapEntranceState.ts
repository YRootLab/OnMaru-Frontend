'use client';

import { create } from 'zustand';

interface MapEntranceState {

  isRouteEntrance: boolean;
  setRouteEntrance: (val: boolean) => void;
  recordNavigation: (pathname: string) => void;
}

export const useMapEntranceStore = create<MapEntranceState>((set) => ({
  isRouteEntrance: false,
  setRouteEntrance: (val: boolean) => set({ isRouteEntrance: val }),
  recordNavigation: (pathname: string) => {

    if (pathname && !pathname.startsWith('/map')) {
      set({ isRouteEntrance: true });
    }
  },
}));
