# Odii Background Variants Checkpoint

## Recovery

- Workspace: `/Users/yangseunghyeon/orca/workspaces/OnMaruFE/odii-background-codex`
- Branch: `feat/odii-background-ui-implements`
- Base commit: `622907c`
- Product source: `/Users/yangseunghyeon/Development/OnMaru/OnMaru-docs/prd.md`
- Workflow: Superpowers (`brainstorming` -> written spec -> user review -> `writing-plans` -> task ledger -> implementation/review)

## Goal

Create calm, interactive Odii background concepts that express Korean jeong, hanok hospitality, maru, changho light, and Korea Tourism Organization data without overwhelming the audio content.

The candidates will be reachable from `/odii/be-ver1`, `/odii/be-ver2`, `/odii/be-ver3`, and `/odii/be-ver4` after the design gate is approved.

## Direction correction from user review

- The external PRD was provided only to understand On-Maru's service identity; the Odii background spec must not reproduce the full PRD.
- This is an Odii discovery and playback page powered by Korea Tourism Organization audio data, not the existing 3D hanok explanation experience.
- Do not add a 3D hanok tour, maru explanation, architectural disassembly, or camera journey through a hanok.
- Preserve the existing Odii sections and foreground content. Background work should strengthen their flow: featured audio, weekly/ranked curation, location-aware audio, hanok stories, traditional-market stories, topic/location archives, and the closing invitation.
- Rebuild the original three candidates as background-only systems with light section transitions.
- Keep every candidate close to the current white page: no dark scene, large saturated color field, or dramatic palette shift.
- Remove the sound-wave/ripple background direction entirely.
- Retain the useful structural lesson from the Shopify Editions analysis: one fixed background stage persists for the whole page and changes continuously with scroll and the active Odii section.
- The persistent stage must still create clearly distinct section atmospheres. Each section has its own scene state; transitions interpolate between states instead of hard-swapping unrelated backgrounds.
- Add version 4 as the designer-recommended synthesis: `소리가 머무는 온마루`, using hanji air, hospitality light, section-specific threshold shadows, contextual warmth gatherings, and one restrained archive tear.
- Do not copy Shopify's Renaissance imagery, 3D scenes, dramatic camera work, dark palette, or game-like presentation.
- Translate the persistent-stage structure into restrained hanji, sunlight, breeze, warmth, changho shadow, and travel-record materials.
- The previously committed design direction was rejected and has been replaced by the reviewed four-candidate, background-only direction.

## Confirmed constraints

- Preserve the existing `/odii` route until a preferred concept is selected.
- Use the existing Odii API-backed content and player behavior; candidates vary the atmospheric background and section transitions, not the service data model.
- Prefer a continuous, living hanok space over disconnected decorative backgrounds.
- Use torn hanji transitions sparingly and meaningfully, not on every section.
- Avoid Western scrapbook signals such as masking tape, newspaper collage, dirty paper, and loud stickers.
- Maintain reduced-motion and low-performance fallbacks.
- No implementation starts before the written design is reviewed and approved.

## PRD findings

- Brand promise: technology restores warmth, hospitality, and connection rather than feeling cold.
- Odii focus: historic homes/head houses, hanok villages/traditional alleys, pavilions/gazebos.
- Visual motifs supported by the PRD: maru as an open boundary, wind path, changho light, roof curves, day-to-night progression.
- Public data and audio information must remain the foreground; atmosphere is supporting narrative.

## Current implementation findings

- `OdiiAtmosphereBackground` is currently a fixed white layer with one radial gradient.
- `/odii` renders the same `OdiiAudioFeature` and must stay stable during comparison work.
- Existing `VesselReveal` gives all later sections the same rounded digital-capsule transition; selected candidate routes may replace or selectively bypass it.
- Existing hanok image assets can support static/mobile fallbacks.
- Three.js, React Three Fiber, Framer Motion, GSAP, and Lenis are already installed; no new rendering dependency is currently justified.

## Confirmed candidate routes

- `/odii/be-ver1`
- `/odii/be-ver2`
- `/odii/be-ver3`
- `/odii/be-ver4`
- Keep `/odii` unchanged until a preferred candidate is selected.

## Implementation result

- Shared scene model: seven stable stages, five restrained category modifiers, deterministic tear-boundary invariants.
- Shared controller: dominant-section selection, deterministic tie breaking, section-local progress, clamped pointer motion, document visibility, reduced-motion and unsupported-observer static fallback.
- Version 1 `온기의 결`: light pools, fine hanji grain, disconnected warmth points.
- Version 2 `창호 사이의 바람`: restrained changho, garden and timber-like shadows.
- Version 3 `한지로 이어진 여행`: editorial paper depth with strong tears only before nearby and archive.
- Version 4 `소리가 머무는 온마루`: balanced hanji air, hospitality light, threshold/garden shadow, gathered warmth and one archive tear.
- Production `/odii`: continues through the original white radial-gradient compatibility path.
- Existing Odii content, API service, playback, bookmark, filter, modal, drawer and player implementations remain shared rather than copied into preview routes.

## Recovery commits

- `e960589` — implementation plan
- `06be6f0` — scene domain model
- `56e2125` — section and motion controller
- `64aad0c` — fixed-stage renderers and hanji transition
- `9e4139f` — Odii stage integration and preview routes

## Verification record

- Baseline: `npm run test:odii` — PASS, 1 file / 4 tests.
- Focused integration before final review: 4 files / 20 tests — PASS.
- Production build: PASS; `/odii` and `/odii/be-ver1` through `/odii/be-ver4` were emitted as static routes.
- Final verification: 4 test files / 22 tests PASS; TypeScript PASS; task-scoped ESLint PASS; `next build --webpack` PASS with all 15 pages generated.
- Local route probes against the existing port 3000 server: all five routes returned HTTP 200.
- Returned markup: `/odii` contains the existing `odii-atmosphere`; preview routes contain their exact variant and all seven `data-odii-stage` values.
- Source review finding: environments without `IntersectionObserver` could throw before reaching the intended static fallback. A RED/GREEN test now protects the feature-detection guard and disables all ambient motion when animation support is absent.
- Brightness review finding: the strongest pink warmth gradient was reduced from `0.10` to `0.085`, within the approved decorative accent limit.
- Repository-wide `npm run lint` remains non-zero because of existing unrelated debt (39 errors / 67 warnings in Tour API, landing, archived 3D hanok and existing Odii components). Task-scoped ESLint is used as the change boundary; none of those unrelated files were modified.
- Default Turbopack build passed once after route integration. Later reruns stalled without an error at `Creating an optimized production build`, including after stopping the same-worktree dev server and moving the partial `.next` output aside. The one-variable webpack build then completed successfully, isolating the stall to the Turbopack runner/session rather than application compilation. The two moved partial build directories remain recoverable under `/private/tmp/odii-next-stale-20260812-1430` and `/private/tmp/odii-next-stale-20260812-1433`.

## Deferred visual observations

The in-app browser runtime reported no available browser backends, so screenshot-based checks at 1440x1000, 1920x1080, 390x844 and 430x932 and browser emulation of `prefers-reduced-motion` could not be performed in this session. Automated reduced-motion logic, CSS reduced-motion rules, route rendering, compilation and server responses are covered; viewport-level visual approval remains the only deferred review item.

## Status

Implementation complete. Task-scoped automated verification and route probes complete; repository-wide legacy lint and screenshot-based visual approval are explicitly deferred.

## White-canvas correction

- User comparison feedback rejected the cream/golden atmosphere before choosing a variant.
- Versions 1-4 keep their geometry, motion, section states and paper treatment, but now share a true-white `#ffffff` canvas and white paper surfaces.
- Golden, beige, ochre, amber, coral and green-tinted background values were removed from the experimental background module. Fibers, shadows and former warmth points now use neutral gray alpha only.
- `/odii` remains on its original compatibility background.
- Verification: palette test observed RED before the contract existed, then GREEN; final focused suite passed 4 files / 23 tests; TypeScript and task-scoped ESLint passed; webpack production build generated all 15 routes.
- Live development probes returned HTTP 200 for `/odii/be-ver1` and `/odii/be-ver4`, and the rendered markup exposed `--odii-bg-canvas:#ffffff` with the expected route variant.
