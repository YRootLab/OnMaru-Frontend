import { create } from 'zustand';
import { palette } from '@/design-system/tokens';
import type { ViewportSnapshot } from '@/features/map/domain/viewportRefreshPolicy';
import type {
  HeatDay,
  HeatSpot,
  InfoPlaceItem,
  Item,
  KakaoMap,
  LatLng,
  MapInfoCategory,
  MapMode,
  MapViewportResponse,
  SheetSnap,
  ViewportItem,
  ViewportItemBounds,
  ViewportRenderMode,
  Warmth,
} from '@/features/map/types';
import type { WarmthPeriod } from '@/features/map/warmth/heatScale';
import type { MapLoadError } from '@/features/map/application/mapLoadError';


export const DEFAULT_CENTER: LatLng = { lat: 36.35, lng: 127.75 };
export const DEFAULT_LEVEL = 9;


export const MODE_COLOR: Record<MapMode, string> = {
  info: palette.cheongrok[500],
  warmth: palette.hwanggeum[500],
};

export type InfoListSurface = 'desktop' | 'mobile';

export interface InfoHomeSnapshot {
  viewport: ViewportSnapshot;
  listScrollTops: Record<InfoListSurface, number>;
}

interface InfoListRestoreRequest {
  id: number;
  scrollTops: Record<InfoListSurface, number>;
}

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
  placeLoadError: MapLoadError | null;
  selectedId: string | null;
  hoveredId: string | null;
  detailId: string | null;
  popularPanelOpen: boolean;
  fromPopularRanking: boolean;
  sortOrder: 'dist' | 'name';
  currentAddress: string;

  searchCenter: LatLng;
  committedViewport: ViewportSnapshot;
  isSearchDirty: boolean;

  searchQuery: string;

  searchTrigger: number;

  reloadNonce: number;
  panelOpen: boolean;
  sheetSnap: SheetSnap;
  isWarmthWriteOpen: boolean;

  // ── Info list state ──────────────────────────────────────────────────────
  infoCategory: MapInfoCategory;
  infoRegionCode: string | null;
  infoRegionName: string | null;
  listItems: InfoPlaceItem[];
  listTotalCount: number;
  listNextCursor: string | null;
  listSnapshotId: string | null;
  isListLoading: boolean;
  listError: string | null;
  infoListReloadNonce: number;
  infoListScrollTops: Record<InfoListSurface, number>;
  infoHomeSnapshot: InfoHomeSnapshot | null;
  infoListRestoreRequest: InfoListRestoreRequest | null;

  // ── Info viewport state ──────────────────────────────────────────────────
  viewportItems: ViewportItem[];
  viewportRenderMode: ViewportRenderMode | null;
  viewportSnapshotId: string | null;
  servedBbox: ViewportItemBounds | null;
  isViewportLoading: boolean;
  viewportError: string | null;
  infoViewportReloadNonce: number;
  // Increments each time renderMode changes; Phase 3 coordinator uses this
  // to cancel stale rAF/animation callbacks before they start a crossfade.
  visualGeneration: number;

  setInfoCategory: (category: MapInfoCategory) => void;
  setInfoRegionCode: (regionCode: string | null, regionName?: string | null) => void;
  setListItems: (items: InfoPlaceItem[], totalCount: number, nextCursor: string | null, snapshotId: string | null) => void;
  appendListItems: (items: InfoPlaceItem[], nextCursor: string | null) => void;
  setIsListLoading: (loading: boolean) => void;
  setListError: (error: string | null) => void;
  retryInfoList: () => void;
  setInfoListScrollTop: (surface: InfoListSurface, scrollTop: number) => void;
  captureInfoHomeSnapshot: () => void;
  consumeInfoHomeSnapshot: () => InfoHomeSnapshot | null;
  setViewportResponse: (res: MapViewportResponse) => void;
  setIsViewportLoading: (loading: boolean) => void;
  setViewportError: (error: string | null) => void;
  retryInfoViewport: () => void;
  advanceVisualGeneration: () => void;

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
  setPlaceLoadError: (error: MapLoadError | null) => void;
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
  initializeCommittedViewport: (snapshot: ViewportSnapshot) => void;
  commitViewportSearch: (snapshot: ViewportSnapshot) => void;
  reload: () => void;
  togglePanel: () => void;
  setPanelOpen: (panelOpen: boolean) => void;
  setSheetSnap: (snap: SheetSnap) => void;
  setIsWarmthWriteOpen: (open: boolean) => void;
  myLocationNonce: number;
  requestMyLocation: () => void;
  isLocating: boolean;
  setIsLocating: (v: boolean) => void;

  journeyPlaces: Array<{ id: string; name: string; lat: number; lng: number }>;
  addToJourney: (place: { id: string; name: string; lat: number; lng: number }) => void;
  removeFromJourney: (id: string) => void;
  clearJourney: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // ── Info list ──────────────────────────────────────────────────────────────
  infoCategory: 'hanok',
  infoRegionCode: null,
  infoRegionName: null,
  listItems: [],
  listTotalCount: 0,
  listNextCursor: null,
  listSnapshotId: null,
  isListLoading: false,
  listError: null,
  infoListReloadNonce: 0,
  infoListScrollTops: { desktop: 0, mobile: 0 },
  infoHomeSnapshot: null,
  infoListRestoreRequest: null,

  // ── Info viewport ──────────────────────────────────────────────────────────
  viewportItems: [],
  viewportRenderMode: null,
  viewportSnapshotId: null,
  servedBbox: null,
  isViewportLoading: false,
  viewportError: null,
  infoViewportReloadNonce: 0,
  visualGeneration: 0,

  setInfoCategory: (infoCategory) =>
    set({
      infoCategory,
      infoRegionCode: null,
      infoRegionName: null,
      listItems: [],
      listTotalCount: 0,
      listNextCursor: null,
      listSnapshotId: null,
      listError: null,
      viewportItems: [],
      viewportRenderMode: null,
      viewportSnapshotId: null,
      servedBbox: null,
      viewportError: null,
    }),
  setInfoRegionCode: (infoRegionCode, infoRegionName = null) =>
    set({
      infoRegionCode,
      infoRegionName,
      listItems: [],
      listTotalCount: 0,
      listNextCursor: null,
      listSnapshotId: null,
      listError: null,
    }),
  setListItems: (items, totalCount, nextCursor, snapshotId) =>
    set({ listItems: items, listTotalCount: totalCount, listNextCursor: nextCursor, listSnapshotId: snapshotId }),
  appendListItems: (items, nextCursor) =>
    set((s) => {
      const seen = new Set(s.listItems.map((item) => item.placeId));
      const uniqueItems = items.filter((item) => {
        if (seen.has(item.placeId)) return false;
        seen.add(item.placeId);
        return true;
      });
      return { listItems: [...s.listItems, ...uniqueItems], listNextCursor: nextCursor };
    }),
  setIsListLoading: (isListLoading) => set({ isListLoading }),
  setListError: (listError) => set({ listError }),
  retryInfoList: () => set((state) => ({
    listError: null,
    infoListReloadNonce: state.infoListReloadNonce + 1,
  })),
  setInfoListScrollTop: (surface, scrollTop) => set((state) => ({
    infoListScrollTops: {
      ...state.infoListScrollTops,
      [surface]: Math.max(0, scrollTop),
    },
  })),
  captureInfoHomeSnapshot: () => set((state) => {
    if (
      state.infoHomeSnapshot
      || state.infoCategory !== 'hanok'
      || state.infoRegionCode !== null
    ) {
      return state;
    }

    return {
      infoHomeSnapshot: {
        viewport: {
          ...state.committedViewport,
          center: { ...state.committedViewport.center },
        },
        listScrollTops: { ...state.infoListScrollTops },
      },
    };
  }),
  consumeInfoHomeSnapshot: () => {
    let consumed: InfoHomeSnapshot | null = null;
    set((state) => {
      consumed = state.infoHomeSnapshot;
      if (!consumed) return state;

      return {
        infoHomeSnapshot: null,
        infoListRestoreRequest: {
          id: (state.infoListRestoreRequest?.id ?? 0) + 1,
          scrollTops: { ...consumed.listScrollTops },
        },
      };
    });
    return consumed;
  },
  setViewportResponse: (res) =>
    set((state) => ({
      viewportItems: res.items,
      viewportRenderMode: res.renderMode,
      viewportSnapshotId: res.snapshotId,
      servedBbox: res.servedBbox,
      // Advance visual generation when renderMode boundary is crossed so
      // Phase 3 coordinator can cancel stale rAF/WAAPI before they fire.
      visualGeneration:
        res.renderMode !== state.viewportRenderMode
          ? state.visualGeneration + 1
          : state.visualGeneration,
    })),
  setIsViewportLoading: (isViewportLoading) => set({ isViewportLoading }),
  setViewportError: (viewportError) => set({ viewportError }),
  retryInfoViewport: () => set((state) => ({
    viewportError: null,
    infoViewportReloadNonce: state.infoViewportReloadNonce + 1,
  })),
  advanceVisualGeneration: () =>
    set((state) => ({ visualGeneration: state.visualGeneration + 1 })),

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
  placeLoadError: null,
  selectedId: null,
  hoveredId: null,
  detailId: null,
  popularPanelOpen: false,
  fromPopularRanking: false,
  sortOrder: 'dist',
  currentAddress: '대한민국 전국',
  searchCenter: DEFAULT_CENTER,
  committedViewport: {
    center: DEFAULT_CENTER,
    level: DEFAULT_LEVEL,
    radius: 0,
  },
  isSearchDirty: false,
  searchQuery: '',
  searchTrigger: 0,
  reloadNonce: 0,
  panelOpen: true,
  sheetSnap: 'half',

  setMap: (map) => set({ map }),

  setMode: (mode) =>
    set((state) => ({
      mode,
      ...(mode === 'info' && state.mode !== 'info' ? {
        infoCategory: 'hanok' as const,
        infoRegionCode: null,
        infoRegionName: null,
        listItems: [],
        listTotalCount: 0,
        listNextCursor: null,
        listSnapshotId: null,
        listError: null,
        viewportItems: [],
        viewportRenderMode: null,
        viewportSnapshotId: null,
        servedBbox: null,
        viewportError: null,
      } : {}),
      category: null,
      selectedId: null,
      hoveredId: null,
      detailId: null,
      selectedHeatSpot: null,
      popularPanelOpen: false,
      fromPopularRanking: false,
    })),
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
  setPlaceLoadError: (placeLoadError) => set({ placeLoadError }),
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
  initializeCommittedViewport: (committedViewport) => set({ committedViewport }),
  commitViewportSearch: (snapshot) =>
    set((state) => ({
      searchCenter: snapshot.center,
      committedViewport: snapshot,
      isSearchDirty: false,
      reloadNonce: state.reloadNonce + 1,
    })),
  reload: () => set({ reloadNonce: get().reloadNonce + 1 }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setSheetSnap: (sheetSnap) => set({ sheetSnap }),
  isWarmthWriteOpen: false,
  setIsWarmthWriteOpen: (isWarmthWriteOpen) => set({ isWarmthWriteOpen }),
  myLocationNonce: 0,
  requestMyLocation: () => set((s) => ({ myLocationNonce: s.myLocationNonce + 1 })),
  isLocating: false,
  setIsLocating: (isLocating) => set({ isLocating }),

  journeyPlaces: [],
  addToJourney: (place) =>
    set((s) => ({
      journeyPlaces: s.journeyPlaces.some((p) => p.id === place.id)
        ? s.journeyPlaces
        : [...s.journeyPlaces, place],
    })),
  removeFromJourney: (id) =>
    set((s) => ({ journeyPlaces: s.journeyPlaces.filter((p) => p.id !== id) })),
  clearJourney: () => set({ journeyPlaces: [] }),
}));
