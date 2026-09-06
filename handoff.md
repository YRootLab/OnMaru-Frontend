# handoff.md

Current task:

- Optimize `/odii` and `/hanok` loading, rendering, and transition bottlenecks without changing visible UI, colors, typography, interaction flow, or normal-motion parameters.

Branch and plan:

- Branch: `feature/odii-hanok-performance`
- Design: `docs/superpowers/specs/2026-09-06-odii-hanok-performance-design.md`
- Plan: `docs/superpowers/plans/2026-09-06-odii-hanok-performance.md`

Implemented:

- Emotion SSR insertion now flushes only newly inserted names; repeated stylesheet bodies were removed.
- Shared one-shot viewport activation defers the Odii Sound Constellation API and Hanok interactive map/Kakao SDK.
- Odii network URLs and raw payloads are replaceable through injected endpoint resolver and response decoder functions.
- Odii archive page 1 supplies the hero subset, reducing parent initial requests from three to two while keeping nearby data independent.
- Story carousel scroll measurements are animation-frame batched and drag snap offsets are cached.
- Vessel reveals stay final after first display and respect reduced motion without changing normal animation values.
- Hanok map region rebuilds and unmounts dispose listeners, overlays, markers, cluster resources, DOM listeners, and timers.
- Hanok grid filtering/pagination is memoized; the detail modal is split from the initial bundle and prefetched during idle time.
- Hanok stay accordion `flex` spring animation remains unchanged because perceptual equivalence was not established.

Fresh verification:

- `npx vitest run`: 21 files, 70 tests passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed with Next.js 16.2.10.
- `npm run lint`: repository baseline failed with 41 errors and 75 warnings outside the scoped fixes; details are recorded in `improvements.md`.
- Targeted lint: touched Hanok files passed; touched Odii files have no errors and retain two external-image `<img>` warnings.

Production artifact comparison:

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| `/odii` HTML | 300,920 B | 197,234 B | -34.5% |
| `/hanok` HTML | 683,858 B | 203,795 B | -70.2% |
| Odii Emotion CSS | 116,352 B / 9 repeats | 12,928 B / 0 repeats | -88.9% |
| Hanok Emotion CSS | 517,506 B / 11 repeats | 47,046 B / 0 repeats | -90.9% |
| `/odii` initial JS gzip | 341,609 B | 343,146 B | +0.5% |
| `/hanok` initial JS gzip | 278,010 B | 275,222 B | -1.0% |

Open verification gap:

- Browser discovery returned no available browser instances, and Playwright/Puppeteer are not installed in the repository. Desktop/mobile screenshots, real scroll traces, and interactive Kakao verification were therefore not claimed.

Next step:

- Connect an automation browser and run desktop/mobile visual regression plus interaction checks for Odii carousel/reveals and Hanok map/modal/filter flows.
- Address repository-wide lint debt separately from this performance branch.
