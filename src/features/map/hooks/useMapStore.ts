import { create } from 'zustand';
import { lightPalette } from '@/design-system/tokens';
import type { HeatDay, HeatSpot, Item, KakaoMap, LatLng, MapMode, SheetSnap, Warmth } from '@/features/map/types';
import type { WarmthPeriod } from '@/features/map/warmth/heatScale';


export const DEFAULT_CENTER: LatLng = { lat: 36.35, lng: 127.75 };
export const DEFAULT_LEVEL = 11;


export const MODE_COLOR: Record<MapMode, string> = {
  info: lightPalette.cheongrok[500],
  warmth: lightPalette.juhong[500],
};

interface MapState {

  map: KakaoMap | null;
  mode: MapMode;

  category: string | null;
  center: LatLng;
  level: number;

  userLocation: LatLng | null;
  items: Item[];
  warmths: Warmth[];

  heatSpots: HeatSpot[];
  selectedHeatSpot: HeatSpot | null;

  heatDays: HeatDay[];

  heatDayIndex: number;

  warmthPeriod: WarmthPeriod;

  warmthViewType: 'district' | 'heatmap';
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  hoveredId: string | null;
  detailId: string | null;
  popularPanelOpen: boolean;
  fromPopularRanking: boolean;
  sortOrder: 'dist' | 'name';
  currentAddress: string;

  searchCenter: LatLng;
  isSearchDirty: boolean;

  searchQuery: string;

  searchTrigger: number;

  reloadNonce: number;
  panelOpen: boolean;
  sheetSnap: SheetSnap;

  setMap: (map: KakaoMap | null) => void;
  setMode: (mode: MapMode) => void;
  setCategory: (category: string | null) => void;
  setWarmthViewType: (viewType: 'district' | 'heatmap') => void;
  setSearchQuery: (query: string) => void;
  triggerSearch: (query: string) => void;
  setCenter: (center: LatLng, level?: number) => void;
  setUserLocation: (userLocation: LatLng | null) => void;
  setItems: (items: Item[]) => void;
  setWarmths: (warmths: Warmth[]) => void;
  setHeatSpots: (heatSpots: HeatSpot[]) => void;
  setSelectedHeatSpot: (spot: HeatSpot | null) => void;
  setHeatDays: (days: HeatDay[]) => void;
  setHeatDayIndex: (index: number) => void;
  setWarmthPeriod: (period: WarmthPeriod) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  setDetailId: (id: string | null) => void;
  setDetailFromPopular: (id: string) => void;
  goBackToPopularRanking: () => void;
  setPopularPanelOpen: (open: boolean) => void;
  setSortOrder: (sortOrder: 'dist' | 'name') => void;
  setCurrentAddress: (currentAddress: string) => void;
  markSearchDirty: () => void;
  clearSearchDirty: () => void;
  reload: () => void;
  togglePanel: () => void;
  setPanelOpen: (panelOpen: boolean) => void;
  setSheetSnap: (snap: SheetSnap) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  map: null,
  mode: 'info',
  category: null,
  center: DEFAULT_CENTER,
  level: DEFAULT_LEVEL,
  userLocation: null,
  items: [],
  warmths: [],
  heatSpots: [],
  selectedHeatSpot: null,
  heatDays: [],
  heatDayIndex: 0,
  warmthPeriod: 'all',
  warmthViewType: 'district',
  loading: true,
  error: null,
  selectedId: null,
  hoveredId: null,
  detailId: null,
  popularPanelOpen: false,
  fromPopularRanking: false,
  sortOrder: 'dist',
  currentAddress: '대한민국 전국',
  searchCenter: DEFAULT_CENTER,
  isSearchDirty: false,
  searchQuery: '',
  searchTrigger: 0,
  reloadNonce: 0,
  panelOpen: true,
  sheetSnap: 'half',

  setMap: (map) => set({ map }),

  setMode: (mode) =>
    set({
      mode,
      category: null,
      selectedId: null,
      hoveredId: null,
      detailId: null,
      selectedHeatSpot: null,
      popularPanelOpen: false,
      fromPopularRanking: false,
    }),
  setCategory: (category) =>
    set({
      category,
      selectedId: null,
      hoveredId: null,
      detailId: null,
      popularPanelOpen: false,
      fromPopularRanking: false,
    }),
  setWarmthViewType: (warmthViewType) => set({ warmthViewType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  triggerSearch: (query) =>
    set((state) => ({
      searchQuery: query,
      searchTrigger: state.searchTrigger + 1,
    })),
  setCenter: (center, level) => set(level === undefined ? { center } : { center, level }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setItems: (items) => set({ items }),
  setWarmths: (warmths) => set({ warmths }),
  setHeatSpots: (heatSpots) => set({ heatSpots }),
  setSelectedHeatSpot: (selectedHeatSpot) => set({ selectedHeatSpot }),




  setHeatDays: (heatDays) =>
    set((s) => ({
      heatDays,
      heatDayIndex:
        s.heatDays.length > 0 && s.heatDayIndex < heatDays.length
          ? s.heatDayIndex
          : Math.max(0, heatDays.length - 1),
    })),
  setHeatDayIndex: (heatDayIndex) =>
    set((s) => ({
      heatDayIndex: Math.max(0, Math.min(heatDayIndex, Math.max(0, s.heatDays.length - 1))),
    })),
  setWarmthPeriod: (warmthPeriod) => set({ warmthPeriod }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
  setDetailId: (detailId) =>
    set({ detailId, popularPanelOpen: false, fromPopularRanking: false }),
  setDetailFromPopular: (detailId) =>
    set({ detailId, popularPanelOpen: false, fromPopularRanking: true }),
  goBackToPopularRanking: () =>
    set({ detailId: null, popularPanelOpen: true, fromPopularRanking: false }),
  setPopularPanelOpen: (popularPanelOpen) =>
    set({ popularPanelOpen, detailId: popularPanelOpen ? null : get().detailId, fromPopularRanking: false }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setCurrentAddress: (currentAddress) => set({ currentAddress }),
  markSearchDirty: () => set({ isSearchDirty: true }),

  clearSearchDirty: () => set({ isSearchDirty: false, searchCenter: get().center }),
  reload: () => set({ reloadNonce: get().reloadNonce + 1 }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setSheetSnap: (sheetSnap) => set({ sheetSnap }),
}));
