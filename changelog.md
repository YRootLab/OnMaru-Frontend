# changelog.md

Lightweight human-readable summary of meaningful repository changes. This does not replace Git history.

## Unreleased

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
