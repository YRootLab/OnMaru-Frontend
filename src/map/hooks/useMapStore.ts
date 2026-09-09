import { create } from 'zustand';
import { lightPalette } from '@/design-system/tokens';
import type { HeatDay, HeatSpot, Item, KakaoMap, LatLng, MapMode, SheetSnap, Warmth } from '@/map/types';
import type { WarmthPeriod } from '@/map/warmth/heatScale';

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
  /** 사용자의 실제 GPS 위치 (권한 획득 시) */
  userLocation: LatLng | null;
  items: Item[];
  warmths: Warmth[];
  /** 실시간 권역별 혼잡도 및 관광객 집중도 히트스팟 */
  heatSpots: HeatSpot[];
  selectedHeatSpot: HeatSpot | null;
  /** 스크러버가 훑는 날짜 축. 데이터랩이 실제로 채워둔 날만 들어온다. */
  heatDays: HeatDay[];
  /** heatDays에서 지금 보고 있는 칸. 기본은 마지막 날(가장 최근). */
  heatDayIndex: number;
  /** 온기 히트맵·피드가 함께 보는 기간 창. 좁히면 '지금 이 동네'가 보인다. */
  warmthPeriod: WarmthPeriod;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  hoveredId: string | null;
  detailId: string | null;
  popularPanelOpen: boolean;
  fromPopularRanking: boolean;
  sortOrder: 'dist' | 'name';
  currentAddress: string;
  /** 마지막으로 검색한 중심. 여기서 2km 벗어나면 재검색 버튼이 뜬다. */
  searchCenter: LatLng;
  isSearchDirty: boolean;
  /** 검색창 키워드 (칩셋 클릭 또는 직접 입력 시 동기화) */
  searchQuery: string;
  /** 검색 실행 트리거를 위한 타임스탬프 */
  searchTrigger: number;
  /** 같은 좌표/카테고리로 다시 부르기 위한 값. 증가시키면 useMapData가 재요청한다. */
  reloadNonce: number;
  panelOpen: boolean;
  sheetSnap: SheetSnap;

  setMap: (map: KakaoMap | null) => void;
  setMode: (mode: MapMode) => void;
  setCategory: (category: string | null) => void;
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
  // 모드가 바뀌면 카테고리 목록 자체가 달라지므로 선택을 버린다.
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
  /*
    날짜 축이 새로 오면 보던 칸을 지키되, 축이 짧아졌으면 마지막 날로 당긴다.
    스크러버를 놓아둔 자리가 지도를 움직일 때마다 초기화되면 쓸 수가 없다.
  */
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
  // searchCenter가 바뀌면 useMapData가 그걸 신호로 다시 fetch 한다.
  clearSearchDirty: () => set({ isSearchDirty: false, searchCenter: get().center }),
  reload: () => set({ reloadNonce: get().reloadNonce + 1 }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setSheetSnap: (sheetSnap) => set({ sheetSnap }),
}));
