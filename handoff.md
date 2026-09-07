# handoff.md

Current work:
- Summary: Project initial harness setup & Git Flow push protection hooks
- Issue/PR: none (harness initialization)
- Branch: `feature/issue-based-developmenet-install`

Touched files:
- `AGENTS.md`
- `CLINE.md`
- `CONTRIBUTING.md`
- `project-roadmap.md`
- `.githooks/pre-push`
- `scripts/install_git_hooks.sh`
- `changelog.md`
- `src/features/odii-audio/api/odiiNetwork.ts`
- `src/features/odii-audio/api/odiiApi.ts`
- `vitest.config.mts`

Next step:
- Create pull request into `develop` and verify CI checks.

Ad hoc requests captured this session:
- Issue-based development harness & Git Flow push protection for private repo.

Implemented:

- Emotion SSR insertion now flushes only newly inserted names; repeated stylesheet bodies were removed.
- Shared one-shot viewport activation defers the Odii Sound Constellation API and Hanok interactive map/Kakao SDK.
- The Odii Sound Constellation now activates at actual viewport entry instead of a 700px margin that opened during initial render on common desktop heights.
- Sound-map SVG paths receive complete initial Motion values, eliminating repeated `fillOpacity: undefined` interpolation warnings on first entry.
- Odii network URLs and raw payloads are replaceable through injected endpoint resolver and response decoder functions.
- Odii archive page 1 supplies the hero subset, reducing parent initial requests from three to two while keeping nearby data independent.
- Story carousel scroll measurements are animation-frame batched and drag snap offsets are cached.
- Vessel reveals use a colocated pure state module: unseen sections bloom at the 75% reveal boundary, non-protected sections fold there on upward return, and the full current viewport plus preceding sections are protected at reload without position drift or replay. Normal motion values are unchanged and reduced motion uses the same states with zero duration.
- Hanok map region rebuilds and unmounts dispose listeners, overlays, markers, cluster resources, DOM listeners, and timers.
- Hanok grid filtering/pagination is memoized; the detail modal is split from the initial bundle and prefetched during idle time.
- Hanok route rendering is snapshot-first and no longer awaits TourAPI. A cancellable client refresh replaces data only for valid non-empty payloads; the page and route body backgrounds are white.
- Kakao map configuration accepts either `KAKAO_MAP_KEY` or `NEXT_PUBLIC_KAKAO_MAP_KEY` through `next.config.ts`; the local key remains gitignored. A route surface marker pins the Hanok document canvas, `PageContainer` gutters, and both deferred map loading layers to white without changing map controls or content animation.
- The Odii scene title/category/card rail now share one `max-w-6xl` owner, and all six major Hanok archive units reuse the shared `VesselReveal` lifecycle without local animation state.
- Hanok stay accordion `flex` spring animation remains unchanged because perceptual equivalence was not established.

Fresh verification:

- `npx vitest run`: 27 files, 86 tests passed.
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
- Next development-server logs confirmed that the repeated Sound Constellation Motion warnings disappeared after the first-entry fix and that an Odii reload did not immediately request its deferred API.
- Kakao SDK returned HTTP 200 for the configured local origin, and live development logs showed `/map` issuing map data requests after center/zoom changes.
- `/hanok` server HTML contains all six stable reveal boundaries; `/hanok` and `/odii` both returned HTTP 200 after the layout/reveal change.
- The detailed diagnosis, rejected alternatives, code paths, and remaining GLB trace gap are recorded in `troubleshooting-worklog/26.09.06 소리마루 첫 진입 스크롤 병목.md`.
- Vessel reveal behavior and maintenance rules are documented in `src/shared/components/animation/README.md`; its debugging record is `troubleshooting-worklog/26.09.06 소리마루 섹션 리빌 복귀와 새로고침.md`.

Next step:

- Connect an automation browser and run desktop/mobile visual regression plus interaction checks for Odii carousel/reveals and Hanok map/modal/filter flows.
- Address repository-wide lint debt separately from this performance branch.
