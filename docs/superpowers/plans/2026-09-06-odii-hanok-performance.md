# Odii and Hanok Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove measured Odii and Hanok loading, rendering, and lifecycle bottlenecks while preserving the visible UI, interaction flow, and perceived animation design.

**Architecture:** Keep React sections dependent on domain models and injected services. Move changing endpoint and payload details into a normalized Odii transport adapter, activate below-fold work through one reusable viewport gate, and isolate Kakao resource ownership behind lifecycle helpers. Optimize server CSS emission and high-frequency events without changing rendered geometry or motion parameters.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Emotion 11, Framer Motion 12, Vitest 4, Kakao Maps SDK

## Global Constraints

- Preserve the current layout, copy, colors, typography, controls, navigation, and interaction sequence.
- Preserve the current animation intent, direction, distance, duration, easing, and reveal order.
- Keep existing skeleton dimensions and loaded-content geometry aligned; use neutral gray skeleton surfaces.
- Already viewed sections remain revealed; reduced-motion users receive the same functional state without motion.
- Keep existing mock and fallback behavior while the backend API is unfinished.
- UI components must not depend on a concrete backend URL, query naming, or raw response shape.
- Do not introduce a new animation or data-fetching dependency.
- If a performance rewrite cannot be shown to be perceptually equivalent, retain the current animation implementation.

---

### Task 1: Incremental Emotion Server Flush

**Files:**
- Create: `src/design-system/emotionInsertion.ts`
- Test: `src/design-system/emotionInsertion.test.ts`
- Modify: `src/design-system/EmotionRegistry.tsx`

**Interfaces:**
- Produces: `createEmotionInsertionTracker(cache): { flush(): { names: string[]; css: string } | null }`
- Consumes: Emotion cache `inserted` records and the cache `insert` callback.

- [ ] **Step 1: Write the failing tracker test**

```ts
it('flushes each inserted name exactly once', () => {
  const cache = fakeCache({ alpha: '.a{color:red}' });
  const tracker = createEmotionInsertionTracker(cache);
  tracker.record('alpha');
  expect(tracker.flush()).toEqual({ names: ['alpha'], css: '.a{color:red}' });
  expect(tracker.flush()).toBeNull();
});
```

- [ ] **Step 2: Run the focused test and confirm the missing export failure**

Run: `npx vitest run src/design-system/emotionInsertion.test.ts`

- [ ] **Step 3: Implement insertion recording and incremental flush**

Wrap `cache.insert`, record only names inserted since the prior flush, and return `null` when no names are pending. Preserve `cache.compat = true` and restore no global state.

- [ ] **Step 4: Wire the tracker into `useServerInsertedHTML`**

Render no tag for an empty flush. For a non-empty flush, use `data-emotion="${cache.key} ${names.join(' ')}"` and emit only the returned CSS.

- [ ] **Step 5: Run focused tests and lint the touched files**

Run: `npx vitest run src/design-system/emotionInsertion.test.ts`

Run: `npx eslint src/design-system/EmotionRegistry.tsx src/design-system/emotionInsertion.ts src/design-system/emotionInsertion.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/design-system/EmotionRegistry.tsx src/design-system/emotionInsertion.ts src/design-system/emotionInsertion.test.ts
git commit -m "fix: flush emotion styles incrementally"
```

### Task 2: Reusable Viewport Activation

**Files:**
- Create: `src/shared/hooks/viewportActivation.ts`
- Create: `src/shared/hooks/viewportActivation.test.ts`
- Create: `src/shared/hooks/useViewportActivation.ts`

**Interfaces:**
- Produces: `createViewportActivation(onActivate): { activate(): void; isActivated(): boolean }`
- Produces: `useViewportActivation<T extends Element>({ rootMargin }): { ref: RefObject<T | null>; isActive: boolean }`

- [ ] **Step 1: Write failing idempotence tests**

```ts
it('activates once even when intersection repeats', () => {
  const onActivate = vi.fn();
  const gate = createViewportActivation(onActivate);
  gate.activate();
  gate.activate();
  expect(onActivate).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx vitest run src/shared/hooks/viewportActivation.test.ts`

- [ ] **Step 3: Implement the controller and hook**

The hook observes once with default `rootMargin: '600px 0px'`, disconnects after activation, disconnects on unmount, and activates immediately when `IntersectionObserver` is unavailable. It must never deactivate after becoming active.

- [ ] **Step 4: Run focused tests and lint**

Run: `npx vitest run src/shared/hooks/viewportActivation.test.ts`

Run: `npx eslint src/shared/hooks/viewportActivation.ts src/shared/hooks/useViewportActivation.ts src/shared/hooks/viewportActivation.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/shared/hooks
git commit -m "feat: add one-shot viewport activation"
```

### Task 3: Replaceable Odii Transport Boundary

**Files:**
- Modify: `src/features/odii-audio/api/odiiNetwork.ts`
- Modify: `src/features/odii-audio/api/odiiApi.ts`
- Modify: `src/features/odii-audio/api/odiiApi.test.ts`
- Create: `src/features/odii-audio/api/odiiNetwork.test.ts`

**Interfaces:**
- Produces: `OdiiTransportResponse = { items: Record<string, unknown>[]; totalCount: number }`
- Produces: `OdiiEndpointResolver = (request: OdiiNetworkRequest) => string`
- Produces: `OdiiResponseDecoder = (payload: unknown, request: OdiiNetworkRequest) => OdiiTransportResponse`
- Produces: `createOdiiNetworkClient({ resolveEndpoint, decodeResponse, fetcher?, timeoutMs? }): OdiiNetworkClient`
- `OdiiNetworkClient.request(request)` returns `Promise<OdiiTransportResponse>`.

- [ ] **Step 1: Add failing endpoint and decoder injection tests**

```ts
it('uses injected endpoint and decoder', async () => {
  const client = createOdiiNetworkClient({
    resolveEndpoint: () => '/future/odii',
    decodeResponse: () => ({ items: [{ stid: 'new-shape' }], totalCount: 1 }),
    fetcher,
  });
  await expect(client.request({ type: 'stories', params: {} })).resolves.toMatchObject({ totalCount: 1 });
  expect(fetcher).toHaveBeenCalledWith('/future/odii', expect.objectContaining({ signal: expect.anything() }));
});
```

- [ ] **Step 2: Run network and API tests and confirm contract failures**

Run: `npx vitest run src/features/odii-audio/api/odiiNetwork.test.ts src/features/odii-audio/api/odiiApi.test.ts`

- [ ] **Step 3: Implement the normalized transport client**

Keep `/api/odii` and the current TourAPI envelope as defaults. Construct parameters only in the default resolver, decode single or array items in the default decoder, preserve timeout/abort/log behavior, and accept an injected fetch-compatible function for tests and future hosts.

- [ ] **Step 4: Update the API adapter to consume only normalized transport output**

Replace direct reads of `response.body.items.item` with `response.items` and `response.totalCount`; keep domain mapping, daily cache, in-flight deduplication, and error propagation unchanged.

- [ ] **Step 5: Run focused tests and lint**

Run: `npx vitest run src/features/odii-audio/api/odiiNetwork.test.ts src/features/odii-audio/api/odiiApi.test.ts`

Run: `npx eslint src/features/odii-audio/api/odiiNetwork.ts src/features/odii-audio/api/odiiApi.ts src/features/odii-audio/api/odiiNetwork.test.ts src/features/odii-audio/api/odiiApi.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/features/odii-audio/api
git commit -m "refactor: isolate odii transport schema"
```

### Task 4: Odii Critical and Deferred Loading

**Files:**
- Create: `src/features/odii-audio/components/odiiInitialLoad.ts`
- Test: `src/features/odii-audio/components/odiiInitialLoad.test.ts`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`
- Modify: `src/features/odii-audio/components/SoundConstellationSection.tsx`

**Interfaces:**
- Produces: `loadOdiiInitialData(service): Promise<{ archive: OdiiStoryPage; heroStories: OdiiStoryItem[]; nearbyStories: OdiiStoryItem[] }>`
- Consumes: `useViewportActivation<HTMLDivElement>({ rootMargin: '700px 0px' })` for the sound-map request.

- [ ] **Step 1: Add a failing orchestration test**

```ts
it('derives hero stories from the first archive page without a duplicate list request', async () => {
  const result = await loadOdiiInitialData(service);
  expect(service.getStoryPage).toHaveBeenCalledTimes(1);
  expect(service.getStoryList).not.toHaveBeenCalled();
  expect(result.heroStories).toEqual(result.archive.items.slice(0, 7));
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx vitest run src/features/odii-audio/components/odiiInitialLoad.test.ts`

- [ ] **Step 3: Implement initial request consolidation**

Use one page-1 archive request as the initial archive and hero source. Keep nearby as its own request because its domain semantics differ. Guard stale async completions with an effect generation token and retain the existing section-level loading/error UI.

- [ ] **Step 4: Gate only the sound-map API effect**

Keep the existing Sound Constellation section markup, dimensions, SVG map, transitions, and local fallback visible. Attach the viewport ref to the section and skip its regional API request until activation; after activation, retain the current region cache and pagination behavior.

- [ ] **Step 5: Lazy-load closed Odii overlay modules without changing their mounted open state**

Use `next/dynamic` for `AllStoriesModal` and `SavedSoundDrawer`, with `ssr: false` and no layout-bearing loading UI. Preserve their props and existing open/close animations. Do not defer `LocalMiniPlayer` because it reflects active playback globally.

- [ ] **Step 6: Run focused tests, all Odii tests, and lint**

Run: `npx vitest run src/features/odii-audio`

Run: `npx eslint src/features/odii-audio/components/OdiiAudioFeature.tsx src/features/odii-audio/components/SoundConstellationSection.tsx src/features/odii-audio/components/odiiInitialLoad.ts src/features/odii-audio/components/odiiInitialLoad.test.ts`

- [ ] **Step 7: Commit**

```bash
git add src/features/odii-audio/components
git commit -m "perf: defer noncritical odii work"
```

### Task 5: Carousel Frame Batching and Reveal Persistence

**Files:**
- Create: `src/features/odii-audio/components/storyCarouselMetrics.ts`
- Test: `src/features/odii-audio/components/storyCarouselMetrics.test.ts`
- Modify: `src/features/odii-audio/components/StoryCarousel.tsx`
- Modify: `src/shared/components/animation/vesselRevealState.ts`
- Modify: `src/shared/components/animation/vesselRevealState.test.ts`
- Modify: `src/shared/components/animation/VesselReveal.tsx`

**Interfaces:**
- Produces: `getRailIndicator(metrics, storyCount): RailIndicator`
- Produces: `shouldUpdateRailIndicator(previous, next): boolean`
- Extends: `getVesselRevealStage` with permanent `hasRevealed` semantics.

- [ ] **Step 1: Add failing pure tests for indicator equality and reveal locking**

```ts
it('does not request semantic state for an unchanged indicator', () => {
  expect(shouldUpdateRailIndicator({ left: 10, width: 30, index: 2 }, { left: 10, width: 30, index: 2 })).toBe(false);
});

it('keeps a section bloomed after its first intersection', () => {
  expect(getVesselRevealStage({ hasRevealed: true, isIntersecting: false, top: 900, revealBoundary: 720 })).toBe('bloomed');
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx vitest run src/features/odii-audio/components/storyCarouselMetrics.test.ts src/shared/components/animation/vesselRevealState.test.ts`

- [ ] **Step 3: Batch carousel scroll work into one animation frame**

Store the latest rail metrics in refs, schedule at most one `requestAnimationFrame`, calculate the indicator once, and call React state only when `left`, `width`, or `index` changes. Cache card snap offsets after layout/resize so pointer movement does not repeatedly scan children or read `offsetLeft`.

- [ ] **Step 4: Make reveal state permanently bloom after first reveal**

Set the reveal ref when the initial position is already seen or a later intersection occurs. Preserve current scale, y, opacity, border radius, border color, shadow, duration, and easing values. With reduced motion, apply the same final state with zero-duration transitions.

- [ ] **Step 5: Run focused tests and lint**

Run: `npx vitest run src/features/odii-audio/components/storyCarouselMetrics.test.ts src/shared/components/animation/vesselRevealState.test.ts`

Run: `npx eslint src/features/odii-audio/components/StoryCarousel.tsx src/features/odii-audio/components/storyCarouselMetrics.ts src/shared/components/animation/VesselReveal.tsx src/shared/components/animation/vesselRevealState.ts`

- [ ] **Step 6: Commit**

```bash
git add src/features/odii-audio/components/StoryCarousel.tsx src/features/odii-audio/components/storyCarouselMetrics.ts src/features/odii-audio/components/storyCarouselMetrics.test.ts src/shared/components/animation
git commit -m "perf: batch odii scroll updates"
```

### Task 6: Hanok Map Lazy Activation and Resource Ownership

**Files:**
- Create: `src/hanok/sections/kakaoMapResources.ts`
- Test: `src/hanok/sections/kakaoMapResources.test.ts`
- Modify: `src/hanok/sections/HanokMap.tsx`
- Modify: `src/hanok/sections/HanokInteractiveMapFrame.tsx`

**Interfaces:**
- Produces: `createKakaoResourceScope(removeListener): KakaoResourceScope`
- `KakaoResourceScope` exposes `trackListener`, `trackOverlay`, `trackMarker`, `trackTimer`, and `dispose`.
- Consumes: `useViewportActivation<HTMLDivElement>({ rootMargin: '800px 0px' })` before rendering the dynamic map module.

- [ ] **Step 1: Add a failing disposal test**

```ts
it('removes listeners, detaches overlays and clears timers once', () => {
  const scope = createKakaoResourceScope(removeListener);
  scope.trackListener(target, 'zoom_changed', listener);
  scope.trackOverlay(overlay);
  scope.trackTimer(timerId, clearTimer);
  scope.dispose();
  expect(removeListener).toHaveBeenCalledWith(target, 'zoom_changed', listener);
  expect(overlay.setMap).toHaveBeenCalledWith(null);
  expect(clearTimer).toHaveBeenCalledWith(timerId);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx vitest run src/hanok/sections/kakaoMapResources.test.ts`

- [ ] **Step 3: Gate the map bundle near the viewport**

Keep `MapWrapper` at exactly 580px and preserve its radius/overflow. Before activation render the existing map loading state inside that wrapper; after activation render the current dynamic map component. Unsupported observers activate immediately.

- [ ] **Step 4: Scope Kakao listeners and resources by lifecycle**

Track map click, marker click, zoom, cluster click, overlays, markers, initialization timers, and cluster timers. Dispose the marker scope before every region rebuild; dispose map and marker scopes on unmount. Keep marker count, region filtering, cluster thresholds, map motion, panel motion, and marker visual CSS unchanged.

- [ ] **Step 5: Avoid eager overlay image downloads when overlays are hidden**

Build overlay DOM with `<img loading="lazy" decoding="async">` and attach overlays only under the existing visibility rule. Preserve the same URL, fallback image, dimensions, crop, labels, hover behavior, and click behavior.

- [ ] **Step 6: Run focused tests and lint**

Run: `npx vitest run src/hanok/sections/kakaoMapResources.test.ts`

Run: `npx eslint src/hanok/sections/HanokMap.tsx src/hanok/sections/HanokInteractiveMapFrame.tsx src/hanok/sections/kakaoMapResources.ts src/hanok/sections/kakaoMapResources.test.ts`

- [ ] **Step 7: Commit**

```bash
git add src/hanok/sections
git commit -m "perf: defer and clean up hanok map"
```

### Task 7: Hanok List and Overlay Bundle Stability

**Files:**
- Create: `src/hanok/sections/hanokGridModel.ts`
- Test: `src/hanok/sections/hanokGridModel.test.ts`
- Modify: `src/hanok/sections/HanokGrid.tsx`
- Modify: `src/hanok/HanokArchive.tsx`

**Interfaces:**
- Produces: `getHanokGridPage(villages, filters, page): { items: Village[]; totalPages: number; filteredCount: number }`
- Keeps `VillageDetailModal` props unchanged while dynamically importing its closed module.

- [ ] **Step 1: Add failing pagination identity tests**

```ts
it('returns stable village ids for the same filter and page', () => {
  const first = getHanokGridPage(villages, filters, 1);
  const second = getHanokGridPage(villages, filters, 1);
  expect(second.items.map((item) => item.id)).toEqual(first.items.map((item) => item.id));
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx vitest run src/hanok/sections/hanokGridModel.test.ts`

- [ ] **Step 3: Memoize filtering and pagination without altering controls**

Move filter/page calculation to the pure model and call it from `useMemo`. Keep the 12-item page size, filter semantics, scroll target, empty state, card keys, stagger amount, duration, and exit/entry sequence unchanged.

- [ ] **Step 4: Lazy-load the detail modal module**

Use `next/dynamic` with `ssr: false`; render it only after a village has been selected. Keep its existing props and all modal animations unchanged.

- [ ] **Step 5: Retain the stay accordion motion implementation**

Do not replace the current spring-driven `flex` transition because exact perceptual equivalence is not established. Confirm only seven current-batch image layers mount and document this retained cost in `improvements.md` rather than accepting an animation regression.

- [ ] **Step 6: Run focused tests and lint**

Run: `npx vitest run src/hanok/sections/hanokGridModel.test.ts`

Run: `npx eslint src/hanok/HanokArchive.tsx src/hanok/sections/HanokGrid.tsx src/hanok/sections/hanokGridModel.ts src/hanok/sections/hanokGridModel.test.ts`

- [ ] **Step 7: Commit**

```bash
git add src/hanok/HanokArchive.tsx src/hanok/sections/HanokGrid.tsx src/hanok/sections/hanokGridModel.ts src/hanok/sections/hanokGridModel.test.ts
git commit -m "perf: stabilize hanok archive rendering"
```

### Task 8: Regression Verification and Performance Remeasurement

**Files:**
- Modify: `changelog.md`
- Modify: `improvements.md`
- Modify: `handoff.md`

**Interfaces:**
- Consumes all prior task outputs.
- Produces fresh verification evidence and a resumable work record.

- [ ] **Step 1: Run the full automated suite**

Run: `npx vitest run`

Expected: all tests pass with no unhandled rejection.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint`

Run: `npm run build`

Expected: both exit 0; existing warnings, if any, are recorded verbatim and separated from new failures.

- [ ] **Step 3: Start production and capture route artifacts**

Run: `npm run start -- -p 3000`

Fetch `/odii` and `/hanok`, record raw HTML bytes, count repeated `data-emotion` names, collect route JS asset raw/gzip totals, and compare them with the design baseline. Confirm the map and Sound Constellation network work does not begin before each viewport gate activates.

- [ ] **Step 4: Verify UI and animation invariants**

At desktop and mobile widths, compare section order, dimensions, typography, colors, controls, modal/drawer flow, carousel drag/snap behavior, Hanok filters/pagination, map region interactions, and reveal timing. Verify reduced motion and back-scroll reveal persistence. If browser automation is unavailable, record the exact manual QA gap rather than claiming visual verification.

- [ ] **Step 5: Update project records**

Add the implemented behavior and measurements to `changelog.md`, record the retained stay accordion layout-animation cost in `improvements.md`, and update `handoff.md` with branch, commits, checks, measurements, and any unverified browser scenarios.

- [ ] **Step 6: Run final diff checks**

Run: `git diff --check`

Run: `git status --short`

- [ ] **Step 7: Commit documentation**

```bash
git add changelog.md improvements.md handoff.md
git commit -m "docs: record frontend performance work"
```
