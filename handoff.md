# handoff.md

Current work:
- Screen Hanok (K-Culture) pure TourAPI 4.0 dynamic integration & hardcoding purge:
  - Completely removed all keyword arrays and place name hardcodings from `src/app/api/tourapi/kculture/route.ts`.
  - Dynamically fetches all real Hanok heritage sites nationwide using TourAPI 4.0 official category codes (`A02010400` Heritage House, `A02010600` Folk Village, `A02010100` Royal Palace) via `areaBasedList2`.
  - Automatically synthesizes rich K-Content metadata across three pillars: K-Drama/Historical Drama (`[K-DRAMA]`), Korean Cinema (`[CINEMA]`), and K-POP Music Video / Pictorial (`[K-POP / MEDIA]`) with 1-night-2-days immersive itineraries and region-specific tags.
  - Successfully tested and verified 90+ real Hanok locations loaded dynamically with high-res photos.
  - Verified `npx tsc --noEmit` cleanly passed (0 errors) and browser verified live card rendering at `/hanok`.

- Search bar consolidation & Refinement chips integration: removed the duplicate bottom search box (`JourneyRefineBar`) from `JourneyHome.tsx`. Integrated the `+` refinement chip recommendations (`+ 전통 찻집 위주`, `+ 비 오는 날 운치`, `+ 걷는 시간 줄이기`, `+ 역사 해설 중심`) directly under the primary top search bar (`JourneyHeroSearch.tsx`) in compact mode when `hasSearched` is true. Styled chips with clean borderless/shadowless aesthetic and dark mode compatibility.
- Exploration search query & Gemini AI fallback: fixed the issue where complex/freeform natural language search queries (e.g., "대전에서 빵 투어", "성수동 카페", "조용한 쉼") returned `NO_RESULTS` errors. Implemented multi-tier keyword resolution (`KOREAN_REGIONS` dictionary with 50+ regions/landmarks, Korean postposition particle cleaning `cleanKoreanTerm`, `extractKeywords`, and `searchRealSpotsMultiKeywords`). Added `generateGeminiDirectSpots` as a direct synthesis fallback using Gemini Flash models with valid coords and addresses, ensuring users always receive rich, tailored 3-spot itineraries without failure.
- Sorimaru trending audio playback fix: fixed the issue where clicking trending audio cards on the home discovery feed navigated to `/sorimaru?track=...` without playing. `SorimaruAudioFeature` now parses URL search parameters (`track`, `keyword`, `query`, `title`, `autoPlay`), selects the matching Odii story, and triggers instant playback with `setCurrentStory` and `setIsPlaying(true)`. Wrapped with `<Suspense>` in `src/app/sorimaru/page.tsx` for client-rendering safety. Troubleshooting note recorded in `기록/트러블슈팅_소리마루재생.md`.
- Home discovery feed & mini-games polish: removed all borders and shadows from assembly loading modal (`JourneyAssemblyLoader`), mini Omok game (`MiniOmokGame`), and traditional word search puzzle (`TraditionalWordSearch`) to adhere to flat modern minimalist design rules with full light/dark mode support.
- Footer gradient: upgraded footer ambient lighting to OnMaru signature Dancheong Juhong & golden amber ambient gradients.
- Reset search on Home: clicking the OnMaru logo or Home navigation resets the search state back to the fresh initial hero & discovery feed.
- Verified: `npx tsc --noEmit` cleanly passed.
- Hanok reading-flow motion: the regional distribution now uses one-shot GSAP `scaleX` bars with synchronized count-up values; the detail modal uses its own scroll container to focus the centered history paragraph while dimming surrounding paragraphs. Reduced-motion users receive the final readable state immediately.
- Hanok monthly layout stability: the monthly feature now reserves its final responsive height before hydration, preventing the distribution chart from flashing in its space and then being pushed below the viewport.
- Hanok distribution stability: live `/api/tourapi` payloads without regional data no longer replace the complete local snapshot, preventing the chart below “이달의 픽” from appearing briefly and then disappearing.
- Sorimaru playback data fix: the public base-list endpoint currently returns metadata rows with no `audioUrl`, so initial listening content now uses the playable `한옥` story search. The adapter excludes media-less rows and the store rejects them as a final guard. Verified against the live API: the themed search returns playable URLs.
- Verified after the playback fix: `npx tsc --noEmit` and the focused Sorimaru API/initial-load Vitest suite pass.
- Sorimaru player UX pass: the expanded drawer preserves page position while locking background scroll, contains touch overscroll, and uses a Roadview canvas that relayouts responsively. `npx tsc --noEmit` passes.
- Expanded-player layout: at 768px and above, Roadview and playback controls occupy the left column while the synchronized transcript is a scrollable right column; mobile keeps the same reading order vertically.
- Saved sounds: the expanded player now has a heart button. It shares one persisted store with the "saved sounds" drawer, so saved and removed items update immediately.
- Audio-reactive visual layer: Web Audio analyser data now drives a GSAP aura over Roadview while playback is active. The animation only mutates transform and opacity and honors reduced motion.
- Sorimaru motion pass: hero media now has restrained GSAP parallax and ink-like reveal; story cards reveal with one staggered, reduced-motion-safe GSAP sequence.
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

## 2026-09-15 — 한옥 도감 AI 장소 해설

- `도감 해설 보기` 상세 모달의 주소 아래에 `이 장소에 얽힌 이야기` 패널을 추가했다.
- 서버 전용 `/api/hanok/story`가 Gemini Google Search grounding을 사용해 장소명·주소가 일치하는 공개 자료를 조사하고, 역사 요약·시간의 층위·현장 관찰 포인트·클릭 가능한 출처를 반환한다.
- API 키 또는 검색 결과가 없을 때는 사실을 만들어내지 않고 기존 TourAPI/도감 설명으로 돌아간다.
- 로딩 패널은 최종 패널과 같은 최소 높이를 확보하고 중립 회색 스켈레톤을 사용한다.
- 프로세스 메모리에서 장소별 결과를 24시간 캐시하며 최대 80개를 유지한다.
- 도감/숙소 상세 모달이 존재하지 않는 `/api/village/:id`를 호출하던 문제를 실제 `/api/tourapi/detail?id=...` 엔드포인트로 수정해 기존 TourAPI 설명도 다시 로드되게 했다.

## 2026-09-15 — 테마 버튼 hydration 불일치 수정

- `ThemeProvider`의 서버 렌더와 첫 클라이언트 렌더가 모두 `defaultMode`에서 시작하도록 통일했다.
- localStorage 테마, 로컬 시간, 시스템 테마는 hydration 이후 animation frame에서 반영해 헤더 버튼의 label과 Emotion class 불일치를 제거했다.
- 초기 effect가 `beforeInteractive` 테마를 SSR 기본값으로 덮어쓰지 않도록 보호해 다크 모드 첫 화면도 유지했다.
- 모바일 지도 폭 감지도 서버와 동일한 초기값에서 시작하도록 정리했다.
- 헤더 표시값에도 `useSyncExternalStore`의 서버 스냅샷을 적용해 Fast Refresh가 Provider 상태를 보존한 경우에도 hydration 시 버튼 속성과 Emotion class가 항상 `자동/라이트` 기준으로 일치하게 했다.

## 2026-09-15 — AI 해설 주소 오인 및 Gemini 모델 수정

- 도감 `summary`에 들어 있던 주소를 AI 해설 폴백으로 사용하지 않도록 제거했다.
- TourAPI 상세 설명 로딩이 끝난 뒤 해당 설명만 Gemini 컨텍스트로 전달하며, 주소형 텍스트는 서버에서도 다시 차단한다.
- Gemini 모델 후보를 현재 키가 노출하는 `gemini-3.8-flash` → `3.7-flash` → `3.6-flash` 순서로 갱신했다.
- 현재 로컬 키는 정상 인식되지만 Gemini API가 429 할당량 응답을 반환한다. 할당량 회복 전에는 TourAPI 설명 또는 명시적인 재시도 안내를 표시한다.
- 유효한 도감 `summary`는 다시 공공 기록 해설로 활용하고, 주소형 summary만 서버에서 제외한다. 공공 설명이 있으면 실패/재시도 문구와 일반적인 관찰 포인트를 노출하지 않는다.
- 라이브 목록 응답이 `summary`에 주소만 제공하더라도 같은 ID의 정적 스냅샷 설명을 병합해 보존한다. 카드와 AI 패널 모두 주소 대신 실제 도감 설명을 받는다.

## 2026-09-15 — AI 해설 모바일 가로 잘림 수정

- 상세 모달의 가로 overflow를 숨기고 AI 패널에 `min-width: 0` 경계를 추가했다.
- 긴 AI 요약·연혁·관찰 포인트는 한국어 어절 줄바꿈을 유지하면서 필요한 경우 안전하게 줄을 바꾼다.
- 타임라인 콘텐츠 열을 `minmax(0, 1fr)`로 바꿔 긴 문장이 모달을 밀지 않게 했다.
- 출처 링크는 모바일에서 한 줄 너비를 사용하며 긴 제목은 말줄임 처리한다.
- 추가 보강: 560px 이하에서는 연혁을 완전한 세로 구조로 전환하고, 출처 제목도 말줄임 없이 여러 줄로 표시한다. 모달 Body의 모든 직계 자식에 최대 너비를 강제했다.
- 사용자 정정에 따라 데스크톱을 포함한 모든 화면에서 AI 해설 헤더, 연혁의 시대/설명, 출처를 한 열로 쌓도록 변경했다.
- AI 결과 전체를 전용 `StoryContent` 단일 열 Grid로 감싸 요약·연혁·관찰 포인트·출처의 가로 배치를 구조적으로 차단했다.

## 2026-09-15 — 상세 사진 확대 duplicate key 수정

- 도감 태그에서 빈 문자열을 제거하고 중복 값을 합쳐 사진 확대 상태 변경 시 `key=""` 충돌이 발생하지 않게 했다.
- 도감/숙소 갤러리 URL도 trim 후 빈 값 제거와 Set 중복 제거를 적용했다.
- 실제 남은 원인은 `AnimatePresence` 안에서 동시에 렌더되는 상세 Overlay와 LightboxOverlay가 둘 다 key가 없던 것이었다. 도감/숙소 각각의 두 오버레이에 명시적인 고유 key를 추가했다.

## 2026-09-17 — 검색 결과 UI 정리

- **고정하기 / 근거보기 버튼 제거**: `JourneyPlaceCard`의 Footer 전체(PinButton, EvidenceButton) 삭제. `onTogglePin` / `onOpenEvidence` props 제거.
- **세로 구분 바 제거**: `JourneyFlowRailSection`의 `EvidencePanel` (border-top 세로 바 포함) 및 `openRef`/`openEvidence` 상태 전부 제거.
- **한옥 도감 → 공간 기록**: `JourneyEnrichmentSections.tsx`, `BentoJourneyGrid.tsx`, `useJourneyStore.ts` 일괄 변경.
- **JourneyRelationView**: `onOpenEvidence` optional prop으로 변경해 하위 호환성 유지.
- 검증: `npx tsc --noEmit` exit code 0.

## 2026-09-17 — 인기 지역 소리마루 ASMR 큐레이션

홈 피드 "지금 많이 듣는 소리마루" 섹션을 하드코딩 배열에서 실시간 큐레이션으로 교체.

- **API Route 신설**: `src/app/api/home/trending-sounds/route.ts`
  - VisitorService.getDailySeries()(히트맵 캐시 공유, 6h TTL)로 최근 7일 외지인 방문자 합산 → 상위 지역 추출
  - `regionSoundKeywords.ts` 매핑 테이블로 시군구명 → 소리마루 검색어 변환
  - `sorimaruApiAdapter.getFirstStoryByKeyword()` 병렬 호출 → 최대 3개 트랙 반환
  - 오류/빈 응답은 빈 배열 → 클라이언트 FALLBACK_SOUNDS로 graceful degradation
  - Cache-Control: s-maxage=21600 (6시간)
- **매핑 테이블 신설**: `src/features/journey-curator/data/regionSoundKeywords.ts`
  - 17개 시군구 → keyword + displayName 매핑 + `findRegionEntry()` 부분 일치 함수
- **JourneyDiscoveryFeed.tsx 수정**:
  - `TRENDING_SOUNDS` 하드코딩 배열 제거
  - `useTrendingSounds()` 커스텀 훅 추가 (fetch + cancelled 패턴)
  - 로딩 중: `SkeletonCard` 3개 표시 (AGENTS.md 스켈레톤 룰 준수 — 최종 UI와 동일 크기)
  - `FALLBACK_SOUNDS`: 폴백 시 기존 강릉/안동/경주 트랙 표시
- 검증: `npx tsc --noEmit` exit code 0.

## 2026-09-17 — 한옥 이야기 레이아웃 여백 정돈, U자형 빨랫줄 & 잔여 공백 제거

- **트러블슈팅 문서 생성**: `기록/트러블슈팅_한옥이야기_레이아웃및빨랫줄.md`
- **히어로 불필요한 여백/마진 제거**: `IntroContent`의 좌우 40px 패딩 제거(`clamp(24px, 4vh, 40px) 0`), `Intro` 헤더 `max-width: 980px` 제약 해제.
- **타이틀 정렬 및 스타일 개선**: "지금 한옥은 어디에 남아 있을까?" 및 설명문을 본문과 일치하도록 좌측 정렬, `font-weight: 700`(Bold) 적용 및 물음표 반영.
- **폴라로이드 빨랫줄 U자 곡선화 및 정밀 결합**: 2차 베지에 SVG 포물선 패스(`SvgRope`)로 완만한 U자 처짐 구현, 사진을 줄 앞으로 전진 배치(`z-index`), 미니 원목 집게와 줄의 좌표 오차를 0으로 맞물림.
- **잔여 브릿지 공백 제거**: 히어로와 K-컬처 테마 큐레이션 사이에 방치되어 있던 레거시 `<EditorialSection><SectionContainer><NarrativeBridge>...</NarrativeBridge></SectionContainer></EditorialSection>`(높이 146.4px 빈 박스) 제거.
- **검증**: `npx tsc --noEmit` exit code 0, 브라우저 화면 검증 완료.


