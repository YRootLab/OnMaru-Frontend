# handoff.md

Current work:
- Summary: 
  1. Created new branch `feat/hanok-dogam` from clean `develop`.
  2. Ready to begin Hanok Dogam (한옥도감) development.
- Branch: `feat/hanok-dogam`
- Related: Hanok Dogam feature development.
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


Touched files:
- `src/shared/components/Header/Header.tsx`
- `src/shared/components/Header/GlobalMobileTabs.tsx` (new)
- `src/map/components/MapMobileTabs.tsx` (new, replaces deleted `MobileBottomNav.tsx`)
- `src/map/components/MapNavRail.tsx`
- `src/map/MapPage.tsx`
- `src/map/components/CategoryChips.tsx`
- `src/shared/navigation/mapEntranceTiming.ts` (new)
- `AGENTS.md`

Verified this session:
- `npx tsc --noEmit`: passed.
- `npx eslint` on all touched files: 0 errors (only pre-existing unrelated warnings).
- Playwright: navigated `/hanok` → `/map` and measured live frame-by-frame (rAF-sampled opacity/transform) that the bottom nav container position is pixel-identical across routes, and that the desktop entrance choreography (rail/header flip → floating panel spring → category chips) fires in the intended order with no overlap.
- Note: the Kakao Maps SDK script is blocked (`ERR_BLOCKED_BY_ORB`) on non-standard dev ports (3001/3101) — this is a Kakao API key domain-whitelist issue, not a code regression; the map renders correctly on port 3000.

Not part of this branch's scope (found modified in the working tree, left uncommitted, not authored by this session):
- `src/shared/components/animation/README.md`
- `src/shared/components/animation/VesselReveal.tsx`
- These look like an in-progress tweak to the `VesselReveal` reveal-boundary threshold (25%→33%) from a different workstream. Not reviewed or verified by this session — left as-is for the user to commit separately or discard.

Next step:
- Push branch and open PR against `develop`.
- No open GitHub Issue currently tracks this specific navigation-transition work (Issue #48 covered the GNB capsule redesign only, already closed/merged); the PR references no issue via `Closes`/`Refs`.

Ad hoc requests captured this session:
- (none new; prior session's Odii natural-language Q&A planning notes remain in `improvements.md` untouched)
