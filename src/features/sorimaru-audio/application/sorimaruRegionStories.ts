import type { SorimaruRepository } from './SorimaruRepository';
import type { SorimaruRegionGroups, SorimaruStorySummary } from '../domain/sorimaruStory';

export interface RegionGroupsState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: SorimaruRegionGroups | null;
  error: Error | null;
}

export interface RegionStoriesState {
  status: 'idle' | 'loading' | 'success' | 'empty' | 'error';
  items: SorimaruStorySummary[];
  hasMore: boolean;
  loadingNext: boolean;
  error: Error | null;
}

const emptyStories = (): RegionStoriesState => ({ status: 'idle', items: [], hasMore: false, loadingNext: false, error: null });
const asError = (reason: unknown) => reason instanceof Error ? reason : new Error('Sorimaru region request failed');

export function createSorimaruRegionStories(
  repository: SorimaruRepository,
  regionLabels: Readonly<Record<string, string>>,
) {
  let snapshot = {
    groupsState: { status: 'idle', data: null, error: null } as RegionGroupsState,
    regionStoriesState: emptyStories(),
    selectedRegionId: 'seoul',
  };
  let activated = false;
  let groupsGeneration = 0;
  let regionGeneration = 0;
  let codes: string[] = [];
  let codeIndex = 0;
  let cursor: string | undefined;
  let pending = false;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof snapshot>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };

  async function loadRegionPage(append: boolean): Promise<void> {
    if (pending || !codes[codeIndex]) return;
    const generation = regionGeneration;
    pending = true;
    publish({ regionStoriesState: {
      ...(append ? snapshot.regionStoriesState : emptyStories()),
      status: append ? snapshot.regionStoriesState.status : 'loading', error: null, loadingNext: append,
    } });
    try {
      const page = await repository.listStories({
        language: 'ko-KR', regionCode: codes[codeIndex], limit: 20, ...(cursor ? { cursor } : {}),
      });
      if (generation !== regionGeneration) return;
      const items = append ? [...snapshot.regionStoriesState.items] : [];
      const ids = new Set(items.map((story) => story.storyId));
      for (const story of page.items) {
        if (!ids.has(story.storyId)) { items.push(story); ids.add(story.storyId); }
      }
      if (page.hasMore && page.nextCursor) cursor = page.nextCursor;
      else { codeIndex += 1; cursor = undefined; }
      publish({ regionStoriesState: {
        status: items.length ? 'success' : 'empty', items,
        hasMore: codeIndex < codes.length, loadingNext: false, error: null,
      } });
    } catch (reason) {
      if (generation !== regionGeneration) return;
      publish({ regionStoriesState: { ...snapshot.regionStoriesState, status: 'error', loadingNext: false, error: asError(reason) } });
    } finally {
      if (generation === regionGeneration) pending = false;
    }
  }

  async function loadSelectedRegion(): Promise<void> {
    regionGeneration += 1;
    pending = false;
    codeIndex = 0;
    cursor = undefined;
    const groups = snapshot.groupsState.data?.groups.filter((group) => group.label === regionLabels[snapshot.selectedRegionId]) ?? [];
    if (groups.length > 1) {
      codes = [];
      publish({ regionStoriesState: { ...emptyStories(), status: 'error', error: new Error('Ambiguous Sorimaru region group') } });
      return;
    }
    codes = [...new Set(groups[0]?.regionCodes ?? [])];
    if (!codes.length) {
      publish({ regionStoriesState: { ...emptyStories(), status: 'empty' } });
      return;
    }
    await loadRegionPage(false);
  }

  async function loadGroups(): Promise<void> {
    const generation = ++groupsGeneration;
    publish({ groupsState: { ...snapshot.groupsState, status: 'loading', error: null } });
    try {
      const data = await repository.listRegionGroups('ko-KR');
      if (generation !== groupsGeneration) return;
      publish({ groupsState: { status: 'success', data, error: null } });
      await loadSelectedRegion();
    } catch (reason) {
      if (generation !== groupsGeneration) return;
      publish({ groupsState: { ...snapshot.groupsState, status: 'error', error: asError(reason) } });
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    activate: () => {
      if (activated) return;
      activated = true;
      void loadGroups();
    },
    selectRegion: async (regionId: string) => {
      if (snapshot.selectedRegionId === regionId) return;
      regionGeneration += 1;
      pending = false;
      publish({ selectedRegionId: regionId, regionStoriesState: emptyStories() });
      if (snapshot.groupsState.status === 'success') await loadSelectedRegion();
    },
    loadNextRegionPage: async () => {
      if (!snapshot.regionStoriesState.hasMore || snapshot.regionStoriesState.error) return;
      await loadRegionPage(true);
    },
    retryGroups: loadGroups,
    retryRegion: async () => {
      if (snapshot.groupsState.status !== 'success') return;
      if (snapshot.regionStoriesState.items.length || codeIndex > 0 || cursor) await loadRegionPage(true);
      else await loadSelectedRegion();
    },
  };
}
