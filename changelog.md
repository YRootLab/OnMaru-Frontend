# changelog.md

Lightweight human-readable summary of meaningful repository changes. This does not replace Git history.

## Unreleased

- Implemented OnMaru Admin Web Console (`/admin` suite) for Spring Boot backend readiness with complete mock datasets and dual-mode API client (`src/lib/api/client.ts`):
  - **Issue #52 (Foundation & Auth)**: Dual-mode API client (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`), JWT refresh interceptor, RBAC `useAdminAuth` hook (`ADMIN`, `EDITOR`, `USER`).
  - **Issue #53 (Layout & Reusable UI System)**: 240px `AdminSidebar` with active indicators & badges, 60px blurred `AdminHeader`, `DataTable` with pagination and selection, `StatCard`, `StatusBadge`, `ConfirmDialog`, `Pagination`, `EmptyState`, `TableSkeleton`, and `Toast`.
  - **Issue #54 (Dashboard & Reviews)**: `/admin` KPI overview (today's warmth, pending reports, new signups, total users) with manual pipeline rebuild modal, and `/admin/reviews` with multi-filter bar, sticky batch action bar, and 400px slide-in detail drawer.
  - **Issue #55 (Reports & Curation)**: `/admin/reports` card-based moderation view with quote block, report status tabs, and destructive confirm dialogs; `/admin/curation` inline-editing table for Hanok villages (17), stays (172), and routes (41) with badge popovers, inclusion switches, unsaved orange indicators, and rebuild triggers.
  - **Issue #56 (Users, Pipeline & Login)**: `/admin/users` RBAC user management with role change guards and reason-mandatory suspension modal; `/admin/data` pipeline monitor with quota gauges, 20 failure logs, JSON export, and live progress simulator; and `/admin/login` card-based authentication with quick dev login helpers.

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
