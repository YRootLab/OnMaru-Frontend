'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryPage } from '../domain/sorimaruStory';
import { SORIMARU_REGION_CHIPS } from '../data/sorimaruCategoryData';
import { loadNextSorimaruPage, loadSorimaruInitialData, type SorimaruInitialData } from '../components/sorimaruInitialLoad';

export type CatalogState = {
  pages: SorimaruStoryPage[];
  status: 'loading' | 'error' | 'empty' | 'success';
  error: Error | null;
  loadingNext: boolean;
};

export type SorimaruCatalogSnapshot = {
  catalog: CatalogState;
  initialData: SorimaruInitialData | null;
  initialLoading: boolean;
  currentPage: number;
};

const baseScope = '전체\u0000';
const statusFor = (page: SorimaruStoryPage): CatalogState['status'] => page.items.length ? 'success' : 'empty';
const asError = (reason: unknown): Error => reason instanceof Error ? reason : new Error('Sorimaru archive request failed');

export function catalogCategoryForSelection(selectedCategory: string): string {
  return SORIMARU_REGION_CHIPS.includes(selectedCategory as (typeof SORIMARU_REGION_CHIPS)[number])
    ? '전체'
    : selectedCategory;
}

export function createSorimaruCatalogController(repository: SorimaruRepository, initialPage?: SorimaruStoryPage) {
  let scope = { category: '전체', regionCode: undefined as string | undefined };
  let scopeKey = baseScope;
  let generation = 0;
  let initialGeneration = 0;
  let initialReady = false;
  let loadingNext = false;
  let initialArchive: SorimaruStoryPage | null = initialPage ?? null;
  let snapshot: SorimaruCatalogSnapshot = {
    catalog: {
      pages: initialPage ? [initialPage] : [],
      status: initialPage ? statusFor(initialPage) : 'loading',
      error: null,
      loadingNext: false,
    },
    initialData: null,
    initialLoading: !initialPage,
    currentPage: 1,
  };
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<SorimaruCatalogSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  const query = () => ({
    language: 'ko-KR', limit: 12,
    ...(scope.category === '전체' ? {} : { category: scope.category }),
    ...(scope.regionCode ? { regionCode: scope.regionCode } : {}),
  });

  async function requestScope(): Promise<void> {
    const requestGeneration = ++generation;
    const requestedScope = scopeKey;
    loadingNext = false;
    publish({ catalog: { pages: [], status: 'loading', error: null, loadingNext: false }, currentPage: 1 });
    try {
      const page = await repository.listStories(query());
      if (requestGeneration !== generation || requestedScope !== scopeKey) return;
      publish({ catalog: { pages: [page], status: statusFor(page), error: null, loadingNext: false } });
    } catch (reason) {
      if (requestGeneration !== generation || requestedScope !== scopeKey) return;
      publish({ catalog: { pages: [], status: 'error', error: asError(reason), loadingNext: false } });
    }
  }

  async function loadInitial(force = false): Promise<void> {
    generation += 1;
    const requestInitialGeneration = ++initialGeneration;
    if (!initialPage || force) publish({ initialLoading: true });
    const result: SorimaruInitialData = initialPage && !force
      ? { archive: initialPage, heroStories: initialPage.items.slice(0, 7), nearbyStories: initialPage.items, archiveError: null }
      : await loadSorimaruInitialData(repository);
    if (requestInitialGeneration !== initialGeneration) return;
    initialReady = true;
    initialArchive = result.archive;
    publish({ initialData: result, initialLoading: false });
    if (scopeKey !== baseScope) {
      await requestScope();
      return;
    }
    publish({
      catalog: result.archive
        ? { pages: [result.archive], status: statusFor(result.archive), error: null, loadingNext: false }
        : { pages: [], status: 'error', error: result.archiveError, loadingNext: false },
      currentPage: 1,
    });
  }

  async function setScope(category: string, regionCode?: string): Promise<void> {
    const nextKey = `${category}\u0000${regionCode ?? ''}`;
    if (nextKey === scopeKey) return;
    scope = { category, regionCode };
    scopeKey = nextKey;
    generation += 1;
    loadingNext = false;
    if (!initialReady) return;
    if (scopeKey === baseScope) {
      publish({
        catalog: initialArchive
          ? { pages: [initialArchive], status: statusFor(initialArchive), error: null, loadingNext: false }
          : { pages: [], status: 'error', error: snapshot.initialData?.archiveError ?? new Error('Sorimaru archive request failed'), loadingNext: false },
        currentPage: 1,
      });
      return;
    }
    await requestScope();
  }

  async function loadNextPage(): Promise<void> {
    const lastPage = snapshot.catalog.pages.at(-1);
    if (loadingNext || !lastPage?.hasMore || !lastPage.nextCursor) return;
    const requestGeneration = generation;
    const requestedScope = scopeKey;
    loadingNext = true;
    publish({ catalog: { ...snapshot.catalog, error: null, loadingNext: true } });
    try {
      const pages = await loadNextSorimaruPage(repository, snapshot.catalog.pages, query());
      if (requestGeneration !== generation || requestedScope !== scopeKey) return;
      publish({
        catalog: { pages, status: 'success', error: null, loadingNext: false },
        currentPage: pages.length,
      });
    } catch (reason) {
      if (requestGeneration !== generation || requestedScope !== scopeKey) return;
      publish({ catalog: { ...snapshot.catalog, error: asError(reason), loadingNext: false } });
    } finally {
      if (requestGeneration === generation) loadingNext = false;
    }
  }

  async function goToPage(pageNumber: number): Promise<void> {
    if (pageNumber < 1 || snapshot.catalog.status === 'loading') return;
    if (pageNumber <= snapshot.catalog.pages.length) {
      publish({ currentPage: pageNumber, catalog: { ...snapshot.catalog, error: null } });
    } else if (pageNumber === snapshot.catalog.pages.length + 1) {
      await loadNextPage();
    }
  }

  async function retry(): Promise<void> {
    if (snapshot.catalog.pages.length && snapshot.catalog.error) {
      await loadNextPage();
    } else if (scopeKey === baseScope) {
      await loadInitial(true);
    } else {
      await requestScope();
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    loadInitial,
    setScope,
    loadNextPage,
    goToPage,
    retry,
  };
}

export function useSorimaruCatalog(
  repository: SorimaruRepository,
  category: string,
  regionCode?: string,
  initialPage?: SorimaruStoryPage,
) {
  const controller = useMemo(() => createSorimaruCatalogController(repository, initialPage), [repository, initialPage]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { void controller.loadInitial(); }, [controller]);
  useEffect(() => { void controller.setScope(category, regionCode); }, [controller, category, regionCode]);
  return { ...state, goToPage: controller.goToPage, retry: controller.retry };
}
