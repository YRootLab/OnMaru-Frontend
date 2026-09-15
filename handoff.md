# handoff.md

Current work:
- Summary: Added an FE-visible backend `toFE` implementation status note.
  - Document: `docs/specs/TOFE_IMPLEMENTATION_STATUS.md`
  - Captures implemented FE foundation, remaining Journey/VisitReview/saved-place/timeline gaps, and exact backend specs that should be resent before final integration.
- Summary: Fixed the Onmaru landing header surface in light mode.
  - Root cause: `Header` treated the `/` landing hero as a dark surface based only on route/scroll state, even when the applied theme was `light`.
  - Added `src/shared/components/Header/headerSurface.ts` to make the rule explicit: landing dark surface is used only when the applied theme is `dark`.
  - Added regression coverage for light-mode landing and dark-mode landing behavior.
- Summary: Made theme mode selection explicit for logged-in and logged-out users.
  - Added `src/design-system/themePreferenceLabels.ts` so `system` is shown as `자동` while keeping the persisted value compatible.
  - Updated the global header theme button to open an `자동` / `라이트` / `다크` picker instead of cycling modes blindly.
  - Updated the `/map` desktop rail theme control with the same picker because the global header is hidden there.
  - My Page's existing `ThemeModeSwitch` now uses `자동` wording and avoids the monitor icon.
- Summary: Updated `system` theme resolution to use local time of day.
  - `src/design-system/timeTheme.ts` resolves 07:00-18:59 to light and 19:00-06:59 to dark.
  - `ThemeProvider` and the initial `beforeInteractive` theme script now use the same time-aware rule to avoid first-paint mismatch for automatic mode.
  - Explicit user selections for `light` or `dark` remain respected.
  - Verified: focused time theme test, `npx tsc --noEmit`, `npm test` (45 files, 135 tests), `npm run check:env`, and `npm run build` passed.
- Summary: Added local and CI controls to prevent Odii/Sorimaru env alias regressions.
  - `.env.local` remains ignored, while `.env.example` is explicitly unignored and tracked as a safe template.
  - Added `npm run check:env` via `scripts/validate-env-contract.mjs` to validate Odii key aliases, `.gitignore` env rules, and accidental tracked secret env files.
  - Wired the same check into `.githooks/pre-push` and `.github/workflows/env-contract.yml`.
  - Verified: `npm run check:env`, focused validator tests, `npx tsc --noEmit`, `npm test` (42 files, 131 tests), and `npm run build` passed.
- Summary: Re-mapped the backend feature delta into the existing product surfaces without changing established UI.
  - Home `/` remains the real journey search surface. `fetchCuratedJourney` now uses the backend journey repository and authoritative snapshot board when `NEXT_PUBLIC_API_BASE_URL` is configured, while preserving the existing local `/api/journey-curator` fallback for local/dev mode.
  - `/discover` now redirects to `/` so there is no second journey UI.
  - `/map` warmth mode remains the owner of "여행자들이 남긴 온기 이야기". Server VisitReview data is converted into the existing `Warmth[]` model so current region/category/sort UI keeps working.
  - Removed the mistakenly placed VisitReview panel from `/map` info mode.
  - Map place rows now use the canonical saved-place button, including guest Kakao-login save intent capture and optimistic logged-in save/unsave.
  - `/mypage` now includes the monthly member timeline surface backed by the server timeline repository.
  - Auth logout/account deletion now clears private local/session state, including pending saved-resource intents.
  - Verified after remap: `npx tsc --noEmit` passed, `npm test` passed (44 files, 133 tests), `npm run build` passed, and local dev routes `/`, `/map`, `/mypage` returned HTTP 200 while `/discover` returned 307 to `/`.
  - Dev server: running at `http://localhost:3000`.
- Note: Hanok/Odii place-save buttons are ready through the shared saved-resource repository/component, but full per-card wiring still depends on those surfaces exposing the backend canonical `placeId` in their view models rather than legacy TourAPI/Odii identifiers.
- Summary: Implemented backend feature delta foundation from the spec using TDD and `frontend-senior-engineer` boundaries.
  - Added contract-aware API foundation: normalized errors, cursor guard, in-memory CSRF provider, cookie/idempotency `apiRequest`, and compatibility helpers.
  - Added pure journey SSE parser/reducer for stage, heartbeat, terminal, reset, snapshot recovery, and BASELINE labeling.
  - Added VisitReview contract validation and stale region response reducer.
  - Added saved `PLACE` guest intent store with injected storage/clock and member timeline contract helpers.
  - Added shared place-slip motion primitive for transform/opacity-only reveals with reduced-motion behavior.
  - Verified: focused foundation tests passed (6 files, 12 tests), `npx tsc --noEmit` passed, `npm test` passed (35 files, 119 tests before final docs-only update), `npm run build` passed.
- Next step: implement Phase 2 UI wiring for `/discover` or continue with `/map` VisitReview container integration, using the new foundation modules.
- Summary: Added implementation plan for the backend feature delta foundation, scoped to typed API/CSRF/cursor/error contracts, journey SSE reducer, VisitReview reducer, saved intent/timeline contracts, and the place-slip motion primitive.
- Plan: `docs/superpowers/plans/2026-09-14-backend-feature-delta-foundation.md`
- Summary: Captured backend-to-FE feature delta design spec for `/discover` REST+SSE journey runs, `/map` VisitReview, shared canonical place saves, My Page monthly timeline, auth/CSRF/cache rules, neutral motion design, and frontend performance constraints.
- Spec: `docs/superpowers/specs/2026-09-14-backend-feature-delta-fe-design.md`
- Source backend docs: `/Users/yangseunghyeon/Development/OnMaru/OnMaruBE/docs/toFE`
- Next step: review/approve the spec, then create a detailed implementation plan before touching feature code.
- Map page (`/map`) logo.png insertion and comprehensive dark mode compatibility:
  - Navigation Rail (`MapNavRail.tsx`): Replaced text script brandmark with `/logo.png` (36x36 contain, rounded 10px). Added a dedicated theme toggle button (Sun/Moon) synced with `useOnmaruTheme()`.
  - Comprehensive Dark Mode styling across all map components:
    - Map viewport & canvas (`KakaoMap.tsx`): Synchronized map moonlight filter (`isNight`) with `useOnmaruTheme()` mode, added dark mode styling for controls stack, control buttons, and research button.
    - Side panels: `ListPanel.tsx`, `SearchBar.tsx`, `ModeToggle.tsx`, `PlaceList.tsx`, `PlaceListItem.tsx`, `DetailPanel.tsx`, `PlaceDetail.styles.ts`, `PopularPlacesPanel.tsx`, `WarmthFeed.styles.ts`, `BottomSheet.tsx`.
    - Feed sections: `SmartAroundFeed.tsx`, `FestivalExhibitionCarousel.tsx`, `SorimaruSpotlightBanner.tsx`, `LiveNoticeBanner.tsx`.
  - Verification: `npx tsc --noEmit` passed (0 errors), browser subagent verified light mode and dark mode transitions (all side panels, controls, and detail cards render in luxury dark mode `#1C1A17`/`#2D2924`).
- Summary:
  1. Restored Section 2 ("장면을 따라 걷는 소리") horizontal gutters by wrapping it in `CenteredContainer` (`max-width: 72rem`, `padding: 0 1rem` to `2rem`) matching Section 3 and 4.
  2. Implemented full dark mode (`[data-theme='dark']`) support across all 12 components in `src/features/sorimaru-audio`.
  3. Completely removed horizontal hanji tear lines (`HanjiTearTransition` returns null, tags removed) to eliminate artificial dot/strip artifacts and let sections breathe with negative space and smooth atmospheric backgrounds.
  4. Added vertical hanji deckle edge frame to Hanok Maru (`/hanok`) via new shared Emotion component `<HanjiDeckleEdge />` (`src/shared/components/HanjiDeckleEdge`).
  5. Removed protruding horizontal deckle fiber needle lines (`LEFT_DECKLE_FIBERS`, `RIGHT_DECKLE_FIBERS`) and grid / graph-paper pattern (창호 격자 모눈종이 효과) from background.
  6. Migrated all 26 components in `src/features/sorimaru-audio` to Emotion CSS and purged Tailwind CSS from the codebase.
  7. Verified: `npx tsc --noEmit` clean (0 errors), all 45 sorimaru tests passed, `npm run build` verified.
- Branch: `feat/hanok-dogam-2`
- Related: PR #71 targeting `develop`.
- Summary:
  1. Created new branch `feat/hanok-dogam` from clean `develop`.
  2. **Font**: `globals.css` body `font-family` → `var(--font-hanok)` (Spoqa Han Sans Neo). CDN import already present from prior session.
  3. **Font weights**: Reduced all `font-weight: 600/700` in `src/hanok/**` to 300–500 range. Affected files: `HanokHero.tsx`, `VillageCard.tsx`, `ArchiveNav.tsx`, `PolaroidCard.tsx`, `HanokManifestoCta.tsx`, `HanokMonthly.tsx`, `HanokStayAccordion.tsx`, `HanokArchive.tsx`, `VillageDetailModal.styles.ts`.
  4. `npx tsc --noEmit`: passed (no errors).
- Summary: /map page navigation-bar transition improvements.
  1. Fixed the bottom nav "jump" when navigating to `/map` from `/hanok` or `/odii`: `Header` now stays mounted and its mobile tab bar crossfades content (`GlobalMobileTabs` ↔ `MapMobileTabs`) inside the same fixed shell, instead of hard-swapping two differently-positioned/sized components.
  2. Desktop `/map` entrance choreography: GNB flips away with a 3D `rotateX` (calendar-page style, `backface-visibility: hidden`, weighted easing curves) while `MapNavRail` slides in from the left simultaneously; the floating list/detail panel then springs in; the category chip bar (`MapChips`) rises in last. All timing lives in `src/shared/navigation/mapEntranceTiming.ts`.
  3. `MapNavRail` redesigned as a slim floating glass capsule (60px wide, 14px inset, matching the GNB's capsule visual language) replacing the old 68px flush opaque sidebar; removed the redundant chevron/dropdown on its 지도 item (`ModeToggle` already covers info/warmth switching).
  4. `MapChips` repositioned/resized to align with the GNB's position and height (`HEADER_HEIGHT` exported from `Header.tsx`); chip pills shrunk slightly.
  5. Added an `AGENTS.md` policy: agents must not create a PR or merge on their own after finishing dev work — always get the user's final approval first.
- Branch: `feature/map-page-navigation-bar-improvements`
- Related: Issue #48 / PR #49 (already merged into `develop`) redesigned the GNB into a slim floating capsule; this branch's `Header.tsx` changes build on top of that merged design rather than conflicting with it — `develop` was merged into this branch at commit `4a0556b`.
- Recent fixes:
  1. Dark Mode White Flash on Reload:
     - Added synchronous theme `<script>` in `<head>` (`src/app/layout.tsx`) to set `<html data-theme="dark">` immediately before browser first paint based on `localStorage` and `prefers-color-scheme`.
     - Eager `mode` initialization in `src/design-system/ThemeProvider.tsx`.
     - Added comprehensive `@media (prefers-color-scheme: dark)` rules across `CategoryChips.tsx`, `FloatingHomeButton`, `MoreButton`, and `OverflowPanel`.
  2. Category Chips Width Jitter & `...` Folding on Reload:
     - On desktop (`align === 'end'`), pinned `visibleCount` to `items.length` so all 8 categories are rendered immediately and stably without collapsing into `...`.
     - Set `GAP = 6px` and chip padding to `0 11px`.
     - Removed dynamic width collapsing animation from `ChipWrap`, eliminating layout jitter on page reload.
  3. ListPanel Initial Mount Transition:
     - Disabled `transition: width 0.28s` during initial mount in `src/map/components/ListPanel.tsx` using `$mounted` flag to prevent initial reflow on reload.


Touched files:
- `src/shared/components/Header/Header.tsx`
- `src/shared/components/Header/GlobalMobileTabs.tsx`
- `src/map/components/MapMobileTabs.tsx`
- `src/map/components/MapNavRail.tsx`
- `src/map/MapPage.tsx`
- `src/map/components/CategoryChips.tsx`
- `src/map/components/ListPanel.tsx`
- `src/app/layout.tsx`
- `src/design-system/ThemeProvider.tsx`
- `src/shared/navigation/mapEntranceTiming.ts`
- `AGENTS.md`

Verified this session:
- `npx tsc --noEmit`: passed cleanly (code 0).
- Reload stability on dark mode confirmed.


PR prep 2026-09-10:
- Branch: `hotfix/odii-page` targeting `develop`.
- Related Issues for PR reference: #62 and #64 because this fixes map/ODII regressions after the Lucide migration.
- Do not close #68 or #69 from this PR; they remain follow-up UI/theme work.

Next step:
- User verification of reload behavior and dark mode appearance on `/map`.
- 지도 카테고리 칩은 PR #66의 가로 스크롤 수축 동작을 유지하면서, mask로 그림자가 잘리는 문제를 제거하고 둥근 pill 스타일/진입 애니메이션을 복원했다. 현재 아이콘은 lucide-react 기준을 유지한다.
