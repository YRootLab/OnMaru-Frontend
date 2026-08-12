# Odii Background Variants Checkpoint

## Recovery

- Workspace: `/Users/yangseunghyeon/orca/workspaces/OnMaruFE/odii-background-codex`
- Branch: `feat/odii-background-ui-implements`
- Base commit: `622907c`
- Product source: `/Users/yangseunghyeon/Development/OnMaru/OnMaru-docs/prd.md`
- Workflow: Superpowers (`brainstorming` -> written spec -> user review -> `writing-plans` -> task ledger -> implementation/review)

## Goal

Create calm, interactive Odii background concepts that express Korean jeong, hanok hospitality, maru, changho light, and Korea Tourism Organization data without overwhelming the audio content.

The candidates will be reachable from dedicated comparison routes such as `/odii/be-ver1`, `/odii/be-ver2`, and optionally `/odii/be-ver3` after the design gate is approved.

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
- Keep `/odii` unchanged until a preferred candidate is selected.

## Next step

1. Present three concrete visual/technical approaches with trade-offs and a recommendation.
2. Obtain design approval.
3. Save and commit the approved spec under `docs/superpowers/specs/`.
4. Write the task-by-task implementation plan under `docs/superpowers/plans/`.
5. Execute with a `.superpowers/sdd/<plan>/progress.md` recovery ledger.

## Status

Discovery complete; three candidate routes confirmed; preparing the design approval gate.
