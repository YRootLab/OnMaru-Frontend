import { create } from 'zustand';
import { lightPalette } from '@/design-system/tokens';
import type { Item, KakaoMap, LatLng, MapMode, SheetSnap, Warmth } from '@/map/types';

/** 대한민국 전국 중심 시점 (특정 지역을 검색하지 않았을 때 기본 전국 조망) */
export const DEFAULT_CENTER: LatLng = { lat: 36.35, lng: 127.75 };
export const DEFAULT_LEVEL = 11;

/** 모드별 대표색 — 토글·칩·마커·온기 blob이 같은 값을 본다. */
export const MODE_COLOR: Record<MapMode, string> = {
  info: lightPalette.cheongrok[500],
  warmth: lightPalette.juhong[500],
};

interface MapState {
  /** kakao.maps.Map 인스턴스. panTo·setLevel을 쓰는 쪽이 직접 잡는다. */
  map: KakaoMap | null;
  mode: MapMode;
  /** 정보모드는 PlaceCategory, 온기모드는 WarmthFilter로 읽는다. null = 전체. */
  category: string | null;
  center: LatLng;
  level: number;
  items: Item[];
  warmths: Warmth[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  hoveredId: string | null;
  detailId: string | null;
  popularPanelOpen: boolean;
  sortOrder: 'dist' | 'name';
  currentAddress: string;
  /** 마지막으로 검색한 중심. 여기서 2km 벗어나면 재검색 버튼이 뜬다. */
  searchCenter: LatLng;
  isSearchDirty: boolean;
  /** 같은 좌표/카테고리로 다시 부르기 위한 값. 증가시키면 useMapData가 재요청한다. */
  reloadNonce: number;
  panelOpen: boolean;
  sheetSnap: SheetSnap;

  setMap: (map: KakaoMap | null) => void;
  setMode: (mode: MapMode) => void;
  setCategory: (category: string | null) => void;
  setCenter: (center: LatLng, level?: number) => void;
  setItems: (items: Item[]) => void;
  setWarmths: (warmths: Warmth[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  setDetailId: (id: string | null) => void;
  setPopularPanelOpen: (open: boolean) => void;
  setSortOrder: (sortOrder: 'dist' | 'name') => void;
  setCurrentAddress: (currentAddress: string) => void;
  markSearchDirty: () => void;
  clearSearchDirty: () => void;
  reload: () => void;
  togglePanel: () => void;
  setSheetSnap: (snap: SheetSnap) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  map: null,
  mode: 'info',
  category: null,
  center: DEFAULT_CENTER,
  level: DEFAULT_LEVEL,
  items: [],
  warmths: [],
  loading: false,
  error: null,
  selectedId: null,
  hoveredId: null,
  detailId: null,
  popularPanelOpen: false,
  sortOrder: 'dist',
  currentAddress: '대한민국 전국',
  searchCenter: DEFAULT_CENTER,
  isSearchDirty: false,
  reloadNonce: 0,
  panelOpen: true,
  sheetSnap: 'half',

  setMap: (map) => set({ map }),
  // 모드가 바뀌면 카테고리 목록 자체가 달라지므로 선택을 버린다.
  setMode: (mode) =>
    set({
      mode,
      category: null,
      selectedId: null,
      hoveredId: null,
      detailId: null,
      popularPanelOpen: false,
    }),
  setCategory: (category) =>
    set({
      category,
      selectedId: null,
      hoveredId: null,
      detailId: null,
      popularPanelOpen: false,
    }),
  setCenter: (center, level) => set(level === undefined ? { center } : { center, level }),
  setItems: (items) => set({ items }),
  setWarmths: (warmths) => set({ warmths }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
  setDetailId: (detailId) => set({ detailId, popularPanelOpen: false }),
  setPopularPanelOpen: (popularPanelOpen) =>
    set({ popularPanelOpen, detailId: popularPanelOpen ? null : get().detailId }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setCurrentAddress: (currentAddress) => set({ currentAddress }),
  markSearchDirty: () => set({ isSearchDirty: true }),
  // searchCenter가 바뀌면 useMapData가 그걸 신호로 다시 fetch 한다.
  clearSearchDirty: () => set({ isSearchDirty: false, searchCenter: get().center }),
  reload: () => set({ reloadNonce: get().reloadNonce + 1 }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),
  setSheetSnap: (sheetSnap) => set({ sheetSnap }),
}));
