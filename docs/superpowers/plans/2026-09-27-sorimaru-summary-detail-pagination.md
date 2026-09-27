# Sorimaru Summary/Detail and Cursor Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Sorimaru lists from one cursor-paginated summary request and fetch a single story detail only after the user selects that story.

**Architecture:** Add explicit domain summary/detail contracts, an application repository port, and an infrastructure HTTP repository with tab-lifetime result/in-flight dedupe. Client orchestration hooks and the audio store consume the repository; visual components receive summaries and callbacks only. The section 2 editorial rail loops over its already-loaded summaries and never drives pagination.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, Vitest, Testing Library, existing `apiRequest` client

## Global Constraints

- Preserve all existing UI, layout, animation, styling, and user-facing copy.
- Do not use mock, seed, public ODII, or empty-array fallback data to disguise backend failures.
- Use only `language`, `category`, `regionCode`, `limit`, and `cursor` for `GET /api/v1/odii/stories`.
- Use `GET /api/v1/odii/stories/{storyId}?language=ko-KR` only after explicit user selection or play intent.
- Use `nextCursor` and `hasMore`; never send `pageNo`, `numOfRows`, or guessed cursors.
- Section 2 infinite carousel loops over loaded summaries only and never initiates list/detail requests on wrap, drag, or autoplay.
- UI components do not import HTTP repositories or call `fetch`/`apiRequest` directly.
- Initial Sorimaru entry must issue one list request, at most one regions request, and zero detail requests.
- Related Issue: `#224`; merge target: `develop`.

---

## File Structure

### New files

- `src/features/sorimaru-audio/domain/sorimaruStory.ts`: summary, detail, page, region group, list query, and request-state domain types.
- `src/features/sorimaru-audio/domain/sorimaruStoryMapper.ts`: deterministic validation/mapping from backend payloads to domain types.
- `src/features/sorimaru-audio/domain/sorimaruStoryMapper.test.ts`: summary/detail/page/regions contract tests.
- `src/features/sorimaru-audio/application/SorimaruRepository.ts`: repository port and initial-data use case contracts.
- `src/features/sorimaru-audio/infrastructure/sorimaruQueryCache.ts`: stable query keys, successful result cache, and in-flight Promise dedupe.
- `src/features/sorimaru-audio/infrastructure/sorimaruHttpRepository.ts`: backend-only repository implementation.
- `src/features/sorimaru-audio/infrastructure/sorimaruHttpRepository.test.ts`: exact URL parameter, request-count, pagination, error, and dedupe tests.
- `src/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories.ts`: regions and selected-region list orchestration.
- `src/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories.test.tsx`: loading/error/empty/success and stale-response tests.
- `src/features/sorimaru-audio/store/useSorimaruAudioStore.test.ts`: on-demand detail and failure-isolation tests.
- `src/private/core-ui/sorimaru/SorimaruEditorialRail.test.tsx`: section 2 local-loop regression tests.

### Modified compatibility/composition files

- `src/features/sorimaru-audio/types/sorimaru.types.ts`: re-export domain contracts and retain only presentation-specific script types.
- `src/features/sorimaru-audio/api/sorimaruNetwork.ts`: remove public endpoint resolution and summary-to-detail fan-out; expose backend repository composition only.
- `src/features/sorimaru-audio/api/sorimaruApi.ts`: replace page-number/keyword adapter with cursor repository facade.
- `src/features/sorimaru-audio/api/sorimaruNetwork.test.ts`: replace fan-out expectations with one-list-request expectations.
- `src/features/sorimaru-audio/api/sorimaruApi.test.ts`: replace audioUrl filtering/page-number tests with cursor and summary tests.
- `src/features/sorimaru-audio/components/sorimaruInitialLoad.ts`: reuse first list results for hero and coordinate-free nearby content.
- `src/features/sorimaru-audio/components/sorimaruInitialLoad.test.ts`: assert one list and zero detail/nearby requests.
- `src/features/sorimaru-audio/store/useSorimaruAudioStore.ts`: add storyId-scoped detail status and `selectAndLoadStory`.
- `src/features/sorimaru-audio/hooks/useSorimaruAudioPlayer.ts`: play only resolved detail and keep previous audio on detail failure.
- `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`: own catalog cursor state and pass data/actions to sections.
- `src/features/sorimaru-audio/components/StoryCarousel.tsx`: accept summaries and call `onSelectStory`.
- `src/features/sorimaru-audio/components/SorimaruArchiveBrowse.tsx`: use cursor page metadata and selection callback.
- `src/features/sorimaru-audio/components/AllStoriesModal.tsx`: select summaries through the detail-loading action.
- `src/features/sorimaru-audio/components/SavedSoundDrawer.tsx`: select saved summaries through the detail-loading action.
- `src/private/core-ui/sorimaru/SorimaruEditorialRail.tsx`: remove category API calls/audioUrl filters and loop over passed summaries only.
- `src/private/core-ui/sorimaru/SoundConstellationSection.tsx`: remove repository imports/API calls and render state supplied by its parent.
- `src/features/sorimaru-audio/context/SorimaruDependencyContext.tsx`: provide the new repository port instead of the legacy service shape.
- `changelog.md`, `handoff.md`: record the behavior change and verification evidence.

---

### Task 1: Define and Validate Summary, Detail, and Cursor Page Contracts

**Files:**
- Create: `src/features/sorimaru-audio/domain/sorimaruStory.ts`
- Create: `src/features/sorimaru-audio/domain/sorimaruStoryMapper.ts`
- Create: `src/features/sorimaru-audio/domain/sorimaruStoryMapper.test.ts`
- Modify: `src/features/sorimaru-audio/types/sorimaru.types.ts`

**Interfaces:**
- Produces: `SorimaruStorySummary`, `SorimaruStoryDetail`, `SorimaruStoryPage`, `SorimaruRegionGroups`, `SorimaruListQuery`, `mapStoryPage`, `mapStoryDetail`, `mapRegionGroups`.
- Depends on: no React, Next.js, browser, store, or HTTP modules.

- [ ] **Step 1: Write failing mapper tests**

```ts
it('maps a list item without requiring audioUrl or transcript', () => {
  const page = mapStoryPage({
    schemaVersion: '1.2',
    items: [{
      storyId: 'story-1', title: '제목', audioTitle: '오디오 제목', category: '오디오 관광',
      region: { regionCode: 'kr-11', name: '서울특별시', level: 'PROVINCE', parentRegionCode: null },
      coordinates: { lat: 37.5, lng: 127 }, durationSeconds: 180, imageUrl: 'https://example.com/1.jpg',
      linkedPlaceId: null, contentTags: ['궁궐'], savedByMe: false,
    }],
    nextCursor: 'cursor-2', hasMore: true,
  });
  expect(page.items[0]).not.toHaveProperty('audioUrl');
  expect(page).toMatchObject({ nextCursor: 'cursor-2', hasMore: true });
});

it('rejects a list payload without an items array', () => {
  expect(() => mapStoryPage({ schemaVersion: '1.2' })).toThrow('Invalid Sorimaru story page');
});
```

- [ ] **Step 2: Run the mapper test and verify failure**

Run: `npm test -- src/features/sorimaru-audio/domain/sorimaruStoryMapper.test.ts`

Expected: FAIL because the new domain modules do not exist.

- [ ] **Step 3: Add exact domain contracts**

```ts
export interface SorimaruStorySummary {
  storyId: string;
  title: string;
  audioTitle: string;
  category: string;
  region: { regionCode: string; name: string; level: string; parentRegionCode: string | null };
  coordinates: { lat: number; lng: number } | null;
  durationSeconds: number;
  imageUrl: string | null;
  linkedPlaceId: string | null;
  contentTags: string[];
  savedByMe: boolean;
}

export interface SorimaruStoryDetail extends SorimaruStorySummary {
  audioUrl: string;
  transcript: Array<{ text: string; startTimeSeconds?: number }>;
}

export interface SorimaruStoryPage {
  items: SorimaruStorySummary[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SorimaruListQuery {
  language: string;
  category?: string;
  regionCode?: string;
  limit: number;
  cursor?: string;
}
```

Implement strict object/array/string/number guards. Preserve valid `items: []` as a successful empty page. Do not create default cards or audio URLs.

- [ ] **Step 4: Re-export domain types from the legacy type entry point**

Keep `ScriptLine`, `TourWaypoint`, and UI-only types in `types/sorimaru.types.ts`; re-export the new domain contracts so downstream migration can be incremental.

- [ ] **Step 5: Run mapper tests and type-check**

Run: `npm test -- src/features/sorimaru-audio/domain/sorimaruStoryMapper.test.ts && npx tsc --noEmit`

Expected: mapper tests PASS; type-check may still report legacy call sites and those failures become the checklist for Tasks 3–6.

- [ ] **Step 6: Commit the contract boundary**

```bash
git add src/features/sorimaru-audio/domain src/features/sorimaru-audio/types/sorimaru.types.ts
git commit -m "refactor: split Sorimaru summary and detail contracts"
```

### Task 2: Implement Backend-Only Repository and Query Dedupe

**Files:**
- Create: `src/features/sorimaru-audio/application/SorimaruRepository.ts`
- Create: `src/features/sorimaru-audio/infrastructure/sorimaruQueryCache.ts`
- Create: `src/features/sorimaru-audio/infrastructure/sorimaruHttpRepository.ts`
- Create: `src/features/sorimaru-audio/infrastructure/sorimaruHttpRepository.test.ts`
- Modify: `src/features/sorimaru-audio/api/sorimaruNetwork.ts`
- Modify: `src/features/sorimaru-audio/api/sorimaruNetwork.test.ts`
- Modify: `src/features/sorimaru-audio/api/sorimaruApi.ts`
- Modify: `src/features/sorimaru-audio/api/sorimaruApi.test.ts`

**Interfaces:**
- Consumes: domain types and mappers from Task 1; `apiGet` from `src/lib/api/client.ts`.
- Produces: `SorimaruRepository` and singleton `sorimaruRepository`.

- [ ] **Step 1: Write failing one-request and cursor tests**

```ts
it('lists 12 summaries with one backend request and no detail requests', async () => {
  const request = vi.fn().mockResolvedValue({ items: summaries(12), nextCursor: 'next', hasMore: true });
  const repository = createSorimaruHttpRepository(request);
  const page = await repository.listStories({ language: 'ko-KR', limit: 12 });
  expect(page.items).toHaveLength(12);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith('odii/stories', {
    language: 'ko-KR', limit: 12, category: undefined, regionCode: undefined, cursor: undefined,
  });
});

it('uses the returned cursor in exactly one next-page request', async () => {
  await repository.listStories({ language: 'ko-KR', limit: 12, cursor: 'cursor-2' });
  expect(request).toHaveBeenCalledWith('odii/stories', expect.objectContaining({ cursor: 'cursor-2' }));
  expect(request).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run repository tests and verify failure**

Run: `npm test -- src/features/sorimaru-audio/infrastructure/sorimaruHttpRepository.test.ts`

Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Define the application port**

```ts
export interface SorimaruRepository {
  listStories(query: SorimaruListQuery, options?: { force?: boolean }): Promise<SorimaruStoryPage>;
  getStoryDetail(storyId: string, language?: string, options?: { force?: boolean }): Promise<SorimaruStoryDetail>;
  listRegionGroups(language?: string, options?: { force?: boolean }): Promise<SorimaruRegionGroups>;
}
```

- [ ] **Step 4: Implement stable keys and tab-memory dedupe**

```ts
export const sorimaruQueryKeys = {
  list: (query: SorimaruListQuery) =>
    `odii:list:${query.language}:${query.category ?? ''}:${query.regionCode ?? ''}:${query.cursor ?? ''}:${query.limit}`,
  detail: (storyId: string, language: string) => `odii:detail:${language}:${storyId}`,
  regions: (language: string) => `odii:regions:${language}`,
};
```

Use separate `Map<string, unknown>` success and `Map<string, Promise<unknown>>` in-flight stores. Cache only mapper-validated successes; remove failed promises in `finally`. `force: true` skips the success map but still dedupes an already-running identical request.

- [ ] **Step 5: Implement the HTTP repository**

`listStories` calls only `apiGet('odii/stories', supportedParams)`. `getStoryDetail` calls only `apiGet('odii/stories/{encodedId}', { language })`. `listRegionGroups` calls only `apiGet('odii/regions', { language })`. Remove `defaultSorimaruEndpointResolver`, public API fetch, `Promise.all(summaries.map(loadDetail))`, broad fallback catches, and the 45-second timeout override.

- [ ] **Step 6: Add detail and failure/dedupe tests**

```ts
it('dedupes concurrent detail reads and caches the success', async () => {
  let resolveRequest!: (value: typeof detailPayload) => void;
  const pending = new Promise<typeof detailPayload>((resolve) => { resolveRequest = resolve; });
  request.mockReturnValue(pending);
  const reads = Promise.all([
    repository.getStoryDetail('story-1'), repository.getStoryDetail('story-1'),
  ]);
  resolveRequest(detailPayload);
  const [first, second] = await reads;
  await repository.getStoryDetail('story-1');
  expect(first).toEqual(second);
  expect(request).toHaveBeenCalledTimes(1);
});

it('propagates a list failure instead of returning an empty page', async () => {
  request.mockRejectedValue(new Error('backend unavailable'));
  await expect(repository.listStories({ language: 'ko-KR', limit: 12 })).rejects.toThrow('backend unavailable');
});
```

- [ ] **Step 7: Replace legacy API/network exports with the composed repository**

Keep a small compatibility export only where existing dependency injection requires it. It must delegate to `SorimaruRepository`; it must not translate `pageNo`/`keyword`, filter on `audioUrl`, or call a detail endpoint while listing.

- [ ] **Step 8: Run repository and legacy API tests**

Run: `npm test -- src/features/sorimaru-audio/infrastructure/sorimaruHttpRepository.test.ts src/features/sorimaru-audio/api/sorimaruNetwork.test.ts src/features/sorimaru-audio/api/sorimaruApi.test.ts`

Expected: PASS and assertions show one list request for 12 summaries and zero detail calls.

- [ ] **Step 9: Commit the repository boundary**

```bash
git add src/features/sorimaru-audio/application src/features/sorimaru-audio/infrastructure src/features/sorimaru-audio/api
git commit -m "fix: remove Sorimaru list detail fan-out"
```

### Task 3: Reuse Initial Results and Implement Cursor Catalog State

**Files:**
- Modify: `src/features/sorimaru-audio/components/sorimaruInitialLoad.ts`
- Modify: `src/features/sorimaru-audio/components/sorimaruInitialLoad.test.ts`
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`
- Modify: `src/features/sorimaru-audio/context/SorimaruDependencyContext.tsx`

**Interfaces:**
- Consumes: `SorimaruRepository.listStories`, `SorimaruStoryPage`.
- Produces: initial summary state plus `loadNextPage()` that uses only the last `nextCursor`.

- [ ] **Step 1: Replace the initial-load test with one-request expectations**

```ts
it('uses one first page for archive, hero, and coordinate-free nearby content', async () => {
  const repository = { listStories: vi.fn().mockResolvedValue(page), getStoryDetail: vi.fn(), listRegionGroups: vi.fn() };
  const result = await loadSorimaruInitialData(repository);
  expect(repository.listStories).toHaveBeenCalledOnce();
  expect(repository.listStories).toHaveBeenCalledWith({ language: 'ko-KR', limit: 12 });
  expect(repository.getStoryDetail).not.toHaveBeenCalled();
  expect(result.heroStories).toEqual(page.items.slice(0, 7));
  expect(result.nearbyStories).toBe(page.items);
});
```

- [ ] **Step 2: Run the initial-load test and verify failure**

Run: `npm test -- src/features/sorimaru-audio/components/sorimaruInitialLoad.test.ts`

Expected: FAIL because the current implementation calls `getNearbyStories()` separately.

- [ ] **Step 3: Implement one-request initial loading**

Call `repository.listStories({ language: 'ko-KR', limit: 12 })` once. Derive hero with `slice(0, 7)` and assign coordinate-free nearby to the same `items` array. Preserve `archiveError`; do not manufacture a separate nearby success after archive failure.

- [ ] **Step 4: Replace numbered API pagination in the feature container**

Maintain:

```ts
type CatalogState = {
  pages: SorimaruStoryPage[];
  status: 'loading' | 'error' | 'empty' | 'success';
  error: Error | null;
  loadingNext: boolean;
};
```

`loadNextPage` reads the final page's `nextCursor`; it returns early when `hasMore` is false or `nextCursor` is null. Merge by `storyId`. Keep a request-generation ref so a result for an old category/region cannot overwrite the current scope.

- [ ] **Step 5: Run initial-load tests and type-check**

Run: `npm test -- src/features/sorimaru-audio/components/sorimaruInitialLoad.test.ts && npx tsc --noEmit`

Expected: initial-load tests PASS; remaining type failures are limited to summary/detail presentation migration.

- [ ] **Step 6: Commit initial reuse and cursor state**

```bash
git add src/features/sorimaru-audio/components/sorimaruInitialLoad* src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx src/features/sorimaru-audio/context/SorimaruDependencyContext.tsx
git commit -m "feat: page Sorimaru summaries by cursor"
```

### Task 4: Load and Cache Detail on User Selection

**Files:**
- Modify: `src/features/sorimaru-audio/store/useSorimaruAudioStore.ts`
- Create: `src/features/sorimaru-audio/store/useSorimaruAudioStore.test.ts`
- Modify: `src/features/sorimaru-audio/hooks/useSorimaruAudioPlayer.ts`

**Interfaces:**
- Consumes: `SorimaruRepository.getStoryDetail` and `SorimaruStorySummary`.
- Produces: `selectAndLoadStory(summary, intent)`, `detailStatusById`, `detailErrorById`, and resolved `currentStory` detail.

- [ ] **Step 1: Write failing selection/dedupe tests**

```ts
it('loads only the selected detail once and reuses it on reselection', async () => {
  repository.getStoryDetail.mockResolvedValue(detail);
  await store.getState().selectAndLoadStory(summary, 'play');
  await store.getState().selectAndLoadStory(summary, 'play');
  expect(repository.getStoryDetail).toHaveBeenCalledTimes(1);
  expect(store.getState().currentStory?.audioUrl).toBe(detail.audioUrl);
});

it('keeps summaries and the previous detail when a new detail fails', async () => {
  store.setState({ availableStories: [summaryA, summaryB], currentStory: detailA });
  repository.getStoryDetail.mockRejectedValue(new Error('detail failed'));
  await expect(store.getState().selectAndLoadStory(summaryB, 'play')).rejects.toThrow('detail failed');
  expect(store.getState().availableStories).toEqual([summaryA, summaryB]);
  expect(store.getState().currentStory).toEqual(detailA);
});
```

- [ ] **Step 2: Run store tests and verify failure**

Run: `npm test -- src/features/sorimaru-audio/store/useSorimaruAudioStore.test.ts`

Expected: FAIL because `selectAndLoadStory` and per-story detail states do not exist.

- [ ] **Step 3: Implement story-scoped selection state**

Replace `setCurrentStory(summary)` as the user-interaction entry point with:

```ts
selectAndLoadStory: async (summary, intent = 'select') => {
  set((state) => ({ detailStatusById: { ...state.detailStatusById, [summary.storyId]: 'loading' } }));
  try {
    const detail = await repository.getStoryDetail(summary.storyId, 'ko-KR');
    setResolvedDetail(detail, intent === 'play');
  } catch (error) {
    setStoryDetailError(summary.storyId, error);
    throw error;
  }
}
```

Do not clear `availableStories` or a previously resolved `currentStory` on failure. Parse transcript only after detail success.

- [ ] **Step 4: Update the audio player**

The player must observe `SorimaruStoryDetail | null`. Do not assign an empty `audioUrl` placeholder to summaries. Keep the existing audio element and media-session behavior after detail resolution.

- [ ] **Step 5: Run store/player tests and type-check**

Run: `npm test -- src/features/sorimaru-audio/store/useSorimaruAudioStore.test.ts src/features/sorimaru-audio/hooks && npx tsc --noEmit`

Expected: detail tests PASS; a failed selected detail leaves list state intact.

- [ ] **Step 6: Commit on-demand detail loading**

```bash
git add src/features/sorimaru-audio/store src/features/sorimaru-audio/hooks/useSorimaruAudioPlayer.ts
git commit -m "feat: load Sorimaru detail on selection"
```

### Task 5: Make Section 2 Infinite Rail Purely Local

**Files:**
- Modify: `src/private/core-ui/sorimaru/SorimaruEditorialRail.tsx`
- Create: `src/private/core-ui/sorimaru/SorimaruEditorialRail.test.tsx`
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`

**Interfaces:**
- Consumes: loaded `SorimaruStorySummary[]`, optional pre-grouped summary sets, and `onSelectStory(summary, 'play')`.
- Produces: no network behavior; carousel-only visual interaction.

- [ ] **Step 1: Write a failing no-fetch wrap test**

Render the rail with 17 summaries and an `onSelectStory` spy. Advance fake timers through at least 20 autoplay transitions, click next until the index wraps, and assert:

```ts
const storyIds = new Set(summaries.map((story) => story.storyId));
const renderedIds = screen.getAllByTestId('sorimaru-editorial-card').map((card) => card.dataset.storyId);
expect(renderedIds.every((storyId) => storyId !== undefined && storyIds.has(storyId))).toBe(true);
expect(repository.listStories).not.toHaveBeenCalled();
expect(repository.getStoryDetail).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run the rail test and verify failure**

Run: `npm test -- src/private/core-ui/sorimaru/SorimaruEditorialRail.test.tsx`

Expected: FAIL because the rail currently calls `getStoryList` on activation, category change, hover, and focus.

- [ ] **Step 3: Remove API ownership from the rail**

Delete `apiService`, `useSorimaruApiService`, `loadCategoryStories`, `categoryLoadPromisesRef`, API preloading, and `audioUrl` filters. Build category subsets only from passed summaries and `contentTags/category/title/region.name`. Do not slice the source to 10; if 17 summaries are provided, all 17 are valid loop members.

- [ ] **Step 4: Preserve the existing infinite visual algorithm**

Keep `activePosition`, modulo indexing, GSAP translation, timers, drag/click behavior, responsive card metrics, headings, tabs, card markup, dimensions, and styling unchanged. Replace only data acquisition and selection callbacks.

- [ ] **Step 5: Route card activation through on-demand detail**

When the active card is clicked, call `onSelectStory(summary, 'play')`. Carousel movement without card activation must call neither list nor detail APIs.

- [ ] **Step 6: Run rail tests and visual type checks**

Run: `npm test -- src/private/core-ui/sorimaru/SorimaruEditorialRail.test.tsx && npx tsc --noEmit`

Expected: 17-summary looping PASS, zero network calls during wrap, unchanged component markup/styled definitions.

- [ ] **Step 7: Commit section 2 isolation**

```bash
git add src/private/core-ui/sorimaru/SorimaruEditorialRail* src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx
git commit -m "fix: keep Sorimaru section two carousel local"
```

### Task 6: Move Region Fetching Out of SoundConstellationSection

**Files:**
- Create: `src/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories.ts`
- Create: `src/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories.test.tsx`
- Modify: `src/private/core-ui/sorimaru/SoundConstellationSection.tsx`
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`

**Interfaces:**
- Consumes: repository `listRegionGroups` and `listStories`.
- Produces: `{ groupsState, selectedRegionId, regionStoriesState, selectRegion, loadNextRegionPage, retryGroups, retryRegion }`.

- [ ] **Step 1: Write hook state and request-count tests**

Cover these exact cases:

```ts
expect(initial.groupsState.status).toBe('loading');
expect(success.groupsState.status).toBe('success');
expect(empty.regionStoriesState.status).toBe('empty');
expect(failure.regionStoriesState.status).toBe('error');
expect(repository.listRegionGroups).toHaveBeenCalledTimes(1);
expect(repository.listStories).toHaveBeenCalledTimes(1);
expect(repository.getStoryDetail).not.toHaveBeenCalled();
```

Add a deferred two-region test proving the late first response cannot overwrite the second selection.

- [ ] **Step 2: Run hook tests and verify failure**

Run: `npm test -- src/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the orchestration hook**

Load groups once when the section becomes active. Map a selected visual region only to region codes present in the successful groups response. If no exact group exists, return a successful empty state and do not invent a code. Use `nextCursor` for `loadNextRegionPage`, and generation counters for region changes.

- [ ] **Step 4: Convert SoundConstellationSection to props-only data flow**

Remove `fetchSorimaruRegionGroups`, `useSorimaruApiService`, local request caches, list calls, and catch-to-local-list fallbacks. Keep hover, scroll virtualization, SVG, motion, styled components, and copy unchanged. Receive:

```ts
interface SoundConstellationSectionProps {
  groupsState: RegionGroupsState;
  regionStoriesState: RegionStoriesState;
  selectedRegionId: string;
  onSelectRegion(regionId: string): void;
  onLoadMore(): void;
  onSelectStory(story: SorimaruStorySummary): void;
  onRetry(): void;
}
```

- [ ] **Step 5: Preserve visible state semantics without new copy**

Reuse existing spinner/skeleton and empty presentation. For error, reuse the page-level existing error alert via the parent callback; do not set all region counts to zero. A legitimate successful group omission may render that region as empty.

- [ ] **Step 6: Run hook, component, and motion tests**

Run: `npm test -- src/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories.test.tsx src/private/core-ui/sorimaru/soundConstellationScroll.test.ts src/private/core-ui/sorimaru/soundConstellationMotion.test.ts && npx tsc --noEmit`

Expected: PASS with one regions request and one list request per first region selection.

- [ ] **Step 7: Commit region orchestration**

```bash
git add src/features/sorimaru-audio/presentation src/private/core-ui/sorimaru/SoundConstellationSection.tsx src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx
git commit -m "refactor: centralize Sorimaru region loading"
```

### Task 7: Migrate Remaining Cards to Summary Props and Selection Actions

**Files:**
- Modify: `src/features/sorimaru-audio/components/StoryCarousel.tsx`
- Modify: `src/features/sorimaru-audio/components/SorimaruArchiveBrowse.tsx`
- Modify: `src/features/sorimaru-audio/components/AllStoriesModal.tsx`
- Modify: `src/features/sorimaru-audio/components/SavedSoundDrawer.tsx`
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`
- Modify: `src/features/sorimaru-audio/api/recommendationAdapter.ts`
- Modify: `src/features/sorimaru-audio/hooks/useSorimaruPlaceStory.ts`
- Modify: `src/app/api/journey-curator/explore/route.ts`

**Interfaces:**
- Consumes: `SorimaruStorySummary`, `selectAndLoadStory`, cursor list operations.
- Produces: no list-time dependency on `audioUrl`/script and no legacy keyword/page methods.

- [ ] **Step 1: Add or update component tests for summary-only cards**

For each list surface, construct a summary with no `audioUrl` or transcript and assert the title/card renders. Click the card and assert only the supplied `onSelectStory(summary)` callback fires.

- [ ] **Step 2: Run targeted component tests and verify failures**

Run: `npm test -- src/features/sorimaru-audio/components src/private/core-ui/sorimaru`

Expected: legacy tests fail where `SorimaruStoryItem.audioUrl` is required or direct store setters are used.

- [ ] **Step 3: Replace legacy field reads**

Use `storyId`, `durationSeconds`, `coordinates`, `contentTags`, `region.name`, and `imageUrl`. Remove list filtering on `audioUrl`, default scripts, default coordinates, and placeholder detail values. Keep existing fallback image rendering behavior in the image hook/component only.

- [ ] **Step 4: Replace direct selection setters**

Every card/play click calls `selectAndLoadStory(summary, 'play')` or the callback supplied by its container. Saved resources that contain only summary metadata must also resolve detail before playback.

- [ ] **Step 5: Remove unsupported list APIs from auxiliary consumers**

`recommendationAdapter`, place-story lookup, and journey exploration may filter already-loaded summaries or issue one supported `listStories` query. They must not send `keyword/pageNo`, call removed nearby/themes endpoints, or trigger details per item.

- [ ] **Step 6: Run all Sorimaru tests and type-check**

Run: `npm test -- src/features/sorimaru-audio src/private/core-ui/sorimaru src/app/api/journey-curator && npx tsc --noEmit`

Expected: PASS; `rg "audioUrl.*filter|filter.*audioUrl|Promise\.all.*stor|/api/stories/(nearby|themes)|pageNo|numOfRows"` finds no production list fan-out or unsupported Sorimaru request.

- [ ] **Step 7: Commit the presentation migration**

```bash
git add src/features/sorimaru-audio src/private/core-ui/sorimaru src/app/api/journey-curator/explore/route.ts
git commit -m "refactor: render Sorimaru cards from summaries"
```

### Task 8: Verify Request Counts, Preserve UI, and Record Results

**Files:**
- Modify: `handoff.md`
- Modify: `changelog.md`
- Test: Sorimaru unit/integration/browser suites

**Interfaces:**
- Consumes: completed Tasks 1–7.
- Produces: repeatable evidence for Issue `#224` and the eventual PR.

- [ ] **Step 1: Run focused and full automated verification**

```bash
npm test -- src/features/sorimaru-audio src/private/core-ui/sorimaru
npm test
npx tsc --noEmit
npm run lint
NEXT_PUBLIC_API_BASE_URL=https://onmaru-backend.onrender.com npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Run browser request-count scenarios**

Use the existing Playwright/browser harness with request listeners matching `/api/v1/odii/stories`. Verify:

- initial entry: list 1, regions at most 1, detail 0;
- section 2 wraps with loaded 17-item fixture: list 0 additional, detail 0;
- first card click: selected detail 1, other details 0;
- same card re-click: detail 0 additional;
- next cursor: list 1 additional, detail 0;
- first region click: region list 1, detail 0;
- list failure: list section error remains distinct from empty;
- detail failure: existing list remains visible.

- [ ] **Step 3: Capture UI equivalence**

Capture desktop and mobile screenshots for the hero, section 2 editorial rail, sound constellation, nearby carousel, archive, and player before/after interaction. Compare card dimensions, copy, order, spacing, colors, animation affordances, and skeleton footprint. Any visual difference outside loading/error state is a regression to fix before proceeding.

- [ ] **Step 4: Record exact evidence**

Update `handoff.md` with before/after request counts and command results. Add a concise `changelog.md` entry stating that Sorimaru lists now use cursor-paginated summaries and details load on selection. Record that backend #454 may still be required to reduce the cost of one detail request.

- [ ] **Step 5: Commit verification records**

```bash
git add handoff.md changelog.md
git commit -m "docs: record Sorimaru request verification"
```

- [ ] **Step 6: Stop before PR creation**

Report implementation, tests, browser counts, backend contract differences, and UI comparison to the user. Do not create the `develop` PR until the user gives final approval. Immediately before that PR, invoke `cleaning-work-logs` and reference Issue `#224`.
