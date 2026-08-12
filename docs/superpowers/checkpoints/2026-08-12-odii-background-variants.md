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

## Next step

1. Obtain user review of the rewritten four-candidate spec.
2. Write the task-by-task implementation plan under `docs/superpowers/plans/`.
3. Execute with a `.superpowers/sdd/<plan>/progress.md` recovery ledger.

## Status

Direction corrected after user review; background-only four-candidate spec rewritten with version 4 as the recommendation.
