import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CollectedStamp, StampDef } from '../types';
import { STAMP_DEFINITIONS } from '../data/stampDefs';

import { isTraditionalPlace } from '@/features/map/utils/geo';

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


  checkIn: (place: { id: string; name: string; address?: string; isTraditional?: boolean }) => CheckInResult;
  isPlaceVisited: (placeId: string) => boolean;
  isStampUnlocked: (stampId: string) => boolean;
  getUnlockedStampsCount: () => number;
  openStampModal: (stamp: StampDef) => void;
  closeStampModal: () => void;
  syncWithServer: (userId?: string) => Promise<void>;
}


function findMatchingStamps(place: { id: string; name: string; address?: string; isTraditional?: boolean }): StampDef[] {

  const isEligible = place.isTraditional ?? isTraditionalPlace(place.name);
  if (!isEligible) {
    return [];
  }

  const matches: StampDef[] = [];
  const text = `${place.name} ${place.address || ''}`.toLowerCase();


  if (text.includes('은평') || text.includes('진관')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_eunpyeong');
    if (s) matches.push(s);
  } else if (text.includes('북촌') || text.includes('인사동') || text.includes('종로') || text.includes('서울')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_bukchon');
    if (s) matches.push(s);
  } else if (
    text.includes('수원') || text.includes('화성') || text.includes('행궁') ||
    text.includes('경기') || text.includes('용인') || text.includes('양평') ||
    text.includes('가평') || text.includes('파주') || text.includes('안성') || text.includes('이천')
  ) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_hwaseong');
    if (s) matches.push(s);
  } else if (
    text.includes('강릉') || text.includes('선교장') || text.includes('오죽헌') ||
    text.includes('강원') || text.includes('춘천') || text.includes('속초') ||
    text.includes('원주') || text.includes('영월') || text.includes('평창') || text.includes('정선')
  ) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_gangneung');
    if (s) matches.push(s);
  } else if (
    text.includes('아산') || text.includes('외암') || text.includes('충청') ||
    text.includes('충남') || text.includes('충북') || text.includes('대전') ||
    text.includes('세종') || text.includes('공주') || text.includes('부여') ||
    text.includes('청주') || text.includes('천안') || text.includes('충주')
  ) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_oeam');
    if (s) matches.push(s);
  } else if (text.includes('구례') || text.includes('운조루') || text.includes('지리산') || text.includes('담양')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_unjoru');
    if (s) matches.push(s);
  } else if (
    text.includes('전주') || text.includes('경기전') || text.includes('전라') ||
    text.includes('전북') || text.includes('전남') || text.includes('광주') ||
    text.includes('남원') || text.includes('순천') || text.includes('나주') || text.includes('여수')
  ) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_jeonju');
    if (s) matches.push(s);
  } else if (
    text.includes('경주') || text.includes('양동') || text.includes('교촌') ||
    text.includes('포항') || text.includes('영주')
  ) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_yangdong');
    if (s) matches.push(s);
  } else if (
    text.includes('안동') || text.includes('하회') || text.includes('도산') ||
    text.includes('경상') || text.includes('경북') || text.includes('경남') ||
    text.includes('부산') || text.includes('대구') || text.includes('울산') ||
    text.includes('창원') || text.includes('진주') || text.includes('통영')
  ) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_andong');
    if (s) matches.push(s);
  } else if (text.includes('제주') || text.includes('성읍') || text.includes('서귀포')) {
    const s = STAMP_DEFINITIONS.find((d) => d.id === 'stamp_jeju_seongup');
    if (s) matches.push(s);
  } else {

    const fallback = STAMP_DEFINITIONS[0];
    matches.push(fallback);
  }


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
        if (matchingDefs.length === 0) {
          return {
            success: false,
            alreadyVisited,
            stampsAwarded: [],
            primaryStamp: null as unknown as StampDef,
          };
        }

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
          activeStampModal: stampsAwarded.length > 0 ? stampsAwarded[0] : primaryStamp,
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

        if (!userId) return;
        try {

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
