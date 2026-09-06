# ODII First-scroll Performance Design

## Goal

Keep all existing ODII content, interaction behavior, map code, layout, and colors while removing non-visible initial work that competes with first-scroll rendering.

## Decisions

- The editorial rail loads its selected category only after the rail is near the viewport. Other categories load only on explicit tab hover/focus or selection, and their images are never bulk-prefetched.
- Section 4 and section 6 requests and state are deleted because neither section is rendered.
- Nearby-card images use native lazy loading and asynchronous decoding. Accent colors retain the existing fallback palette and defer canvas extraction until browser idle time.
- VesselReveal keeps its stage threshold, scale, translation, opacity, border, copy, and colors, but uses IntersectionObserver rather than per-scroll geometry reads and does not animate shadow or radius.
- Header state changes retain their thresholds and output, but are calculated once per scroll event via one queued animation frame rather than an endless frame loop.

## Non-goals

- No map component, map state, routes, UI strings, palette, card geometry, or feature semantics change.
- No new visual transition is added. Existing rail and content transitions remain limited to transform and opacity where possible.

## Verification

- Add unit coverage for rail loading eligibility and bounded preload candidates.
- Run targeted ODII tests, lint, and production build. Inspect the diff to confirm map files and UI classes are not changed.
