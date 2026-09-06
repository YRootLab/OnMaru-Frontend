# changelog.md

Lightweight human-readable summary of meaningful repository changes. This does not replace Git history.

## Unreleased

- Refined Odii sound-map scrolling, list layout, image fallbacks, and neutral loading surfaces.
- Optimized traditional hanok map markers (rest-state static with hover burst animation, yellow color tokens) and fixed zoom/viewport place loss on API failures.
- Hardened Odii audio guide API proxy with a 6-second timeout and fail-safe fallback payload to prevent developer console error overlays during public portal downtime.
- Added shared multi-agent project guidance and Git Flow policy.
- Reworked the Odii archive into a paginated two-column story browser with an optional current-page place grouping view.
- Added a source-grounded natural-language Odii assistant UI and server proxy contract for a future RAG/LangGraph backend.
- Added ADR-0002 for story-first archive behavior and ADR-0003 for the cited RAG/LangGraph architecture.
