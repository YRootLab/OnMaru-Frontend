# changelog.md

Lightweight human-readable summary of meaningful repository changes. This does not replace Git history.

## Unreleased

- Vercel Git integration의 무인증 private submodule clone을 비활성화하고, `CORE_UI_READ_TOKEN`을 사용하는 GitHub Actions Vercel CLI 배포를 단일 배포 경로로 유지했다.
- 한옥 이야기의 처마 일조·7단계 조립 3D 모달을 문서 최상위 포털로 분리하고, 모바일 안전 영역과 동적 뷰포트 높이에 맞춰 표시했다.
- Vercel Analytics를 루트 레이아웃에 연결해 페이지 조회와 웹 분석 이벤트를 수집한다.
- Next.js·Vitest 및 전이 의존성을 보안 patch 버전으로 올려 의존성 감사 취약점을 모두 해결했다.

- 홈 추천 코스, 인기 한옥 소리, 인기 지역을 백엔드 홈 API로 연동하고 기존 홈 목데이터 프록시를 제거했다.
- 인기 한옥 소리 원천이 `503 SERVICE_UNAVAILABLE`일 때 빈 재시도 UI를 표시한다.
- 여정 탐색 시작 요청이 백엔드 호환 경로와 CSRF·멱등성 요청 정책을 사용한다.
- 홈 데이터가 없거나 요청에 실패하면, 한옥 지붕 캐릭터와 섹션별 재시도 동작을 갖춘 안내 카드로 빈 화면을 대체한다.
- **소리마루 백엔드 우선 데이터 연동**:
  - `GET /api/v1/odii/stories` 목록과 각 상세 응답을 결합해 재생 URL·대본·좌표·콘텐츠 태그를 화면 모델로 전달.
  - 백엔드 요청 또는 상세 응답이 실패하면 기존 공공 Sorimaru API로 자동 폴백해 서비스 목록을 계속 제공.
  - 데이터 요청 중에는 기존 카드 크기의 스켈레톤을 유지하고, 요청 실패 시 경고 아이콘과 재시도 동작을 표시.
- Playwright E2E 테스트가 `E2E_PORT`로 3000~3007 등 실행 중인 개발 서버 포트를 선택하도록 하고 `test:e2e` 스크립트를 추가했다.

- **Microsoft Clarity 사용자 행동 분석 연동**:
  - `NEXT_PUBLIC_CLARITY_PROJECT_ID`가 설정된 환경에서 Clarity 세션 분석을 초기화.
  - 프로젝트 ID가 없으면 분석 스크립트를 로드하지 않아 로컬 개발 환경의 불필요한 수집을 방지.
- **Private core UI 서브모듈 운영 규칙 정비**:
  - `.gitmodules`가 SSH 기반 private `YRootLab/onmaru-core-ui`를 가리키도록 정정.
  - clone·배포 전 서브모듈 초기화와 Vercel CLI 배포 기준을 `AGENTS.md`에 명시.
  - Playwright CI도 recursive submodule checkout을 사용해 Core UI 의존 단위 테스트를 실행하도록 정정.
  - `CORE_UI_READ_TOKEN`으로 CI·배포에서 private submodule을 인증하고, 테스트·빌드 전 `check:submodule` 스크립트로 초기화 누락을 명확히 차단.
- **소리마루 진입 시 간헐적 자동재생 방지**:
  - 초기 URL 대상 이야기는 명시적으로 `autoPlay=true`가 전달된 경우에만 자동재생하도록 변경.
  - 페이지를 떠날 때 오디오를 일시정지하고 소스를 정리해 다음 진입 시 이전 재생 상태가 되살아나지 않도록 수정.
- **로그인 필수 저장 기능 가드**:
  - 비로그인 사용자가 장소/여정/소리/스크린 한옥의 좋아요·북마크를 누르면 저장되지 않고 `로그인해주세요.` 토스트가 표시되도록 통일.
  - 저장 기능의 UI 핸들러와 Zustand 저장소 양쪽에서 인증을 확인해 모든 클릭 경로를 차단.
- **Private Core UI 서브모듈 분리 및 AI / CI 자동화 체계 구축**:
  - 핵심 UI 컴포넌트(지도 온기/히트맵 및 소리마루 오디오/플레이어 등 34개 파일)를 비공개 서브모듈(`src/private/core-ui`, `onmaru-core-ui.git`)로 분리 및 이전.
  - Next.js `@/private/core-ui/*` alias 경로 연동 및 TypeScript 검증 완료.
  - `package.json`에 `submodule:init`, `submodule:update` 스크립트 추가.
  - `AGENTS.md` 및 `.agents/AGENTS.md`에 AI 어시스턴트용 Submodule 자동 초기화/동기화 규칙 추가.
  - GitHub Actions 배포 워크플로우(`deploy.yml`)에 Submodule recursive checkout 및 SSH Key 연동 구성.
- **스크린 속 한옥 (Issue #103) 백엔드 API 연동 및 Fallback 큐레이션 보강**:
  - `GET /api/v1/hanoks/screen-hanok` 엔드포인트 연동 서비스(`screenHanok.service.ts`), `useKCultureThemes` 훅, `KCultureThemeFeed` 카드 UI를 Issue #103 명세 계약에 맞게 정비.
  - 백엔드 실서버 미배포(404) 시에도 드라마/영화/K-POP 탭별로 풍부한 큐레이션이 노출되도록 명세 기반 표준 Fallback 데이터셋(7종)을 적용. 백엔드 배포 후에는 코드 수정 없이 실데이터가 우선 노출됨.
- **GitHub Labels 및 Issue Template 확장 및 정비**:
  - 온마루 프론트엔드 도메인 및 대중적인 FE 태그를 포함한 38종 GitHub Label 체계(Type, Domain, Scope, Priority, Status) 구축 및 동기화.
  - 사용자 경험 및 질문/제안 프로세스를 위한 GitHub Issue Template 4종(`ux_improvement.yml`, `inquiry_question.yml`, `bug_report.yml`, `feature_request.yml`) 및 `config.yml` 추가.
  - `next.config.ts`의 ESM 모듈 참조 및 `process.cwd()` 호환성 개선.

  - 상세 모달 최초 진입 시 상단 메타(제목 · 서브제목 · 핵심 해시태그)와 대본 내용 컴포넌트 전체가 순차적으로 부드럽게 slide-up & fade-in 되는 시네마틱 애니메이션 구현.
  - 대본 문단별 개별 분할 stagger 모션을 내용 컴포넌트 전체 덩어리 단위 모션으로 통합하여 시각적 안정성 및 자연스러운 전환감 제공.
  - 모달 내부에서 상단 탭(`현장 사진 뷰어` ↔ `전체 대본 모드`) 전환 시 매번 재실행되지 않고 즉시 온전한 상태를 유지하도록 세션 상태 관리 및 모달 재오픈 시 1회 애니메이션 자동 리셋 적용.
  - 현장 사진 뷰어 최상단 배치, 하단 실시간 대본 높이 확장, 대본 패널 배경/테두리 투명화 및 상하단 페이드 마스크 적용, 오디오 재생 인디케이터 바 65% 정돈.
- Enforced one-shot scroll reveal rules and reload protection across page sections via `VesselReveal`: sections entering from below bloom once (`0.96 -> 1.0`), stay bloomed when scrolling back upward without folding or replaying, render immediately in final state on page reload without layout shift, and disconnect observers upon reveal for zero CPU overhead.
- Documented scroll reveal rules and state machine in `src/shared/components/animation/README.md` and added unit test coverage in `vesselRevealState.test.ts`.
- Removed redundant inner component slide-up animations inside Sorimaru sections (`SorimaruAudioFeature.tsx`) to prevent double entrance animations with `VesselReveal`, while preserving self-contained staggered reveal on the interactive map constellation (`SoundConstellationSection.tsx`).
- Replaced liquid spring morphing (`layoutId`) across GNB and mobile bottom tabs (`Header.tsx`, `GlobalMobileTabs.tsx`) with a refined, solid glassmorphic capsule active indicator.
- Polished Sorimaru editorial rail and indicator bar padding to eliminate clipping and background box mismatches using pure alpha gradient masks.
- Restored the leading and trailing `linear-gradient` overlays on the Sorimaru Section 2 editorial rail (`SorimaruEditorialRail.tsx`) navigation buttons for both light and dark modes.
- Added new OnMaru app logo assets, switched the global header and map rail logo by light/dark theme, aligned the header theme picker under the right action group, restored the neutral gray VesselReveal border with proper Hanok section breathing room during scroll reveal, refreshed Sorimaru section 2 edge fades and shadow clearance to match the neutral page canvas, restored the section 3 map story list boundary with a thin no-shadow frame, and stabilized the map story section reveal animation.
- Added restrained reading-flow motion to Hanok data and history: one-shot growing distribution bars, synchronized count-up values, and centered paragraph focus inside the detail modal.
- Reserved the responsive “이달의 픽” footprint during hydration so the following Hanok distribution chart no longer appears briefly and shifts out of view.
- Kept the Hanok regional distribution chart visible when a degraded live TourAPI response omits regional data.
- Fixed Sorimaru’s initial listening data to load a playable themed story search. The upstream base list currently contains metadata-only rows, so audio-less entries are now excluded before they reach the player.
- Improved the Sorimaru expanded player: background scrolling now locks without a layout jump, touch overscroll stays inside the drawer, and Roadview uses a responsive 16:9 canvas with resize relayout and a motion-safe fallback image.
- The expanded Sorimaru player now pairs Roadview and playback controls with a scrollable synchronized transcript on desktop, then stacks them for mobile.
- Added a heart control to the expanded Sorimaru player and connected it to the persisted saved-sounds drawer.
- Added a Web Audio analyser-backed GSAP aura to the Sorimaru Roadview player, making playback energy visible without layout or paint-heavy animation.
- Added restrained GSAP parallax/reveal motion to the Sorimaru hero and staggered story-card entry motion.

- Added `docs/specs/TOFE_IMPLEMENTATION_STATUS.md` to make backend `toFE` implementation coverage, gaps, and refreshed BE spec needs visible to the FE team.
- Fixed the Onmaru landing header so light mode keeps the same white navigation surface as the other top-level pages.
- Replaced the header and map rail theme cycle button with an explicit `자동` / `라이트` / `다크` picker while preserving existing light navigation styling.
- Made `system` theme mode time-aware: it now resolves to light during local daytime and dark at night, while still preserving explicit user choices for light or dark.
- Added an environment contract guard for Odii/Sorimaru API keys: `.env.example` is now the tracked template, `.env.local` stays ignored, `npm run check:env` validates supported aliases, pre-push runs the same check locally, and GitHub Actions verifies the contract on PR/push.
- Re-mapped backend feature delta wiring to the existing product surfaces without changing established UI: home `/` journey search now uses the backend journey run path when a backend base URL is configured, `/discover` redirects to `/`, `/map` warmth mode keeps the existing "여행자들이 남긴 온기 이야기" UI while ingesting server VisitReview data through a Warmth adapter, map place cards use canonical saved-place actions with guest login intent, `/mypage` shows the monthly timeline, and logout/account deletion clears private client state.
- Added typed repositories for journey curator, VisitReview, saved resources, and member timeline backend APIs with focused contract tests.
- Added backend feature foundation modules for API error/cursor/CSRF handling, cookie/idempotency `apiRequest`, journey SSE run reduction, VisitReview validation and stale-response protection, saved place login intent, member timeline contracts, and the shared place-slip motion primitive.
- Added a frontend design spec for the backend feature delta covering `/discover` REST+SSE journey runs, `/map` VisitReview, shared canonical place saves, My Page monthly timeline, auth/CSRF/cache rules, neutral "place slip" motion, and performance verification requirements.
- **전국 한옥 수결첩 (手決帖) 스탬프 시스템 (`src/features/stamp`, `/stamps`)**:
  - 장소 상세 정보창(`PlaceDetail.tsx`)에서 "한옥 수결첩 방문 기록 / 인장 찍기" 기능 및 역동적인 전통 인주 도장 찍힘 연출 모달(`StampSealAnimation.tsx`) 구현.
  - 전국 8도 권역별 인터랙티브 SVG 지도 채색(`KoreaMapCanvas.tsx`), 스탬프 도감(`StampBook.tsx`, `StampCard.tsx`), 순례 랭킹 리더보드(`StampLeaderboard.tsx`).
  - Zustand persist 기반 로컬스토리지 영구 보관 및 사용자 계정 동기화.
  - 지도 좌측 네비게이션 레일(`MapNavRail.tsx`)에 [수결첩] 전용 바로가기 메뉴 추가.
- **지도 인터랙티브 효과**:
  - 마우스 커서 이동 시 은은한 금빛 잔상 트레일 (`MapCursorTrail.tsx`).
  - 마커 클릭 시 방사형 파동(Ripple Wave) 및 선택 핀 주변 은은한 동심원 Glow Ring 효과.
  - 수결첩에 기록된 방문 한옥 핀에 붉은 관인 체크 뱃지 표식 표시.
  - 온기 모드 시야를 방해하던 하단 파티클(뽀글거림) 레이어를 제거하여 단정한 지도 뷰 유지.
- **지도 축소 시 마커 뭉침 현상 개선 및 모드 토글 정제**:
  - `PIN_MAX_LEVEL = 6`으로 조정하여 축소 시(레벨 7 이상) 시·군·구 권역별 스마트 클러스터 캡슐(`om-cluster-pill`)로 자동 통합.
  - 뱃지 핀 배경을 불투명 화이트(`#ffffff`)로 변경하고, 주변으로 돌출되던 별무리와 화살표 꼬리를 정리하여 단정한 원형 토큰으로 개선.
  - 라이트 모드 모드 토글(`ModeToggle.tsx`)에서 짙은 블랙 필을 화이트 필로 변경하고, 온기 텍스트 옆 붉은 점 제거.

- **Map Page (`/map`)**: Added `/logo.png` to the Left Navigation Rail and implemented comprehensive Dark Mode support:
  - Replaced text cursive script brandmark in `MapNavRail.tsx` with high-resolution `/logo.png` symbol mark.
  - Added dedicated dark/light mode toggle button to the navigation rail, synchronized with `useOnmaruTheme()`.
  - Seamless dark theme support across all map UI:
    - KakaoMap night mode (`Canvas` moonlight filter) synchronized directly with the global dark theme.
    - Side navigation rail, list panel (`ListPanel.tsx`), search bar (`SearchBar.tsx`), mode toggle (`ModeToggle.tsx`), place list (`PlaceList.tsx`), place list item (`PlaceListItem.tsx`), detail panel (`DetailPanel.tsx`, `PlaceDetail.styles.ts`), popular ranking panel (`PopularPlacesPanel.tsx`), and mobile bottom sheet (`BottomSheet.tsx`).
    - Smart around feed, festival carousel, sorimaru spotlight, and live notice ticker banners.
    - Map control stack and research floating button.

- Implemented traditional Korean ambient background effects for Sorimaru and Hanok Maru:
  - **Sorimaru (`/sorimaru`)**: Added `[Eaves Droplet Ripple]` (concentric water ripple waves simulating raindrops falling from the hanok eaves) and `[Hanji Ink Wash Bleed]` (authentic soft Korean ink diffusion along the vertical hanji deckle edges).
  - **Hanok Maru (`/hanok`)**: Added `<HanokAtmosphereBackground />` featuring the authentic royal **Irworobongdo (日月五峰圖, Sun and Moon and the Five Peaks)** folding screen motif:
    - White Moon on the left and Red Sun on the right with subtle celestial pulse animations.
    - Five stylized mountain peaks (오봉) with traditional ink ridges.
    - Twin waterfalls (쌍폭포) cascading between peaks.
    - Swaying wave lines at the bottom and red pine trees (적송) flanking both sides.
    - 6-panel vertical folding screen creases with full dark mode (`[data-theme='dark']`) and mobile responsive support.
  - Full support for dark mode (`[data-theme='dark']`), responsive layouts, and `prefers-reduced-motion` accessibility.


- Fixed `JourneyAssemblyLoader` automatically popping up upon entering the home/OnMaru page (`/`). The AI journey loading modal and mini-game are now only activated when the user actually initiates a search via the "여정 탐색" button or selects a mood chip.

- Completely removed artificial horizontal hanji tear lines (`HanjiTearTransition` returns null, tags removed) to eliminate floating strip/dot artifacts and let sections breathe with negative space and smooth atmospheric backgrounds.
- Added authentic vertical hanji deckle edge frame to Hanok Maru (`/hanok`) via new shared Emotion component `<HanjiDeckleEdge />` (`src/shared/components/HanjiDeckleEdge`), unifying traditional aesthetic framing across both Sorimaru and Hanok Maru with full dark-mode and mobile support.
- Removed protruding horizontal deckle fiber needle lines (`LEFT_DECKLE_FIBERS`, `RIGHT_DECKLE_FIBERS`) and background window lattice grid pattern (`.thresholdShadow` and repeating-linear-gradients).
- Restored Section 2 ("장면을 따라 걷는 소리") horizontal gutters and aligned all section widths using `CenteredContainer` (`max-width: 72rem`, `padding: 0 1rem` to `2rem`).
- Implemented comprehensive, end-to-end Dark Mode (`[data-theme='dark']`) support across the entire Sorimaru experience:
  - Applied OnMaru dark tokens from `src/design-system/tokens.ts` (`surface.dark.app` `#1C1A17`, `surface.dark.surface` `#24211D`, `surface.dark.card` `#2D2924`, `meok[100]` `#fafafa`, `meok[400]` `#b0b8c1`).
  - Added full dark mode styles to `SorimaruBackgroundStage.module.css`: dark atmospheric canvas, translucent night-sky paper sheets, and dark hanji tear fringe boundaries.
  - Added dark mode support to GNB `Header.tsx` (backdrop glass, nav links, theme toggle button, login button, mobile menu panel) and `GlobalMobileTabs.tsx` so non-landing pages do not render a bright white header capsule in dark mode.
  - Added dark mode styles to `SorimaruAutoSliceRail` (hero typography, play circle, now-playing text) and the Section 2 study variants (`Section2UiImprovements`, `StudyPrimitives`, `CompactPosterVariant`, `EditorialCaptionVariant`, `LandscapeCardVariant`, `OverlayInfoVariant`).
  - Supported dark surfaces and typography across all subcomponents: `SorimaruAtmosphereBackground`, `SorimaruEditorialRail`, `SoundConstellationSection`, `StoryCarousel`, `CategoryTagFilter`, `SorimaruArchiveBrowse`, `SorimaruArchiveMetaBar`, `LocalMiniPlayer`, `SavedSoundDrawer`, `SorimaruQuestionAssistant`, and `SorimaruFooterCTA`.
- Migrated all of Sorimaru (`src/features/sorimaru-audio`) to Emotion CSS and unified color styling with design system tokens (`src/design-system/tokens.ts`):
  - Converted all 26 components in `src/features/sorimaru-audio/components/` and `src/features/sorimaru-audio/section2-study/` to semantic Emotion styled components.
  - Purged all Tailwind CSS classes, `--tw-*` CSS variables, and `@tailwind` directives from `globals.css` and the entire codebase.
  - Deleted `tailwind.config.ts`, and removed `tailwindcss` plugin/dependency from `postcss.config.mjs` and `package.json`.
  - Preserved 100% of custom audio controls, script synchronization, SVG interactive constellation map, 3D Z-translate perspective stages, and floating vinyl disc animations.

- Fixed leftover `react-icons/io5` and `Io*` references after the Lucide migration so `/odii` can compile and respond again in dev.

- Implemented OnMaru Admin Web Console (`/admin` suite) for Spring Boot backend readiness with complete mock datasets and dual-mode API client (`src/lib/api/client.ts`):
  - **Issue #52 (Foundation & Auth)**: Dual-mode API client (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`), JWT refresh interceptor, RBAC `useAdminAuth` hook (`ADMIN`, `EDITOR`, `USER`).
  - **Issue #53 (Layout & Reusable UI System)**: 240px `AdminSidebar` with active indicators & badges, 60px blurred `AdminHeader`, `DataTable` with pagination and selection, `StatCard`, `StatusBadge`, `ConfirmDialog`, `Pagination`, `EmptyState`, `TableSkeleton`, and `Toast`.
  - **Issue #54 (Dashboard & Reviews)**: `/admin` KPI overview (today's warmth, pending reports, new signups, total users) with manual pipeline rebuild modal, and `/admin/reviews` with multi-filter bar, sticky batch action bar, and 400px slide-in detail drawer.
  - **Issue #55 (Reports & Curation)**: `/admin/reports` card-based moderation view with quote block, report status tabs, and destructive confirm dialogs; `/admin/curation` inline-editing table for Hanok villages (17), stays (172), and routes (41) with badge popovers, inclusion switches, unsaved orange indicators, and rebuild triggers.
  - **Issue #56 (Users, Pipeline & Login)**: `/admin/users` RBAC user management with role change guards and reason-mandatory suspension modal; `/admin/data` pipeline monitor with quota gauges, 20 failure logs, JSON export, and live progress simulator; and `/admin/login` card-based authentication with quick dev login helpers.

- Fixed the /map bottom navigation "jump": Header now stays mounted on /map and its mobile tab bar crossfades between the global tabs and map-specific tabs from the same fixed shell, instead of hard-swapping two differently-positioned components.
- Added a desktop /map entrance choreography: the GNB flips away (3D rotateX, calendar-page style) while the left navigation rail slides in simultaneously, the floating list/detail panel springs in next, and the top category chip bar rises in last — timing centralized in `mapEntranceTiming.ts`.
- Redesigned `MapNavRail` (desktop left rail) as a slim floating glass capsule (60px wide, 14px inset, `border-radius: 22px`, backdrop blur) matching the GNB capsule's visual language, replacing the old 68px flush opaque sidebar; removed the redundant chevron/dropdown on its 지도 item.
- Repositioned and resized the /map category chip bar (`MapChips`) to align with the GNB's position/height (`HEADER_HEIGHT`) and shrank the individual chip pills for a slimmer profile.

- Standardized the entire icon system across 60+ components to rounded React library icons (`react-icons/io5` Ionicons 5 outline & round series, and `react-icons/ri` Remix Icons for 5-tier sentiment ratings). Completely purged all non-react-library icons, raw SVG polygons, and raw unicode symbols (`➔`, `←`, `›`, `▲`, `▼`, `×`, `✕`) for cross-app visual harmony.
- Replaced legacy multi-colored raw SVG strings in `PlaceMarkers` (`CATEGORY_STYLES`), `WarmthLayer`, and `WarmthNotesLayer` with 1:1 matching rounded `react-icons/io5` SVGs (`IoStorefrontOutline`, `IoBookOutline`, `IoHomeOutline`, `IoRestaurantOutline`, `IoCafeOutline`, `IoSparklesOutline`, `IoCalendarOutline`, `IoBagHandleOutline`). All map label pins (`.om-pin`), circular badge pins (`.om-badge-pin`), cluster pills (`.om-cluster-pill`), and warmth overlays now perfectly match the top floating category chips in style, roundness, and category color.
- Redesigned top navigation bar with a Mindtrip-inspired floating capsule pill (`border-radius: 9999px`) architecture, layered backdrop blur (`HeaderBackdrop`), and clean pill-shaped hover micro-interactions replacing rigid underline animations.
- Removed upward Y-shift animation (`translateY(-1px)`) on navigation hover, ensuring stable, zero-motion typography where only the subtle 3% background tint and font color smoothly transition.
- Simplified the `지도` navigation item from a 2-item dropdown menu (`정보지도`/`온기지도`) into a direct, clean `NavLink`, eliminating visual clutter in GNB and mobile menu.
- Slimmed down navigation bar height to 46px (from 56px) with compact padding, 24px logo, 13px link typography, and 30px CTA button for an ultra-sleek, lightweight Mindtrip silhouette.
- Refined navigation hover background to a soft, airy feather-light gray (`rgba(0, 0, 0, 0.03)` / `rgba(255, 255, 255, 0.07)`) for higher transparency and subtlety.
- Unified the Login CTA button to a consistent black tone (`rgba(28, 26, 23, 0.94)` / `rgba(20, 18, 16, 0.95)` with `#ffffff` text and refined borders) matching the Hanok Archive (한옥도감) aesthetic across all pages.
- Enhanced white/light mode surface adaptation with neutral frosted glass (`rgba(255, 255, 255, 0.88)` + 16px blur) and preserved scroll-direction hide/reveal thresholds (`320ms cubic-bezier(0.16, 1, 0.3, 1)`).
- Implemented AI Journey Curator (`/discover`) with interactive Knowledge Graph, Bento Grid (Map route, Hanok 3D, ODII audio, real-time Warmth), and natural language/mood search.
- Added global GNB and mobile menu navigation link (`✨ 여정 탐색`) for the Journey Curator.
- Redesigned Map `ModeToggle` with a Silicon Valley capsule form factor, semantic iconography (`Landmark` & `Flame`), live warmth pulse, and zero-shadow/zero-border aesthetic.
- Updated `WarmthFeed` 14-region carousel with clean flat chips and smooth gradient/backdrop-blur masks on navigation chevrons.
- Fixed hovered marker z-index in `PlaceMarkers` and updated `warmthRepo` 14-province mapping.
- Fixed build parsing error in `odiiNetwork.ts` by removing dangling code block and properly exporting `odiiNetworkClient`.

- Configured project initial harness files (`CLINE.md`, `project-roadmap.md`, `CONTRIBUTING.md`) and enriched `AGENTS.md` with work tracking & issue-first guidelines.
- Installed client-side Git Flow pre-push hook (`.githooks/pre-push`, `scripts/install_git_hooks.sh`) blocking accidental direct pushes to `develop`, `main`, and `release/*`.
- Fixed syntax error and export in `odiiNetwork.ts`, resolved test runner config for Vitest/Playwright, and refined `OdiiEditorialRail` card index badge size/positioning.
- Standardized `VesselReveal` morph width across `/hanok` to `w-full` with nested `max-w-6xl` padding containers, preventing edge clipping during scroll morphing.
- Updated `/hanok` grid layout to a 4-column desktop layout (`repeat(4, 1fr)`) and optimized `VillageCard` font sizes, badges, and padding proportions.
- Restored `PolaroidCard` frame `box-shadow` styling and converted Odii API network error handling to gracefully suppress Next.js dev overlay error popups.
- Aligned the Odii scene title and editorial rail to one shared content boundary and applied the existing Vessel reveal behavior to all major Hanok archive sections.
- Restored the Hanok Kakao map by accepting either local Kakao key name and pinned the active Hanok route's document canvas, layout gutters, and deferred map surface to white.
- Made `/hanok` render immediately from a non-empty snapshot and refresh TourAPI data after hydration, preventing the external 10-second timeout from blocking navigation; changed only the page canvas/background to white.
- Prevented first-entry Odii scroll contention by waiting until the Sound Constellation actually enters the viewport and by giving its SVG paths complete initial Motion values.
- Restored reversible Odii vessel reveals: unseen sections bloom while scrolling down, fold through the lower boundary while scrolling up, and do not replay from a shrunken state after reload.
- Reduced `/odii` and `/hanok` server HTML by incrementally flushing Emotion styles instead of repeating accumulated CSS.
- Added one-shot viewport activation for the Odii sound map and Hanok Kakao map while preserving their existing frames, UI, and motion.
- Isolated Odii endpoint resolution and raw response decoding behind an injectable normalized transport adapter.
- Consolidated Odii hero/archive loading and batched carousel scroll measurements.
- Added deterministic cleanup for Hanok map listeners, overlays, markers, clusters, and timers, plus memoized archive filtering and a deferred detail modal bundle.
- Refined Odii sound-map scrolling, list layout, image fallbacks, and neutral loading surfaces.
- Optimized traditional hanok map markers (rest-state static with hover burst animation, yellow color tokens) and fixed zoom/viewport place loss on API failures.
- Hardened Odii audio guide API proxy with a 6-second timeout and fail-safe fallback payload to prevent developer console error overlays during public portal downtime.
- Added shared multi-agent project guidance and Git Flow policy.
- Reworked the Odii archive into a paginated two-column story browser with an optional current-page place grouping view.
- Added a source-grounded natural-language Odii assistant UI and server proxy contract for a future RAG/LangGraph backend.
- Added ADR-0002 for story-first archive behavior and ADR-0003 for the cited RAG/LangGraph architecture.

## [Unreleased] 
### Changed 
- Split long Odii narration text into timed sentence cues and present it as
  numbered listening segments, with only the active sentence at full opacity.
- Redesigned the expanded Odii player around one readable, scrollable
  transcript panel with a restrained dark lamp header, centered active
  sentence tracking, 60% inactive sentence opacity, direct sentence seeks,
  content tags, and dimension-stable transcript loading skeletons.
- Removed empty and duplicate Hanok detail tags, normalized both galleries, and assigned distinct AnimatePresence keys to the detail and lightbox overlays so opening a photo no longer triggers duplicate React key warnings.
- Fixed horizontal clipping in the Hanok AI story panel by wrapping the complete result in a forced single-column grid, constraining every content boundary, and rendering sources as multiline full-width rows.
- Prevented address-only Hanok summaries from appearing as AI history, merged verified snapshot descriptions into address-only live list records, delayed Gemini context until TourAPI detail resolution, and updated the grounded-search model candidates to the current Gemini 3.x Flash models.
- Fixed the global theme toggle hydration mismatch by deferring browser-only preference, time, and viewport state until after the server-matching first render, adding a server snapshot guard to the header UI, and preserving the pre-hydration `data-theme` paint.
- Added a source-grounded AI story panel to Hanok Dogam details, with history summaries, timelines, on-site observation points, public source links, neutral loading states, request cancellation, and a non-hallucinatory TourAPI fallback; repaired both Hanok detail modals to call the existing TourAPI detail endpoint instead of the removed `/api/village/:id` route.
- Migrated all icons in the project to lucide-react. Removed react-icons dependency. (Resolves #60, #61, #62, #63, #64)
- Replaced emoji usages in data files (e.g. curatedJourneys.ts) with lucide-react components.
- 지도 카테고리 칩의 mask 기반 edge fade를 제거해 그림자 잘림을 막고, PR #66 이전의 둥근 pill 크기와 stagger pop-in 동작을 복원했다.
