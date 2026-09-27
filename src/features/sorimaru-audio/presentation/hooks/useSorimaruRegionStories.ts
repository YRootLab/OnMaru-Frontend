'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { SorimaruRepository } from '../../application/SorimaruRepository';
import { createSorimaruRegionStories } from '../../application/sorimaruRegionStories';
import { KOREA_REGION_PATHS } from '@/shared/data/koreaMapPaths';

export type { RegionGroupsState, RegionStoriesState } from '../../application/sorimaruRegionStories';

const regionLabels = Object.fromEntries(KOREA_REGION_PATHS.map((region) => [region.id, region.label]));

export function useSorimaruRegionStories(repository: SorimaruRepository, active: boolean) {
  const controller = useMemo(() => createSorimaruRegionStories(repository, regionLabels), [repository]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { if (active) controller.activate(); }, [active, controller]);
  return {
    ...state,
    selectRegion: controller.selectRegion,
    loadNextRegionPage: controller.loadNextRegionPage,
    retryGroups: controller.retryGroups,
    retryRegion: controller.retryRegion,
  };
}
