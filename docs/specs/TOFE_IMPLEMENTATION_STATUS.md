# Backend to FE Integration Status

Last updated: 2026-09-15

Source backend package:
`/Users/yangseunghyeon/Development/OnMaru/OnMaruBE/docs/toFE`

This document summarizes what the current FE branch has implemented from the
backend `toFE` package and what still needs a refreshed backend specification or
additional FE work. It is intended as the FE-visible handoff note.

## Overall Status

The current branch has implemented the first FE foundation and wired several
core surfaces. It should not yet be treated as complete coverage of the backend
`integration-checklist.md`.

| Area | Status | FE state |
| --- | --- | --- |
| API foundation | Mostly implemented | Shared API client, normalized errors, cursor helpers, CSRF provider, cookie/idempotency request options |
| Journey run | Partially implemented | Typed repository, SSE parser/reducer, backend run path on `/`, `/discover` redirects to `/` |
| VisitReview | Partially implemented | Contract/reducer/repository and map warmth adapter exist, but full region drilldown/write/like/report flow is not complete |
| Saved places | Partially implemented | Shared saved-place repository, optimistic map save button, guest login intent store |
| Monthly timeline | Partially implemented | `/mypage` renders the server-backed monthly timeline component |
| Auth/private state | Partially implemented | Logout/account deletion clears client private state; CSRF foundation exists |
| Hanok/Odii cross-surface save | Not complete | Requires canonical backend `placeId` exposure in those view models |

## Implemented in This FE Branch

- Added backend-aware API foundation under `src/lib/api`.
- Added journey contracts, repository, SSE parser, and run reducer under
  `src/features/journey-curator`.
- Connected home `/` journey search to the backend journey run path when
  `NEXT_PUBLIC_API_BASE_URL` is configured.
- Redirected `/discover` to `/` because the product journey surface is the root
  journey search, not a separate discover page.
- Added VisitReview contracts/repository/reducer under `src/features/visit-review`.
- Mapped server VisitReview data into the existing `/map` warmth model so the
  existing "여행자들이 남긴 온기 이야기" UI remains the active surface.
- Added saved resource contracts/repository/store and a shared place save button.
- Connected map place rows/cards to the shared saved-place behavior.
- Added member timeline contracts/repository and mounted monthly timeline on
  `/mypage`.
- Added Odii/Sorimaru environment alias compatibility and env contract checks.

## Remaining FE Work

### Journey

- Render `CLARIFICATION_REQUIRED`, `NO_RESULTS`, `FAILED`, and `CANCELLED`
  states with product-owned copy.
- Complete pending proposal preview with keep/add/remove and APPLY/DISMISS.
- Harden reconnect, reset, tab restore, and polling fallback behavior against
  backend fixtures.
- Handle active-run conflicts such as save/action 409 and stale `baseVersion`.

### VisitReview

- Implement national to province to district aggregation drilldown.
- Ensure map pan/zoom does not request review body lists.
- Fetch REGION review list and pins only after explicit "이 지역 후기 보기".
- Replace list and pins atomically and discard stale responses.
- Add 300-character/5-line write validation and privacy/ad warning copy.
- Implement like PUT/DELETE optimistic rollback.
- Implement report receipt, duplicate report handling, and hidden/deleted item
  exclusion.

### Saved Places and Timeline

- Wire Hanok list cards, Hanok detail cards, and Odii connected-place cards to
  the same canonical `PLACE` save API.
- Ensure all surfaces use backend canonical `placeId`, not TourAPI `contentId`
  or Odii story identifiers.
- Revalidate guest save intent after Kakao login and send the saved-place PUT
  exactly once.
- Restore optimistic state from server truth on 401, 404, 409, cancel/failure,
  and network errors.
- Route timeline saved-place items to the current public place detail.
- Represent unavailable private/deleted places via `unavailableCount` only.

## Backend Spec Needed Again

Yes. The backend should resend the current source of truth before the FE claims
complete integration. The FE needs the latest exact contracts for:

- Journey OpenAPI paths and DTOs, especially run lifecycle statuses, 409 payloads,
  `pendingProposal`, `engine=BASELINE`, and clarification payloads.
- Journey SSE event names, payload fields, retry/reset semantics, and terminal
  snapshot recovery rules.
- VisitReview region aggregation endpoints and response shapes for province,
  district, REGION list, pins, likes, reports, hidden/removed reviews, and cursor
  pagination.
- Saved resource canonical `placeId` policy and DTO fields required by Hanok,
  map, and Odii surfaces.
- `/me/timeline` exact grouping shape, target navigation fields, and
  `unavailableCount` behavior.
- Auth/CSRF requirements for unsafe requests in local, dev, and deployed
  environments.

## Completion Bar

This work should be called complete only when the backend-provided fixtures pass
both sides of the contract:

- FE reducer/adapter tests parse the same enum values and fields.
- Backend serializer contract tests emit the same fields and error codes.
- UI renders product-owned messages instead of leaking backend/Gemini internals.
- Cross-surface saved-place behavior proves the same canonical place is saved
  and reflected in Hanok, map, Odii, and My Page.
