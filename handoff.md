# handoff.md

Current work:
- 전국 한옥 수결첩(手決帖) 스탬프 시스템 및 지도 인터랙티브 효과 구현 완료:
  - 수결첩 시스템: `src/features/stamp/` 모듈, `/stamps` 라우트, 상세창 체크인 연동, 도장 연출 모달, 8도 SVG 지도, 랭킹 리더보드.
  - 지도 인터랙티브: 금빛 커서 잔상 트레일, 핀 클릭 Ripple 및 Glow Ring, 방문 한옥 뱃지 (하단 뽀글거리는 파티클 레이어 제거).
  - 지도 축소 마커 겹침 해결: `PIN_MAX_LEVEL = 6` 및 시·군·구 스마트 클러스터링(`om-cluster-pill`), 뱃지 핀 불투명 화이트 적용 및 불필요한 별무리 제거.
  - 모드 토글 정제: 라이트 모드 화이트 필 적용 및 온기 옆 붉은 점 제거.
  - 검증: `npx tsc --noEmit` 0 errors 통과, 브라우저 서브에이전트로 모드 전환, 핀 클릭, 인장 획득, 수결첩, 축소 클러스터링 전체 경로 시각 검증 완료.
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
