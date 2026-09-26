import { create } from 'zustand';
import type {
  CollectedStamp,
  StampBookResponse,
  StampCatalogResponse,
  StampDef,
  StampSummary,
} from '../domain/models';
import { toStampRarity } from '../domain/stampRules';

interface LegacyCheckInResult {
  success: false;
  alreadyVisited: boolean;
  stampsAwarded: StampDef[];
  primaryStamp: null;
}

interface StampStoreState {
  catalog: StampCatalogResponse | null;
  book: StampBookResponse | null;
  catalogLoading: boolean;
  bookLoading: boolean;
  catalogError: unknown;
  bookError: unknown;
  collectedStamps: Record<string, CollectedStamp>;
  visitedPlaceIds: Record<string, true>;
  activeStampModal: StampDef | null;
  awardQueue: StampDef[];
  setCatalog: (catalog: StampCatalogResponse) => void;
  setBook: (book: StampBookResponse) => void;
  setCatalogLoading: (loading: boolean) => void;
  setBookLoading: (loading: boolean) => void;
  setCatalogError: (error: unknown) => void;
  setBookError: (error: unknown) => void;
  recordSuccessfulCheckIn: (placeId: string, summary: StampSummary) => void;
  enqueueAwards: (stamps: StampDef[]) => void;
  openStampModal: (stamp: StampDef) => void;
  closeStampModal: () => void;
  isPlaceVisited: (placeId: string) => boolean;
  isStampUnlocked: (stampId: string) => boolean;
  getUnlockedStampsCount: () => number;
  clearPrivateState: () => void;
  resetAll: () => void;
  checkIn: (place: {
    id: string;
    name?: string;
    address?: string;
    isTraditional?: boolean;
  }) => LegacyCheckInResult;
}

const initialState = {
  catalog: null,
  book: null,
  catalogLoading: false,
  bookLoading: false,
  catalogError: null,
  bookError: null,
  collectedStamps: {},
  visitedPlaceIds: {},
  activeStampModal: null,
  awardQueue: [],
};

function collectedFromBook(book: StampBookResponse): Record<string, CollectedStamp> {
  return Object.fromEntries(book.stamps.flatMap((stamp) => {
    if (!stamp.collected || !stamp.collectedAt) return [];
    return [[stamp.code, {
      stampId: stamp.code,
      placeId: stamp.triggerPlaceId ?? '',
      placeName: '',
      collectedAt: stamp.collectedAt,
      rarity: toStampRarity(stamp.rarity),
    } satisfies CollectedStamp]];
  }));
}

function visitedFromBook(book: StampBookResponse): Record<string, true> {
  return Object.fromEntries(book.stamps.flatMap((stamp) => (
    stamp.collected && stamp.triggerPlaceId ? [[stamp.triggerPlaceId, true as const]] : []
  )));
}

export const useStampStore = create<StampStoreState>((set, get) => ({
  ...initialState,
  setCatalog: (catalog) => set({ catalog, catalogError: null }),
  setBook: (book) => set((state) => ({
    book,
    bookError: null,
    collectedStamps: collectedFromBook(book),
    visitedPlaceIds: { ...state.visitedPlaceIds, ...visitedFromBook(book) },
  })),
  setCatalogLoading: (catalogLoading) => set({ catalogLoading }),
  setBookLoading: (bookLoading) => set({ bookLoading }),
  setCatalogError: (catalogError) => set({ catalogError }),
  setBookError: (bookError) => set({ bookError }),
  recordSuccessfulCheckIn: (placeId, summary) => set((state) => ({
    visitedPlaceIds: { ...state.visitedPlaceIds, [placeId]: true },
    book: state.book ? { ...state.book, summary } : state.book,
  })),
  enqueueAwards: (stamps) => set((state) => {
    if (stamps.length === 0) return state;
    return {
      awardQueue: state.activeStampModal ? [...state.awardQueue, ...stamps] : stamps.slice(1),
      activeStampModal: state.activeStampModal ?? stamps[0],
    };
  }),
  openStampModal: (activeStampModal) => set({ activeStampModal }),
  closeStampModal: () => set((state) => ({
    activeStampModal: state.awardQueue[0] ?? null,
    awardQueue: state.awardQueue.slice(1),
  })),
  isPlaceVisited: (placeId) => Boolean(get().visitedPlaceIds[placeId]),
  isStampUnlocked: (stampId) => Boolean(get().collectedStamps[stampId]),
  getUnlockedStampsCount: () => Object.keys(get().collectedStamps).length,
  clearPrivateState: () => set({
    book: null,
    bookError: null,
    bookLoading: false,
    collectedStamps: {},
    visitedPlaceIds: {},
    activeStampModal: null,
    awardQueue: [],
  }),
  resetAll: () => set(initialState),
  checkIn: (place) => ({
    success: false,
    alreadyVisited: get().isPlaceVisited(place.id),
    stampsAwarded: [],
    primaryStamp: null,
  }),
}));
