# Hanok Stamp API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo stamp store and leaderboard with API contract 1.3 for catalog, personal stamp book, location check-in, anonymous leaderboard, and ranking participation.

**Architecture:** Add inward-pointing domain, application, infrastructure, and presentation boundaries under `src/features/stamp`. Server responses remain the source of truth; Zustand keeps only non-persisted session snapshots and animation state, while components receive data from page props or dedicated hooks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Zustand 5, Emotion, GSAP, Sonner, Vitest 4

## Global Constraints

- API schema version is exactly `1.3`.
- Personal, ranking, and check-in requests use `credentials: 'include'` and `cache: 'no-store'`.
- CSRF tokens come from backend-root `/auth/csrf`, never from browser cookie access.
- Check-in retries reuse one UUID and one immutable location body.
- Do not persist stamp or ranking server data in localStorage, service workers, or CDN caches.
- Remove `onmaru_hanok_stamps_v1` only after a successful personal stamp-book response.
- Never log or analyze coordinates, accuracy, anonymous nickname, or ranking public ID.
- Ranking nicknames are server-generated; do not add a nickname input or title field.
- Preserve the current stamp layout and animation styling, add neutral-gray dimension-matched loading states, and respect reduced motion.
- Do not create a pull request or merge without final user approval.

---

## File Structure

- `src/features/stamp/domain/models.ts`: API 1.3 domain types and UI-compatible stamp types.
- `src/features/stamp/domain/stampRules.ts`: rarity, region, catalog/book merge, and error-copy rules.
- `src/features/stamp/application/ports.ts`: repository, geolocation, UUID, and legacy-storage interfaces.
- `src/features/stamp/application/loadStampBook.ts`: personal book loading and legacy cleanup use case.
- `src/features/stamp/application/checkInHanok.ts`: immutable location payload and bounded retry policy.
- `src/features/stamp/application/updateStampRanking.ts`: ranking participation retry policy.
- `src/features/stamp/infrastructure/stampHttpRepository.ts`: six API calls through `apiRequest`.
- `src/features/stamp/infrastructure/browserGeolocation.ts`: browser position adapter without logging.
- `src/features/stamp/infrastructure/legacyStampStorage.ts`: one-key cleanup adapter.
- `src/features/stamp/presentation/useStampStore.ts`: non-persisted server snapshot and award queue.
- `src/features/stamp/presentation/useStampSession.ts`: catalog/book lifecycle and refresh hook.
- `src/features/stamp/presentation/stampCheckInController.ts`: framework-independent check-in UI outcome orchestration.
- `src/features/stamp/presentation/useStampCheckIn.ts`: authenticated check-in UI orchestration.
- `src/features/stamp/presentation/stampRankingController.ts`: request-generation-safe ranking state transitions.
- `src/features/stamp/presentation/useStampRanking.ts`: public/personal ranking lifecycle and mutation state.
- Existing stamp and map components: rendering and interaction updates only.

### Task 1: Domain Contracts and Deterministic Mapping

**Files:**
- Create: `src/features/stamp/domain/models.ts`
- Create: `src/features/stamp/domain/stampRules.ts`
- Test: `src/features/stamp/domain/stampRules.test.ts`
- Modify: `src/features/stamp/types.ts`

**Interfaces:**
- Produces: `StampCatalogResponse`, `StampBookResponse`, `CheckInResponse`, `StampLeaderboardResponse`, `StampRankingStatusResponse`, `StampSummary`, `StampView`, `CollectedStamp`, `mergeStampCatalog`, `stampErrorMessage`.

- [x] **Step 1: Write failing mapping and error-copy tests**

```ts
it('uses personal collected state while preserving server summary', () => {
  const result = mergeStampCatalog(catalog, book);
  expect(result.stamps[0]).toMatchObject({ id: 'stamp_bukchon', collected: true });
  expect(result.summary.completionRate).toBe(25);
});

it('maps stable server and browser codes to Korean copy', () => {
  expect(stampErrorMessage({ code: 'OUTSIDE_CHECK_IN_RADIUS', requestId: 'req-1' }))
    .toContain('장소 가까이');
  expect(stampErrorMessage({ code: 'GEOLOCATION_TIMEOUT', requestId: null }))
    .toContain('다시');
});
```

- [x] **Step 2: Run `npm test -- src/features/stamp/domain/stampRules.test.ts` and verify missing-module failure**
- [x] **Step 3: Implement exact API 1.3 types, uppercase-to-lowercase rarity conversion, region-group mapping, catalog/book merge, and code-based Korean messages**

```ts
export function toStampRarity(value: ApiStampRarity): StampRarity {
  return value.toLowerCase() as StampRarity;
}

export function mergeStampCatalog(
  catalog: StampCatalogResponse,
  book: StampBookResponse | null,
): StampCollectionView {
  const personal = new Map(book?.stamps.map((stamp) => [stamp.code, stamp]));
  return {
    summary: book?.summary ?? emptyStampSummary(catalog.stamps.length),
    stamps: catalog.stamps.map((stamp) => toStampView(stamp, personal.get(stamp.code))),
  };
}
```

- [x] **Step 4: Run the focused test and `npx tsc --noEmit`; verify both pass**
- [x] **Step 5: Commit with `git commit -m "feat: add stamp api domain contracts"`**

### Task 2: HTTP, Location, and Retry Adapters

**Files:**
- Create: `src/features/stamp/application/ports.ts`
- Create: `src/features/stamp/application/checkInHanok.ts`
- Create: `src/features/stamp/application/updateStampRanking.ts`
- Create: `src/features/stamp/infrastructure/stampHttpRepository.ts`
- Create: `src/features/stamp/infrastructure/browserGeolocation.ts`
- Test: `src/features/stamp/application/checkInHanok.test.ts`
- Test: `src/features/stamp/application/updateStampRanking.test.ts`
- Test: `src/features/stamp/infrastructure/stampHttpRepository.test.ts`

**Interfaces:**
- Consumes: Task 1 response and error types.
- Produces: `StampRepository`, `PositionProvider`, `runHanokCheckIn`, `setStampRankingParticipation`, `createStampHttpRepository`, `browserPositionProvider`.

- [x] **Step 1: Write failing repository contract tests for all six paths and options**

```ts
expect(calls).toContainEqual({ path: '/stamps', options: { method: 'GET', cache: 'no-store' } });
expect(calls).toContainEqual({ path: '/me/stamp-book', options: { method: 'GET', cache: 'no-store' } });
expect(calls).toContainEqual({
  path: '/me/stamp-ranking',
  options: { method: 'PUT', body: { participating: true }, cache: 'no-store', csrf: true },
});
```

- [x] **Step 2: Run the repository test and verify missing implementation failure**
- [x] **Step 3: Implement `createStampHttpRepository(request = apiRequest)` with catalog, book, check-in, leaderboard, personal ranking, and participation methods**
- [x] **Step 4: Run the repository test and verify it passes**
- [x] **Step 5: Write failing check-in tests proving one UUID/body across one 503 retry, one CSRF retry, and no retry for conflict**

```ts
await runHanokCheckIn('place-1', ports);
expect(repository.checkIn).toHaveBeenCalledTimes(2);
expect(repository.checkIn.mock.calls[0]).toEqual(repository.checkIn.mock.calls[1]);
```

- [x] **Step 6: Implement the bounded retry loop and browser geolocation adapter with `enableHighAccuracy: true`, `timeout: 10_000`, and `maximumAge: 0`**
- [x] **Step 7: Write and pass ranking tests for CSRF refresh once, `RATE_LIMITED` metadata preservation, and unrestricted withdrawal calls**
- [x] **Step 8: Run all Task 2 tests and `npx tsc --noEmit`; verify they pass**
- [x] **Step 9: Commit with `git commit -m "feat: add stamp api infrastructure"`**

### Task 3: Non-Persisted Stamp Session

**Files:**
- Create: `src/features/stamp/application/loadStampBook.ts`
- Create: `src/features/stamp/infrastructure/legacyStampStorage.ts`
- Create: `src/features/stamp/presentation/useStampStore.ts`
- Create: `src/features/stamp/presentation/useStampSession.ts`
- Test: `src/features/stamp/application/loadStampBook.test.ts`
- Test: `src/features/stamp/presentation/useStampStore.test.ts`
- Modify: `src/features/stamp/hooks/useStampStore.ts`
- Modify: `src/features/stamp/index.ts`
- Modify: `src/features/map/components/PlaceMarkers.tsx`

**Interfaces:**
- Consumes: `StampRepository`, domain responses.
- Produces: `loadPersonalStampBook`, `useStampStore`, `useStampSession`, `isPlaceVisited`, `enqueueAwards`, `showNextAward`.

- [x] **Step 1: Write a failing test proving legacy data is removed after success and retained after failure**

```ts
await expect(loadPersonalStampBook(successRepository, storage)).resolves.toEqual(book);
expect(storage.removeLegacyStampData).toHaveBeenCalledOnce();
await expect(loadPersonalStampBook(failingRepository, storage)).rejects.toBeDefined();
expect(storage.removeLegacyStampData).toHaveBeenCalledOnce();
```

- [x] **Step 2: Run the test and verify missing implementation failure**
- [x] **Step 3: Implement the use case and `onmaru_hanok_stamps_v1` storage adapter**
- [x] **Step 4: Write failing store tests proving no persisted middleware, book trigger-place restoration, current-session check-in recording, and ordered award queue behavior**
- [x] **Step 5: Replace the old persisted demo store with the in-memory presentation store and keep `hooks/useStampStore.ts` as a compatibility re-export until all consumers migrate**
- [x] **Step 6: Implement `useStampSession` to load only after auth resolution, clear private state on logout, and expose retry/refresh**
- [x] **Step 7: Update marker reads to the new store without changing marker visuals**
- [x] **Step 8: Run focused tests and `npx tsc --noEmit`; verify they pass**
- [x] **Step 9: Commit with `git commit -m "refactor: replace demo stamp persistence"`**

### Task 4: Server-Sourced Stamp Book Presentation

**Files:**
- Modify: `src/app/stamps/page.tsx`
- Modify: `src/features/stamp/components/StampBook.tsx`
- Modify: `src/features/stamp/components/StampCard.tsx`
- Create: `src/features/stamp/components/StampBookSkeleton.tsx`
- Modify: `src/features/stamp/components/KoreaMapCanvas.tsx`
- Modify: `src/features/stamp/components/StampSealAnimation.tsx`

**Interfaces:**
- Consumes: `useStampSession`, `mergeStampCatalog`, server summary and award queue.
- Produces: catalog/book loading, guest locked state, retry state, and sequential award display.

- [x] **Step 1: Add a failing pure presentation-model test for guest, loading, success, and retry states in `stampRules.test.ts`**
- [x] **Step 2: Run the focused test and verify the new state selector is absent**
- [x] **Step 3: Make `StampsPage` fetch the public catalog through the repository with a caught error result and pass it into `StampBook`**
- [x] **Step 4: Refactor `StampBook` to use server catalog/book data and server `completionRate`, retaining title-first hierarchy, filters, map, cards, and current dimensions**
- [x] **Step 5: Add a neutral skeleton that uses the same hero and card-grid dimension tokens as the live content**
- [x] **Step 6: Make locked cards non-award actions for guests, wire retry, and advance every queued award when the seal modal closes**
- [x] **Step 7: Guard reveal animation so data refresh does not replay already-seen content and reduced-motion users receive final state immediately**
- [x] **Step 8: Run focused tests, `npx tsc --noEmit`, and `npm run lint`; fix only touched-code failures**
- [x] **Step 9: Commit with `git commit -m "feat: connect server stamp book"`**

### Task 5: Authenticated Map Check-In

**Files:**
- Create: `src/features/stamp/presentation/stampCheckInController.ts`
- Create: `src/features/stamp/presentation/useStampCheckIn.ts`
- Modify: `src/features/map/components/PlaceDetail.tsx`
- Modify: `src/features/map/components/detail/PlaceDetail.styles.ts`
- Modify: `src/features/map/MapPage.tsx`
- Test: `src/features/stamp/presentation/stampCheckInController.test.ts`

**Interfaces:**
- Consumes: `runHanokCheckIn`, auth state, session refresh, award queue.
- Produces: `checkIn(placeId)`, `checkingIn`, code-based feedback, and successful visit memory.

- [ ] **Step 1: Write failing orchestration tests for guest login intent, duplicate success, ordered multi-award queue, geolocation failures, and server error copy**
- [ ] **Step 2: Run the test and verify missing hook/controller behavior**
- [ ] **Step 3: Implement the hook around an exported testable controller, with no coordinate values passed to logs or toast strings**
- [ ] **Step 4: Replace `PlaceDetail` local classification award logic with authenticated server check-in, disable the button while pending, and show login/retry/success feedback through Sonner**
- [ ] **Step 5: Keep the button hidden after `NOT_FOUND` for the selected place during the current session and reset that state when the place changes**
- [ ] **Step 6: Use the shared award queue in `MapPage` so all `newAwards` display sequentially**
- [ ] **Step 7: Run focused tests, `npx tsc --noEmit`, and `npm run lint`; verify pass**
- [ ] **Step 8: Commit with `git commit -m "feat: connect location verified stamp check-in"`**

### Task 6: Anonymous Leaderboard and Participation

**Files:**
- Create: `src/features/stamp/presentation/stampRankingController.ts`
- Create: `src/features/stamp/presentation/useStampRanking.ts`
- Rewrite: `src/features/stamp/components/StampLeaderboard.tsx`
- Modify: `src/features/stamp/components/StampBook.tsx`
- Test: `src/features/stamp/presentation/stampRankingController.test.ts`

**Interfaces:**
- Consumes: public and personal ranking repository methods, auth login callback, CSRF-aware participation use case.
- Produces: `entries`, `myRanking`, `loading`, `mutationPending`, `retryAfterSeconds`, `join`, `withdraw`, `reload`.

- [ ] **Step 1: Write failing controller tests for public guest loading, logged-in nonparticipant, participant outside top 20, join refresh, withdrawal refresh, 429 countdown data, and stale-request suppression**
- [ ] **Step 2: Run the test and verify missing implementation failure**
- [ ] **Step 3: Implement ranking state orchestration with request generation checks and no persistence**
- [ ] **Step 4: Replace `LEADERBOARD_MOCK` with pure props and render server fields only: rank, generated nickname, stamp count, region count, and completion rate**
- [ ] **Step 5: Add guest login CTA, nonparticipant generated-name policy copy and join action, participant summary and withdrawal action, empty state, exact-size loading rows, error and retry states**
- [ ] **Step 6: Keep withdrawal enabled independently of join rate limiting; after successful withdrawal refresh both public and personal endpoints**
- [ ] **Step 7: Remove obsolete `LeaderboardUser` and any title/current-user hardcoding**
- [ ] **Step 8: Run focused tests, `npx tsc --noEmit`, and `npm run lint`; verify pass**
- [ ] **Step 9: Commit with `git commit -m "feat: connect anonymous stamp leaderboard"`**

### Task 7: Work Logs and Full Verification

**Files:**
- Modify: `handoff.md`
- Modify: `changelog.md`
- Modify: `improvements.md`

**Interfaces:**
- Consumes: completed Tasks 1 through 6.
- Produces: resumable status, user-facing change record, and explicit visited-place API follow-up.

- [ ] **Step 1: Record Issue #262 integration, changed boundaries, API 1.3 behavior, and exact verification results in `handoff.md`**
- [ ] **Step 2: Add a concise Unreleased entry to `changelog.md`**
- [ ] **Step 3: Record the missing all-visited-place restoration contract in `improvements.md` without claiming it is implemented**
- [ ] **Step 4: Run `npm test -- src/features/stamp src/lib/api/client.contract.test.ts`**
- [ ] **Step 5: Run `npx tsc --noEmit`**
- [ ] **Step 6: Run `npm run lint`**
- [ ] **Step 7: Run `npm run build`**
- [ ] **Step 8: If browser execution is available, run the app against API 1.3 and inspect `/stamps` plus a traditional-place detail at desktop and mobile widths; capture only non-sensitive screenshots**
- [ ] **Step 9: Run `git diff --check` and inspect `git status --short` to ensure only intended changes remain**
- [ ] **Step 10: Commit documentation with `git commit -m "docs: record stamp api integration"`**
