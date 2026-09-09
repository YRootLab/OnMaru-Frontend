# handoff.md

Current work:
- Summary: 
  1. Completed OnMaru Admin Web Console (#52~#57) and merged PR #59 into `develop`.
  2. Created new branch `feat/migrate-lucide-icons` from updated `develop`.
  3. Created GitHub Issues for full Lucide icon migration:
     - #60: [Epic] 전체 아이콘 시스템 Lucide Icons(lucide-react) 전면 마이그레이션
     - #61: [Icons #1] 공용 컴포넌트(GNB, Layout) 및 관리자(Admin) 콘솔 Lucide 아이콘 마이그레이션
     - #62: [Icons #2] 지도(Map) 및 온기 피드(Warmth) 영역 Lucide 아이콘 마이그레이션
     - #63: [Icons #3] 한옥도감(Hanok) 및 여정 큐레이터(Journey/Tour) 영역 Lucide 아이콘 마이그레이션
     - #64: [Icons #4] 오디(ODII) 오디오 도슨트 영역 Lucide 아이콘 마이그레이션 및 react-icons 의존성 정리
- Branch: `feat/migrate-lucide-icons`
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

Next step:
- User verification of reload behavior and dark mode appearance on `/map`.

