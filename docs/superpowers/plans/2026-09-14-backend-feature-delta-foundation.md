# Backend Feature Delta Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the testable frontend contract foundation for backend-backed journey runs, VisitReview, shared saved resources, member timeline, CSRF, cursor pages, and neutral motion primitives.

**Architecture:** Keep UI rendering, data fetching, reducers, and transport side effects separated. API modules expose repository-shaped functions that can be replaced by test doubles; reducers and validators are pure functions tested before UI wiring. This plan intentionally starts with foundation code so `/discover`, `/map`, and `/mypage` can be implemented without embedding backend contract logic inside components.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Zustand where state is already used, Emotion for UI styling, native `fetch`, native `EventSource`, CSS transform/opacity animation.

## Global Constraints

- Colors must follow `AGENTS.md`: neutral gray surfaces by default, no beige/cream/parchment surface treatment.
- Preserve existing semantic colors for brand, warning, active map categories, selected states, and errors.
- Motion uses `opacity`, `transform`, and reveal wrappers that reserve final layout size.
- Do not animate width, height, flex, map marker count layout, list row dimensions, or skeleton size.
- `prefers-reduced-motion` renders all states immediately with identical functionality.
- Journey board rendering uses `ExplorationSnapshot`, never terminal SSE payload.
- VisitReview body requests happen only after an explicit user command such as `이 지역 후기 보기`.
- FE uses backend `placeId`; it must not store or compare KTO `contentId` as the saved resource identity.
- FE never stores OAuth tokens, Kakao access tokens, refresh tokens, client secret, provider subject, or private API snapshots in localStorage.
- Unsafe backend methods include CSRF header from `/auth/csrf`.
- Private response state is cleared on logout/delete-account.
- TDD is required: write a failing test, run it, implement the smallest passing code, run it again.

---

## File Structure

- Create `src/lib/api/errors.ts`: normalized backend error shape and helpers.
- Create `src/lib/api/cursor.ts`: cursor page type and `hasMore:false` guard.
- Create `src/lib/api/csrf.ts`: in-memory CSRF token cache with reset support.
- Modify `src/lib/api/client.ts`: preserve existing API exports while adding cookie/CSRF/idempotency request options.
- Create `src/features/journey-curator/api/journeyContract.ts`: journey DTOs from contract.
- Create `src/features/journey-curator/reducers/journeySseParser.ts`: parsed SSE frame parser.
- Create `src/features/journey-curator/reducers/journeyRunReducer.ts`: pure run/snapshot UI state reducer.
- Create matching Vitest files for each pure module.
- Create `src/features/visit-review/api/visitReviewContract.ts`: region/review DTOs and text validation.
- Create `src/features/visit-review/reducers/visitReviewListReducer.ts`: explicit region load reducer with stale response protection.
- Create matching Vitest files.
- Create `src/features/saved-resources/api/savedResourcesContract.ts`: saved resource DTOs and intent shape.
- Create `src/features/saved-resources/store/saveIntentStore.ts`: small storage adapter, defaulting to sessionStorage for guest intent only.
- Create matching Vitest files.
- Create `src/features/member-timeline/api/memberTimelineContract.ts`: timeline DTOs and grouping helpers.
- Create matching Vitest files.
- Create `src/shared/motion/placeSlip.ts`: reduced-motion aware motion constants.
- Update `handoff.md` and `changelog.md` after verified foundation code lands.

## Task 1: API Error, Cursor, CSRF, And Client Foundation

**Files:**
- Create: `src/lib/api/errors.ts`
- Create: `src/lib/api/cursor.ts`
- Create: `src/lib/api/csrf.ts`
- Modify: `src/lib/api/client.ts`
- Test: `src/lib/api/client.contract.test.ts`

**Interfaces:**
- Produces:
  - `type ApiErrorCode = string`
  - `type OnmaruApiError = { status: number; code: string; message: string; requestId: string | null; details: Record<string, unknown> }`
  - `function normalizeApiError(status: number, body: unknown): OnmaruApiError`
  - `type CursorPage<T> = { items: T[]; nextCursor: string | null; hasMore: boolean }`
  - `function shouldLoadNextPage(page: CursorPage<unknown>): boolean`
  - `type CsrfToken = { token: string; headerName: string }`
  - `function createCsrfTokenProvider(fetcher: typeof fetch, baseUrl: string): { getToken(): Promise<CsrfToken>; reset(): void }`
  - `function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T>`

- [x] **Step 1: Write failing tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { normalizeApiError } from './errors';
import { shouldLoadNextPage } from './cursor';
import { createCsrfTokenProvider } from './csrf';
import { apiRequest, resetApiClientForTests } from './client';

describe('api contract foundation', () => {
  it('normalizes backend error bodies by code and request id', () => {
    const error = normalizeApiError(409, {
      schemaVersion: '1.2',
      code: 'ACTIVE_RUN',
      message: 'run is active',
      requestId: 'req-1',
      details: { retryAfterMs: 500 },
    });

    expect(error).toMatchObject({
      status: 409,
      code: 'ACTIVE_RUN',
      message: 'run is active',
      requestId: 'req-1',
      details: { retryAfterMs: 500 },
    });
  });

  it('does not load another cursor page when hasMore is false', () => {
    expect(shouldLoadNextPage({ items: [{ id: 'a' }], nextCursor: null, hasMore: false })).toBe(false);
  });

  it('caches csrf token in memory and resets on demand', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' })));
    const provider = createCsrfTokenProvider(fetcher as unknown as typeof fetch, 'https://api.onmaru.test/api/v1');

    await expect(provider.getToken()).resolves.toEqual({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' });
    await provider.getToken();
    expect(fetcher).toHaveBeenCalledTimes(1);

    provider.reset();
    await provider.getToken();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('sends credentials, csrf, and idempotency key on unsafe api v1 requests', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) {
        return new Response(JSON.stringify({ token: 'csrf-1', headerName: 'X-CSRF-TOKEN' }));
      }
      return new Response(JSON.stringify({ ok: true }));
    });
    resetApiClientForTests({ baseUrl: 'https://api.onmaru.test', fetcher: fetcher as unknown as typeof fetch });

    await apiRequest('/explorations', {
      method: 'POST',
      body: { query: '전주 한옥 여행' },
      idempotencyKey: '00000000-0000-4000-8000-000000000001',
      csrf: true,
    });

    expect(fetcher).toHaveBeenLastCalledWith(
      'https://api.onmaru.test/api/v1/explorations',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Idempotency-Key': '00000000-0000-4000-8000-000000000001',
          'X-CSRF-TOKEN': 'csrf-1',
        }),
      }),
    );
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/api/client.contract.test.ts`

Expected: FAIL because `errors.ts`, `cursor.ts`, `csrf.ts`, `apiRequest`, and `resetApiClientForTests` do not exist yet.

- [x] **Step 3: Implement minimal foundation**

Implement the exported functions exactly as described in the interfaces. Keep existing `apiGet`, `apiPost`, `apiPatch`, and `apiDelete` exports working by delegating to `apiRequest`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/api/client.contract.test.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/lib/api/errors.ts src/lib/api/cursor.ts src/lib/api/csrf.ts src/lib/api/client.ts src/lib/api/client.contract.test.ts
git commit -m "feat(api): add backend contract request foundation"
```

## Task 2: Journey SSE Parser And Run Reducer

**Files:**
- Create: `src/features/journey-curator/api/journeyContract.ts`
- Create: `src/features/journey-curator/reducers/journeySseParser.ts`
- Create: `src/features/journey-curator/reducers/journeyRunReducer.ts`
- Test: `src/features/journey-curator/reducers/journeyRunReducer.test.ts`

**Interfaces:**
- Consumes: `OnmaruApiError` from `src/lib/api/errors.ts`
- Produces:
  - `type JourneySseFrame = StageFrame | TerminalFrame | HeartbeatFrame | ResetFrame`
  - `function parseJourneySseFrame(input: { id?: string; event: string; data: string }): JourneySseFrame`
  - `function createInitialJourneyRunState(): JourneyRunUiState`
  - `function reduceJourneyRunState(state: JourneyRunUiState, event: JourneyRunUiEvent): JourneyRunUiState`
  - `function shouldRecoverJourneySnapshot(state: JourneyRunUiState): boolean`

- [x] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { parseJourneySseFrame } from './journeySseParser';
import {
  createInitialJourneyRunState,
  reduceJourneyRunState,
  shouldRecoverJourneySnapshot,
} from './journeyRunReducer';

describe('journey run reducer', () => {
  it('parses terminal frames without treating them as renderable board data', () => {
    const frame = parseJourneySseFrame({
      id: '2',
      event: 'run.terminal',
      data: JSON.stringify({
        schemaVersion: '1.2',
        runId: '00000000-0000-4000-8000-000000000002',
        sequence: 2,
        status: 'COMPLETED',
        outcome: 'INITIAL_BOARD',
      }),
    });

    const state = reduceJourneyRunState(createInitialJourneyRunState(), { type: 'sse-frame', frame });

    expect(state.connection.status).toBe('terminal');
    expect(state.renderSource).toBe('snapshot');
    expect(shouldRecoverJourneySnapshot(state)).toBe(true);
  });

  it('marks reset frames as requiring snapshot recovery', () => {
    const frame = parseJourneySseFrame({
      event: 'reset',
      data: JSON.stringify({ schemaVersion: '1.2', runId: '00000000-0000-4000-8000-000000000002' }),
    });

    const state = reduceJourneyRunState(createInitialJourneyRunState(), { type: 'sse-frame', frame });

    expect(state.connection.status).toBe('reset');
    expect(shouldRecoverJourneySnapshot(state)).toBe(true);
  });

  it('renders baseline as a basic exploration result label after snapshot sync', () => {
    const state = reduceJourneyRunState(createInitialJourneyRunState(), {
      type: 'snapshot-synced',
      run: {
        schemaVersion: '1.2',
        runId: '00000000-0000-4000-8000-000000000003',
        status: 'COMPLETED',
        engine: 'BASELINE',
        degradedReason: 'AI_TIMEOUT',
        stage: null,
        outcome: 'INITIAL_BOARD',
        clarification: null,
        retryAfterMs: 0,
        createdAt: '2026-09-14T00:00:00.000Z',
        startedAt: '2026-09-14T00:00:01.000Z',
        deadlineAt: '2026-09-14T00:00:20.000Z',
        error: null,
      },
    });

    expect(state.view).toBe('baselineReady');
    expect(state.badgeLabel).toBe('기본 탐색 결과');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/journey-curator/reducers/journeyRunReducer.test.ts`

Expected: FAIL because the parser and reducer modules do not exist.

- [x] **Step 3: Implement parser and reducer**

Implement strict event names: `run.stage`, `run.terminal`, `heartbeat`, and `reset`. Throw `Error('Unsupported journey SSE event')` for unknown events.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/journey-curator/reducers/journeyRunReducer.test.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/features/journey-curator/api/journeyContract.ts src/features/journey-curator/reducers/journeySseParser.ts src/features/journey-curator/reducers/journeyRunReducer.ts src/features/journey-curator/reducers/journeyRunReducer.test.ts
git commit -m "feat(journey): add run event reducer foundation"
```

## Task 3: VisitReview Contracts And Region List Reducer

**Files:**
- Create: `src/features/visit-review/api/visitReviewContract.ts`
- Create: `src/features/visit-review/reducers/visitReviewListReducer.ts`
- Test: `src/features/visit-review/reducers/visitReviewListReducer.test.ts`

**Interfaces:**
- Consumes: `CursorPage<T>` from `src/lib/api/cursor.ts`
- Produces:
  - `function validateVisitReviewText(text: string): { ok: true; value: string } | { ok: false; reason: 'empty' | 'tooLong' | 'tooManyLines' }`
  - `function createInitialVisitReviewListState(): VisitReviewListState`
  - `function reduceVisitReviewListState(state: VisitReviewListState, event: VisitReviewListEvent): VisitReviewListState`

- [x] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { validateVisitReviewText } from '../api/visitReviewContract';
import { createInitialVisitReviewListState, reduceVisitReviewListState } from './visitReviewListReducer';

describe('visit review contract state', () => {
  it('validates review text as 1 to 300 code points with at most 5 lines', () => {
    expect(validateVisitReviewText('  좋은 한옥 경험이었어요\\r\\n다시 가고 싶어요  ')).toEqual({
      ok: true,
      value: '좋은 한옥 경험이었어요\\n다시 가고 싶어요',
    });
    expect(validateVisitReviewText('')).toEqual({ ok: false, reason: 'empty' });
    expect(validateVisitReviewText('a'.repeat(301))).toEqual({ ok: false, reason: 'tooLong' });
    expect(validateVisitReviewText('1\\n2\\n3\\n4\\n5\\n6')).toEqual({ ok: false, reason: 'tooManyLines' });
  });

  it('keeps previous reviews when stale region response arrives', () => {
    const initial = reduceVisitReviewListState(createInitialVisitReviewListState(), {
      type: 'region-load-started',
      requestSeq: 1,
      regionCode: '11',
    });
    const newer = reduceVisitReviewListState(initial, {
      type: 'region-load-started',
      requestSeq: 2,
      regionCode: '45',
    });
    const loaded = reduceVisitReviewListState(newer, {
      type: 'region-load-succeeded',
      requestSeq: 2,
      page: {
        items: [{ id: 'r2', placeId: 'p2', text: '전주 후기', likeCount: 0, likedByMe: false, mine: false, createdAt: '2026-09-14T00:00:00.000Z', status: 'PUBLISHED' }],
        nextCursor: null,
        hasMore: false,
      },
    });
    const stale = reduceVisitReviewListState(loaded, {
      type: 'region-load-succeeded',
      requestSeq: 1,
      page: {
        items: [{ id: 'r1', placeId: 'p1', text: '서울 후기', likeCount: 0, likedByMe: false, mine: false, createdAt: '2026-09-14T00:00:00.000Z', status: 'PUBLISHED' }],
        nextCursor: null,
        hasMore: false,
      },
    });

    expect(stale.reviews.map((review) => review.id)).toEqual(['r2']);
    expect(stale.selectedRegionCode).toBe('45');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/visit-review/reducers/visitReviewListReducer.test.ts`

Expected: FAIL because the modules do not exist.

- [x] **Step 3: Implement validation and reducer**

Reducer events must keep old review list on `region-load-started` and replace list only when `requestSeq` matches the latest active request.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/visit-review/reducers/visitReviewListReducer.test.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/features/visit-review/api/visitReviewContract.ts src/features/visit-review/reducers/visitReviewListReducer.ts src/features/visit-review/reducers/visitReviewListReducer.test.ts
git commit -m "feat(map): add visit review reducer foundation"
```

## Task 4: Saved Resource Intent And Timeline Contracts

**Files:**
- Create: `src/features/saved-resources/api/savedResourcesContract.ts`
- Create: `src/features/saved-resources/store/saveIntentStore.ts`
- Create: `src/features/member-timeline/api/memberTimelineContract.ts`
- Test: `src/features/saved-resources/store/saveIntentStore.test.ts`
- Test: `src/features/member-timeline/api/memberTimelineContract.test.ts`

**Interfaces:**
- Produces:
  - `type SaveIntent = { resourceType: 'PLACE'; placeId: string; desiredSaved: true; createdAt: string }`
  - `function createSaveIntentStore(storage: StorageLike, clock: { now(): Date }): SaveIntentStore`
  - `function isSupportedTimelineItem(item: TimelineItem): boolean`
  - `function formatTimelineDayLabel(date: string, locale?: string): string`

- [x] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { createSaveIntentStore } from './saveIntentStore';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe('save intent store', () => {
  it('stores only place id and desired saved state for guest login recovery', () => {
    const store = createSaveIntentStore(memoryStorage(), { now: () => new Date('2026-09-14T00:00:00.000Z') });

    store.savePlaceIntent('p-hanok-01');

    expect(store.consume()).toEqual({
      resourceType: 'PLACE',
      placeId: 'p-hanok-01',
      desiredSaved: true,
      createdAt: '2026-09-14T00:00:00.000Z',
    });
    expect(store.consume()).toBeNull();
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import { formatTimelineDayLabel, isSupportedTimelineItem } from './memberTimelineContract';

describe('member timeline contract', () => {
  it('formats day labels and hides unsupported future item types', () => {
    expect(formatTimelineDayLabel('2026-09-14')).toBe('9월 14일');
    expect(isSupportedTimelineItem({ id: 'x', type: 'SAVED_PLACE', occurredAt: '2026-09-14T00:00:00.000Z', title: '전주 한옥마을', subtitle: '한옥 · 전주', thumbnailUrl: null, target: { type: 'PLACE', placeId: 'p1' } })).toBe(true);
    expect(isSupportedTimelineItem({ id: 'x', type: 'FUTURE_EVENT' as never, occurredAt: '2026-09-14T00:00:00.000Z', title: 'x', subtitle: null, thumbnailUrl: null, target: { type: 'PLACE', placeId: 'p1' } })).toBe(false);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/features/saved-resources/store/saveIntentStore.test.ts src/features/member-timeline/api/memberTimelineContract.test.ts
```

Expected: FAIL because the modules do not exist.

- [x] **Step 3: Implement contracts and store**

Use a tiny injected `StorageLike` object so tests can use memory storage and production can use sessionStorage. Store only one pending `PLACE` intent.

- [x] **Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/features/saved-resources/store/saveIntentStore.test.ts src/features/member-timeline/api/memberTimelineContract.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/features/saved-resources/api/savedResourcesContract.ts src/features/saved-resources/store/saveIntentStore.ts src/features/saved-resources/store/saveIntentStore.test.ts src/features/member-timeline/api/memberTimelineContract.ts src/features/member-timeline/api/memberTimelineContract.test.ts
git commit -m "feat(saved): add save intent and timeline contracts"
```

## Task 5: Place Slip Motion Primitive

**Files:**
- Create: `src/shared/motion/placeSlip.ts`
- Test: `src/shared/motion/placeSlip.test.ts`

**Interfaces:**
- Produces:
  - `function getPlaceSlipMotion(options: { reducedMotion: boolean; index?: number }): { initial: Record<string, unknown>; animate: Record<string, unknown>; transition: Record<string, unknown> }`

- [x] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { getPlaceSlipMotion } from './placeSlip';

describe('place slip motion', () => {
  it('uses transform and opacity with bounded stagger and disables motion when requested', () => {
    expect(getPlaceSlipMotion({ reducedMotion: false, index: 2 })).toMatchObject({
      initial: { opacity: 0, y: 10, scaleY: 0.96 },
      animate: { opacity: 1, y: 0, scaleY: 1 },
    });
    expect(getPlaceSlipMotion({ reducedMotion: false, index: 10 }).transition.delay).toBeLessThanOrEqual(0.28);
    expect(getPlaceSlipMotion({ reducedMotion: true, index: 10 })).toEqual({
      initial: { opacity: 1, y: 0, scaleY: 1 },
      animate: { opacity: 1, y: 0, scaleY: 1 },
      transition: { duration: 0 },
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/motion/placeSlip.test.ts`

Expected: FAIL because the module does not exist.

- [x] **Step 3: Implement motion primitive**

Use delay `Math.min((index ?? 0) * 0.05, 0.28)`, duration `0.32`, and easing `[0.16, 1, 0.3, 1]`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shared/motion/placeSlip.test.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/shared/motion/placeSlip.ts src/shared/motion/placeSlip.test.ts
git commit -m "feat(ui): add place slip motion primitive"
```

## Task 6: Foundation Verification And Work Logs

**Files:**
- Modify: `handoff.md`
- Modify: `changelog.md`

**Interfaces:**
- Consumes: all modules from Tasks 1-5.
- Produces: verified worklog entries and clean git status.

- [x] **Step 1: Run focused tests**

Run:

```bash
npx vitest run src/lib/api/client.contract.test.ts src/features/journey-curator/reducers/journeyRunReducer.test.ts src/features/visit-review/reducers/visitReviewListReducer.test.ts src/features/saved-resources/store/saveIntentStore.test.ts src/features/member-timeline/api/memberTimelineContract.test.ts src/shared/motion/placeSlip.test.ts
```

Expected: PASS.

- [x] **Step 2: Run TypeScript**

Run: `npx tsc --noEmit`

Expected: PASS.

- [x] **Step 3: Run build output baseline**

Run: `npm run build`

Expected: PASS, or document pre-existing unrelated failures in `handoff.md`.

- [x] **Step 4: Update logs**

Add a short summary to `handoff.md` and `changelog.md` describing the contract foundation, tests, and any verification gaps.

- [x] **Step 5: Commit logs**

```bash
git add handoff.md changelog.md
git commit -m "docs: record backend feature foundation progress"
```

## Self-Review

- Spec coverage: this plan implements the foundation portions of API client, pure reducers, VisitReview state, saved intent, timeline contracts, and motion primitive. It intentionally leaves route UI wiring for the next plan after these contracts are stable.
- Draft marker scan: no unresolved draft markers remain.
- Type consistency: exported names used in later tasks are defined in earlier tasks.
- Scope check: the original spec covers multiple screens. This first plan is scoped to independently testable foundation code, which reduces risk before touching large UI files.
