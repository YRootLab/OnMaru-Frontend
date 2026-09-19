# Backend Feature Delta FE Design

Date: 2026-09-14
Source package: `/Users/yangseunghyeon/Development/OnMaru/OnMaruBE/docs/toFE`
Primary contracts: backend `docs/contracts/rest-api.md`, `journey.openapi.yaml`, `visit-reviews.openapi.json`, `journey-sse-event.schema.json`

## Purpose

OnMaru now needs to move several prototype/local features onto backend-owned contracts:

- `/discover` AI journey runs use REST commands, SSE notifications, and snapshot recovery.
- `/map` adds VisitReview as a short public visit-review model separate from the existing warmth experience.
- Hanok, map, and Odii-linked cards share one canonical `PLACE` save action.
- `/mypage` shows a monthly personal timeline from backend state.
- Auth moves toward cookie sessions, CSRF for unsafe requests, opaque member identity, and no private localStorage snapshots.

This spec translates those backend changes into frontend architecture, UI states, motion direction, performance constraints, and fixture-driven acceptance criteria.

## Current FE Context

- `src/app/discover/page.tsx` currently redirects to `/`; the visible journey experience lives on the landing route through `src/features/journey-curator`.
- `src/features/journey-curator` uses local curated plans and a local saved journey store.
- `src/features/map` has Kakao map rendering, category chips, place panels, local bookmark state, and an existing warmth/mood system. VisitReview must not reuse warmth semantics.
- `src/app/mypage/page.tsx` currently reads saved journeys, map bookmarks, and warmth entries from client stores/local data.
- `src/lib/api/client.ts` is token/localStorage oriented and must be adapted for cookie auth, CSRF, idempotency, cursor pages, and contract errors.

## Scope

In scope:

- Add typed contract modules and API clients for journey, VisitReview, saved resources, member timeline, CSRF, and Kakao login entry points.
- Add reducers/state machines for journey run events, reconnect/reset recovery, proposal preview, clarification, and terminal states.
- Add VisitReview region drilldown, explicit region list loading, write/delete/report/like interactions, and cursor behavior.
- Replace server-facing place bookmarks with canonical `placeId` saved resource actions across Hanok, map, and Odii-linked place cards.
- Add a monthly timeline section to My Page and remove private server truth from localStorage after logout/delete-account.
- Preserve existing Hanok archive, Odii audio playback, Kakao map rendering, and landing 3D responsibilities.

Out of scope:

- Replacing the existing Kakao map renderer.
- Building comments, replies, photos, star ratings, mood tags, GPS check-in, or realtime VisitReview sync.
- Saving KTO `contentId` or Odii provider IDs as user-facing saved resource identity.
- Creating PRs or merging without the user's final approval.

## Product Experience

The product subject is "a Korean travel planning workspace where places, short visit notes, and AI route suggestions quietly gather into a month-by-month travel preparation record." The primary audience is a returning traveler planning one or more culture-focused outings. The job of the new work is to make server-backed activity feel continuous across pages without making the interface look like an admin console.

The new features should read as one connected system:

- A user asks for a journey, watches a short progress state, then sees a server snapshot.
- The user explores regions on the map and intentionally opens reviews for a selected region.
- The user saves a place from Hanok, map, or Odii and sees the same place appear saved after the next server read.
- The user's My Page opens with a monthly activity timeline, not a pile of disconnected local collections.

## Visual Direction

Use `frontend-design` for these screens and states.

### Token Direction

Colors must follow `AGENTS.md`: neutral gray surfaces by default, no beige/cream/parchment surface treatment.

- `ashCanvas` `#f8f8f7`: page and sheet background.
- `softStone` `#f5f5f4`: quiet section bands and empty states.
- `lineStone` `#e5e5e3`: borders, dividers, skeleton base.
- `pressedStone` `#d9d9d7`: hover and pressed neutral states.
- `ink` `#1f2328`: primary copy and icon strokes.
- `pineSignal` `#2f6f4e`: saved/confirmed semantic accent, used sparingly.

Existing semantic colors for brand, warning, active map categories, selected states, and errors should remain intact.

### Typography

- Display role: keep the existing Hanok-flavored display face with restraint for page-level or modal section titles only.
- Body role: use the existing app body type for readable Korean UI copy.
- Utility role: use the existing compact sans treatment for captions, progress labels, counts, timestamps, and cursor list metadata.

Avoid hero-scale typography inside panels, bottom sheets, cards, review rows, and timeline groups. These are work surfaces, not landing sections.

### Layout

Discover should feel like a route desk:

```text
+--------------------------------------------------+
| query/refine bar                                  |
+------------------------+-------------------------+
| current board snapshot | run/proposal side rail   |
| route cards            | clarification/progress   |
| place actions          | apply/dismiss/cancel     |
+------------------------+-------------------------+
```

Map VisitReview should preserve the existing map as the primary canvas:

```text
+--------------------------------------------------+
| map canvas with region count markers              |
|                                                  |
| left rail/list       selected region review sheet |
| region drilldown     appears only by user command |
+--------------------------------------------------+
```

My Page should lead with the current month:

```text
+------------------------------+
| profile and theme controls    |
+------------------------------+
| 2026-09 monthly timeline      |
| date group                    |
| saved place / journey rows    |
| unavailable count note        |
+------------------------------+
| secondary saved collections   |
+------------------------------+
```

### Signature Motion

Use one memorable motion language: "place slips." A place card, region review set, or timeline group enters as a thin horizontal slip that opens into its final height. This fits the subject because the product is collecting places into a travel record.

Rules:

- Animate only `opacity`, `transform`, and clip-like reveal wrappers that reserve final layout size.
- Do not animate width, height, flex, map marker count layout, or list row dimensions.
- Stagger at the group level, not every small child. Use 40-70ms offsets and finish within 360ms.
- Once a section has appeared in the current page session, keep it final when scrolling back.
- On reload at a scrolled position, already-seen sections render final immediately.
- `prefers-reduced-motion` renders all states immediately with identical functionality.

Self-critique: the generic default would be a warm paper travel journal with sepia cards. This spec rejects that default and keeps surfaces neutral. The aesthetic risk is the thin "place slip" reveal: it gives the new backend states a recognizable behavior without spreading decorative traditional motifs across the app.

## Architecture

Add typed domain clients and state modules rather than pushing contract logic into page components.

Recommended structure:

```text
src/lib/api/
  client.ts
  csrf.ts
  errors.ts
  cursor.ts

src/features/journey-curator/
  api/journeyApi.ts
  api/journeySse.ts
  reducers/journeyRunReducer.ts
  reducers/journeySseParser.ts
  components/DiscoverExperience.tsx

src/features/visit-review/
  api/visitReviewApi.ts
  reducers/visitReviewListReducer.ts
  components/RegionReviewPanel.tsx
  components/VisitReviewComposer.tsx
  components/VisitReviewCard.tsx

src/features/saved-resources/
  api/savedResourcesApi.ts
  store/useSaveIntentStore.ts
  components/SavePlaceButton.tsx

src/features/member-timeline/
  api/memberTimelineApi.ts
  components/MonthlyTimeline.tsx
```

`src/lib/api/client.ts` should become a contract-aware wrapper:

- Use `NEXT_PUBLIC_API_BASE_URL` plus `/api/v1` for backend endpoints.
- Send `credentials: 'include'` for cookie sessions.
- Fetch and cache CSRF token in memory for unsafe methods; retry once on `CSRF_INVALID`.
- Add `Idempotency-Key` for command POSTs that require it.
- Never persist OAuth access/refresh tokens, Kakao tokens, or private snapshots in localStorage.
- Normalize errors by `code`, `status`, `requestId`, and `details`.
- Preserve mock mode only through explicit fixture handlers, not as hidden server truth.

## `/discover` Design

### Data Flow

1. User submits the first query.
2. FE sends `POST /explorations` with `Idempotency-Key`.
3. FE receives `RunAccepted` and opens `eventsUrl`.
4. `run.stage` updates a compact progress label only.
5. `heartbeat` updates connection liveness only.
6. `run.terminal`, `reset`, reconnect, tab visibility return, or EventSource failure triggers `GET /explorations/{id}/runs/{runId}` and `GET /explorations/{id}`.
7. Only `ExplorationSnapshot` renders the board, proposal, clarification, excluded refs, and execution badge.

Terminal SSE data must never render the board by itself.

### States

- `idle`: no exploration.
- `starting`: command accepted pending or retrying idempotently.
- `running`: active run; action/save disabled or handles `409 ACTIVE_RUN`.
- `clarificationRequired`: render question, choices, and free text if allowed.
- `boardReady`: render current board snapshot.
- `proposalReady`: render pending proposal as kept/added/excluded preview with APPLY/DISMISS.
- `baselineReady`: same board rendering with "기본 탐색 결과" label when `engine=BASELINE` and `degradedReason` is non-null.
- `noResults`, `failed`, `cancelled`: preserve existing board/version when the contract says so.

### UI

- Progress copy uses user-recognizable work: "조건을 읽는 중", "장소 후보를 고르는 중", "동선을 확인하는 중", "결과를 정리하는 중".
- Clarification copy should ask one concrete question and keep the prior guest board visible.
- Proposal preview should show "유지", "추가", "제외" as actual decision groups.
- Cancel is explicit; closing SSE or leaving the tab is not cancel.

## `/map` VisitReview Design

### Data Flow

1. Initial map load calls `GET /visit-review-regions` only.
2. Selecting a SIDO calls `GET /visit-review-regions?parentRegionCode=...`.
3. Dragging or zooming the map makes zero VisitReview body requests.
4. Pressing `이 지역 후기 보기` calls `GET /visit-reviews?scope=REGION&regionCode=...`.
5. Successful review response atomically replaces the review list and review pins.
6. Failed or stale response leaves the previous list and pins unchanged.

Implementation must use `AbortController` and a monotonically increasing request sequence for region review loads.

### Review Features

- Text is NFC/trimmed, 1..300 code points, max 5 lines including 4 newlines.
- Composer includes privacy/contact/address/ad warning and a report entry point.
- Likes use intended state:
  - `PUT /visit-reviews/{id}/likes/me`
  - `DELETE /visit-reviews/{id}/likes/me`
- Like requests are serialized per review. Optimistic state rolls back on failure.
- Delete:
  - mine delete success removes item after refresh.
  - repeated mine delete can be treated as success.
  - non-mine delete 404 does not reveal ownership details.
- Reports send `SPAM`, `ABUSE`, `PERSONAL_DATA`, `COPYRIGHT`, or `OTHER`; duplicate open report shows receipt.

### Relationship To Existing Warmth

The existing warmth/mood layer can remain as a separate mode or legacy experience, but VisitReview UI must not show warmth score, mood tags, photos, stars, comments, replies, or localStorage review rows.

## Shared Place Save Design

Create one `SavePlaceButton` and one saved resource client that can be used by Hanok, map, and Odii-linked place cards.

Behavior:

- Logged-in save calls `PUT /saved-resources/places/{placeId}`.
- Logged-in unsave calls `DELETE /saved-resources/places/{placeId}`.
- Guest click stores only short-lived intent: `{resourceType:'PLACE', placeId, desiredSaved:true}`.
- Kakao login success revalidates by sending one PUT. Login cancel/failure creates no server row.
- UI state uses backend `savedByMe`; local intent cannot render `savedByMe:true`.
- `404`, `401`, `409`, network failure, and login failure restore state from server truth or previous committed state.

Canonical identity:

- Use backend `placeId`.
- Do not save or compare KTO `contentId`.
- Do not attach separate save buttons to operating hours, images, source data rows, or Odii provider identifiers.
- Odii-linked place cards default to `PLACE` saves; `ODII_STORY` save remains a separate "listen again" action.

## My Page Timeline Design

`/mypage` first screen should show the monthly timeline before secondary collections.

Data:

- `GET /me/timeline?month=YYYY-MM&limit=20&cursor=...`
- Render `groups`, `hasMore`, `nextCursor`, and `unavailableCount`.
- Hide unknown future item types and log them in development.
- Do not show stale title/image for unavailable places.

Interactions:

- Month switcher supports current month, previous month, and direct month input.
- `SAVED_PLACE` target opens the current public place detail flow.
- `SAVED_ODII_STORY` opens story or linked place depending on target.
- `SAVED_JOURNEY` resumes or opens saved journey detail.
- Removing a place from the timeline calls the saved resource DELETE and refreshes the timeline.

## Auth And Cache Rules

- Kakao login is the visible MVP login path.
- FE never stores OAuth tokens, Kakao access tokens, refresh tokens, client secret, provider subject, or private API snapshots in localStorage.
- Public comparison uses `mine`, `likedByMe`, and `savedByMe`, not member ID or provider identity.
- Unsafe methods include CSRF header from `/auth/csrf`.
- Private responses are treated as `no-store`; logout/delete-account clears private client stores and aborts in-flight private requests.
- Guest exploration/board can remain after login cancel/failure only if it is not a private member snapshot.

## Performance Design

Use `agent-toolkit-skills:frontend-performance-optimizer` while implementing.

### Baselines To Record Before Implementation

Record at least one signal per target area:

- `/` or `/discover`: route load and journey submit-to-terminal replay using fixture SSE.
- `/map`: initial map load, SIDO drilldown, explicit region review load, map drag/zoom.
- `/mypage`: logged-in page load and month switch.
- Build output: route bundles and warnings from `npm run build` or equivalent.

If browser traces are unavailable, record code evidence: render path, import path, state subscription, event listener count, allocation sites, and request waterfall.

### Performance Constraints

- SSE parsing and journey reducer are pure and tested outside React.
- Use refs for transient SSE event IDs, reconnect timers, request sequence, and EventSource handles.
- Store only render-relevant journey state in React/Zustand.
- Use direct imports for heavy components; avoid widening bundles through barrel imports.
- Dynamically import optional/heavy panels where existing app patterns already do this, such as map overlays or composer modals.
- Start independent fetches early and await late where dependencies allow. For terminal recovery, fetch run and exploration together when both URLs are known.
- Region review loads use abortable fetch and stale response disposal.
- Drag/zoom listeners are passive or Kakao-native and do not update review list state.
- Lists use stable row dimensions, `content-visibility` where useful, and cursor append without full list recomputation.
- Animation uses transform/opacity. No layout-changing animation for row height, map panel width, flex distribution, or skeleton size.
- Skeletons reserve the exact final card/row dimensions.

### Regression Tests

Add focused tests for:

- SSE parsed-frame reducer: stage, terminal, heartbeat, reset.
- Terminal/reset/reconnect recovery calls snapshot fetch before rendering.
- EventSource unavailable polling stops at terminal.
- VisitReview region switch aborts/stales old response.
- Map drag/zoom makes no review body request.
- Cursor `hasMore:false` stops further loads.
- Review text validation, like optimistic rollback, and self-like 403 handling.
- Saved place login intent runs once after Kakao success and never on cancel/failure.
- Timeline groups render month/day and unavailable count without stale item details.

## Implementation Phases

### Phase 1: Contract Foundation

- Update API client for `/api/v1`, cookie credentials, CSRF, idempotency, errors, and cursor helpers.
- Add fixture-backed clients and typed DTOs.
- Add reducer tests before UI wiring.

### Phase 2: Journey Run Experience

- Replace `/discover` redirect with a server-backed discover route or consciously wire the landing journey surface to the new backend contract.
- Implement SSE parser, run reducer, terminal recovery, fallback polling, clarification, baseline, no-results, failed, cancelled, active-run, and proposal UI.
- Keep board rendering snapshot-sourced.

### Phase 3: Map VisitReview

- Add region aggregate state and explicit review loading.
- Add review sheet/list/pins/composer/report/like/delete behavior.
- Keep existing warmth separated.

### Phase 4: Saved Resources And Timeline

- Add shared save button and login intent store.
- Wire Hanok, map, and Odii-linked place cards to canonical `placeId`.
- Add My Page monthly timeline and private cache cleanup.

### Phase 5: Integration Verification

- Run fixture tests against frontend reducers.
- Run TypeScript, lint for touched files if available, unit tests, and build.
- Use Playwright screenshots for animation/layout when browser automation is available.
- Update `handoff.md`, `improvements.md`, and `changelog.md` with verified status.

## Acceptance Criteria

- The FE uses backend snapshot as the render truth for journey boards and proposals.
- `/discover` handles `CLARIFICATION_REQUIRED`, `NO_RESULTS`, `FAILED`, `CANCELLED`, `BASELINE`, `ACTIVE_RUN`, stale baseVersion, APPLY, and DISMISS.
- `/map` uses region aggregates before review bodies and does not request bodies during drag/zoom.
- VisitReview supports 300-character validation, likes, delete, report, moderation disappearance, and cursor termination.
- Hanok, map, and Odii-linked place cards share canonical `placeId` save behavior.
- Guest save intent survives successful Kakao login once and does not create rows on cancel/failure.
- `/mypage` renders backend monthly timeline groups and `unavailableCount`.
- Private API responses are not stored in localStorage and are cleared from memory on logout/delete-account.
- Motion respects reduced motion and does not cause layout jumps.
- Baseline and after-change performance evidence is recorded for the changed routes.

## Open Questions For Implementation Planning

- Should `/discover` become its own primary route again, or should `/` remain the primary journey surface while `/discover` redirects?
- Are backend OpenAPI and fixtures fully frozen for saved resources and timeline, or should FE create local fixture types from `rest-api.md` first?
- Which Hanok and Odii DTOs already expose canonical `placeId`, and which still expose only provider IDs?
- Should existing local saved journeys continue as a guest-only feature, or be migrated behind `/saved-journeys` in the same pass?

## Spec Self-Review

- Marker scan: no unresolved draft markers remain.
- Consistency check: all rendered server states come from snapshot or typed GET responses, not SSE terminal payloads or localStorage.
- Scope check: broad but decomposed into five implementation phases that can become separate issues or pull requests.
- Ambiguity check: unresolved product/API choices are listed as implementation planning questions rather than hidden assumptions.
