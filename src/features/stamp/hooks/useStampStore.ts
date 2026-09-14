import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CollectedStamp, StampDef } from '../types';
import { STAMP_DEFINITIONS } from '../data/stampDefs';

interface CheckInResult {
  success: boolean;
  alreadyVisited: boolean;
  stampsAwarded: StampDef[];
  primaryStamp: StampDef;
}

interface StampStoreState {
  collectedStamps: Record<string, CollectedStamp>;
  visitedPlaceIds: string[];
  activeStampModal: StampDef | null;

  // Actions
  checkIn: (place: { id: string; name: string; address?: string }) => CheckInResult;
  isPlaceVisited: (placeId: string) => boolean;
  isStampUnlocked: (stampId: string) => boolean;
  getUnlockedStampsCount: () => number;
  openStampModal: (stamp: StampDef) => void;
  closeStampModal: () => void;
  syncWithServer: (userId?: string) => Promise<void>;
}

// Helper to determine the best matching stamp for a given place
function findMatchingStamps(place: { id: string; name: string; address?: string }): StampDef[] {
  const matches: StampDef[] = [];
  const text = `${place.name} ${place.address || ''}`.toLowerCase();

  // 1. Direct keywords / placeId matches
  if (text.includes('북촌') || text.includes('인사동') || text.includes('종로')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_bukchon');
    if (s) matches.push(s);
  } else if (text.includes('은평') || text.includes('진관')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_eunpyeong');
    if (s) matches.push(s);
  } else if (text.includes('수원') || text.includes('화성') || text.includes('행궁')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_hwaseong');
    if (s) matches.push(s);
  } else if (text.includes('강릉') || text.includes('선교장') || text.includes('오죽헌')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_gangneung');
    if (s) matches.push(s);
  } else if (text.includes('아산') || text.includes('외암') || text.includes('충청') || text.includes('공주') || text.includes('부여')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_oeam');
    if (s) matches.push(s);
  } else if (text.includes('전주') || text.includes('경기전') || text.includes('남원') || text.includes('전라')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_jeonju');
    if (s) matches.push(s);
  } else if (text.includes('구례') || text.includes('운조루') || text.includes('지리산') || text.includes('담양')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_unjoru');
    if (s) matches.push(s);
  } else if (text.includes('안동') || text.includes('하회') || text.includes('도산')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_andong');
    if (s) matches.push(s);
  } else if (text.includes('경주') || text.includes('양동') || text.includes('교촌') || text.includes('경상')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_yangdong');
    if (s) matches.push(s);
  } else if (text.includes('제주') || text.includes('성읍') || text.includes('서귀포')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_jeju_seongup');
    if (s) matches.push(s);
  } else {
    // Default fallback to Bukchon common stamp
    const fallback = STAMP_DEFINITIONS[0];
    matches.push(fallback);
  }

  // 2. Night Hanok check (past 18:00 or before 06:00)
  const currentHour = new Date().getHours();
  if (currentHour >= 18 || currentHour < 6 || text.includes('야경') || text.includes('야행')) {
    const nightStamp = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_night_hanok');
    if (nightStamp && !matches.some((m) => m.id === nightStamp.id)) {
      matches.push(nightStamp);
    }
  }

  return matches;
}

export const useStampStore = create<StampStoreState>()(
  persist(
    (set, get) => ({
      collectedStamps: {
        // Pre-collected starter stamp for awesome onboarding demonstration
        stamp_bukchon: {
          stampId: 'stamp_bukchon',
          placeId: 'demo-init',
          placeName: '북촌 한옥마을',
          collectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          rarity: 'common',
        },
      },
      visitedPlaceIds: ['demo-init'],
      activeStampModal: null,

      checkIn: (place) => {
        const { collectedStamps, visitedPlaceIds } = get();
        const alreadyVisited = visitedPlaceIds.includes(place.id);

        const matchingDefs = findMatchingStamps(place);
        const primaryStamp = matchingDefs[0];
        const stampsAwarded: StampDef[] = [];
        const nowIso = new Date().toISOString();

        const updatedStamps = { ...collectedStamps };
        const updatedPlaces = alreadyVisited
          ? visitedPlaceIds
          : [...visitedPlaceIds, place.id];

        matchingDefs.forEach((def) => {
          if (!updatedStamps[def.id]) {
            updatedStamps[def.id] = {
              stampId: def.id,
              placeId: place.id,
              placeName: place.name,
              collectedAt: nowIso,
              rarity: def.rarity,
            };
            stampsAwarded.push(def);
          }
        });

        // Check if national master stamp condition is met (5 or more unique regions)
        const regionSet = new Set<string>();
        Object.keys(updatedStamps).forEach((sid) => {
          const def = STAMP_DEFINITIONS.find((d) => d.id === sid);
          if (def && def.region !== 'all') {
            regionSet.add(def.region);
          }
        });

        const nationalMaster = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_national_master');
        if (nationalMaster && !updatedStamps[nationalMaster.id] && regionSet.size >= 4) {
          updatedStamps[nationalMaster.id] = {
            stampId: nationalMaster.id,
            placeId: place.id,
            placeName: '전국 팔도 제패',
            collectedAt: nowIso,
            rarity: 'legendary',
          };
          stampsAwarded.push(nationalMaster);
        }

        set({
          collectedStamps: updatedStamps,
          visitedPlaceIds: updatedPlaces,
          activeStampModal: stampsAwarded.length > 0 ? stampsAwarded[0] : null,
        });

        return {
          success: true,
          alreadyVisited,
          stampsAwarded,
          primaryStamp,
        };
      },

      isPlaceVisited: (placeId: string) => {
        return get().visitedPlaceIds.includes(placeId);
      },

      isStampUnlocked: (stampId: string) => {
        return Boolean(get().collectedStamps[stampId]);
      },

      getUnlockedStampsCount: () => {
        return Object.keys(get().collectedStamps).length;
      },

      openStampModal: (stamp: StampDef) => {
        set({ activeStampModal: stamp });
      },

      closeStampModal: () => {
        set({ activeStampModal: null });
      },

      syncWithServer: async (userId?: string) => {
        // Optimistic Mock sync simulation
        if (!userId) return;
        try {
          // Future real endpoint: await apiClient.post('/api/stamps/sync', ...)
          console.info(`[StampStore] Synced stamps for user ${userId}`);
        } catch (e) {
          console.error('[StampStore] Sync error:', e);
        }
      },
    }),
    {
      name: 'onmaru_hanok_stamps_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        collectedStamps: state.collectedStamps,
        visitedPlaceIds: state.visitedPlaceIds,
      }),
    }
  )
);
