# Odii Interactive Background Variants Design

## Purpose

Build three isolated background candidates for the Odii audio-guide experience so the team can compare a calm brand-first treatment, a tactile hanji editorial treatment, and a technically ambitious spatial treatment before changing the production `/odii` route.

The experience must communicate On-Maru's promise: technology should reveal Korean warmth, hospitality, and connection rather than feel cold or ornamental. Korea Tourism Organization Odii content remains the foreground; the background supports its narrative.

## Product grounding

The design follows On-Maru PRD 2.5 and its Odii feature definition:

- Maru is an open boundary and a symbol of hospitality.
- Changho brings light into the house.
- The hanok creates a path for wind rather than shutting nature out.
- Odii focuses on historic homes and head houses, hanok villages and traditional alleys, and pavilions and gazebos.
- Public tourism data must be curated into culture and story, not displayed as decorative noise.

## Scope

### In scope

- Add `/odii/be-ver1`, `/odii/be-ver2`, and `/odii/be-ver3` comparison routes.
- Reuse the same Odii content, API behavior, audio player, filters, bookmarks, and modals as `/odii`.
- Make background and section-transition behavior selectable through an explicit variant interface.
- Add subtle pointer and scroll reactions appropriate to each candidate.
- Add reduced-motion, mobile, low-performance, and rendering-failure fallbacks.
- Keep all candidates natural, calm, and legible.

### Out of scope

- Replacing `/odii` with a candidate.
- Changing Odii API schemas, curation rules, or audio playback behavior.
- Redesigning every content card.
- Adding new rendering or animation dependencies.
- Building multiple heavyweight 3D scenes.
- Western scrapbook motifs such as masking tape, newspapers, stickers, or distressed paper.

## Shared route and composition model

`OdiiAudioFeature` accepts a background presentation variant while retaining its current default behavior. The three candidate pages are thin route wrappers that select a variant. `/odii` supplies no candidate variant and therefore remains unchanged.

The content tree remains above a fixed atmospheric stage. Each major section exposes a stable section identity to the background controller. The controller maps page scroll progress and the currently dominant section to a small set of visual properties such as light position, shadow opacity, depth offset, and time of day.

Background rendering is decorative and non-interactive from an accessibility perspective. It uses `aria-hidden`, never captures keyboard focus, and does not block content pointer events.

## Candidate 1: Light Resting on the Maru

Route: `/odii/be-ver1`

This is the recommended production candidate. It expresses one continuous hanok space with restrained 2.5D depth rather than changing to unrelated backgrounds between sections.

### Visual language

- Warm off-white plaster and hanji instead of pure white.
- A dark, softly blurred timber frame at the far edges establishes the feeling of looking outward from a maru.
- Changho lattice shadows travel slowly across the page.
- A distant garden-light layer and a near timber layer move at different rates.
- The full page progresses from clear morning light through warm afternoon to a quiet evening glow.
- Brand pink appears only as a small reflected warmth near active audio states, never as a large atmospheric wash.

### Motion

- Pointer parallax is clamped to 6-8 CSS pixels and follows with spring-like delay.
- Scroll changes light position and warmth continuously rather than snapping at section boundaries.
- The background remains visually quiet while the user manipulates filters or the player.
- Two subtle torn-hanji boundaries may appear: before the full archive and before the closing CTA.

### Implementation profile

- DOM/CSS/SVG layers with Framer Motion values.
- Existing hanok imagery may be used only as a soft, cropped fallback or depth plate.
- No WebGL requirement.
- Highest likelihood of becoming the production `/odii` background.

## Candidate 2: Hanji Sound Journal

Route: `/odii/be-ver2`

This candidate explores a Korean tactile editorial language. It should feel like carefully handled cultural records placed on a maru, not a Western scrapbook.

### Visual language

- Clean warm hanji sheets with visible mulberry fibers.
- Small index tabs, restrained red seals, thread-binding details, and dry-brush dividers.
- Archive-oriented sections feel like catalog records rather than floating app cards.
- Paper remains light and cared for; yellowed, dirty, burnt, or heavily wrinkled textures are prohibited.

### Torn hanji transitions

Only two strong tear transitions are used:

1. Between the scene-selection experience and location-aware recommendations.
2. At the entrance to the full searchable archive.

Each transition contains four visual layers: upper paper body, irregular alpha edge, 1-3 pixel bright fiber fringe, and a warm contact shadow. The transition reveals a prepared edge mask instead of generating random geometry during scroll. The paper lifts 8-20 pixels while the next section becomes visible. Reversing scroll reverses the reveal without a destructive one-shot animation.

### Motion

- Paper sheets enter with small vertical offsets and rotations no greater than 0.6 degrees.
- Depth shifts are small enough that text never moves independently from its interactive hit target.
- Pointer response is limited to decorative paper layers.

### Implementation profile

- DOM layers plus reusable SVG or CSS masks.
- Framer Motion scroll progress drives reveal variables.
- Medium implementation and QA cost.
- Strongest identity, but less suitable than version 1 if it distracts from browsing many audio results.

## Candidate 3: Quiet Hanok Landscape

Route: `/odii/be-ver3`

This candidate tests the spatial continuity that makes Shopify Editions compelling while translating it into a restrained Korean landscape.

### Visual language

- Abstract roof curves, eaves shadow, distant mountain planes, low mist, warm dust, and wind traces.
- One continuous space moves from outer courtyard toward the maru interior.
- Shapes are illustrative and atmospheric rather than a photorealistic game environment.
- Content remains DOM-based above the canvas.

### Motion

- Scroll moves a single camera rig slowly through one scene and changes lighting state.
- Pointer position produces small camera easing, not free camera control.
- Audio playback may gently increase warm light and particle breathing; it must not create a music visualizer across the page.
- No camera rotation greater than a few degrees and no motion that competes with reading.

### Performance policy

- The WebGL module is dynamically loaded only on the version 3 route.
- High-performance devices use the complete scene; constrained devices reduce pixel ratio, particle count, and post-processing.
- Mobile, reduced-motion, WebGL failure, and explicit low-performance states render a static layered image treatment.
- The page remains fully usable before and without canvas initialization.

### Implementation profile

- React Three Fiber and Three.js already present in the repository.
- Highest visual impact and highest QA cost.
- Treated as a technical experiment, not the default recommendation.

## Shared components and boundaries

### Background variant contract

A small union type identifies `default`, `maru-light`, `hanji-journal`, and `quiet-landscape`. The default value preserves current `/odii` behavior. Candidate routes pass one of the three experimental values.

### Atmospheric stage

One component chooses the renderer for the active variant and owns decorative layers only. It does not fetch data or own audio state. Version 3 may read a minimal `isPlaying` boolean for its optional light response.

### Section markers

Major sections expose semantic stage keys. A single observer/controller derives the dominant section and normalized page progress. Background renderers consume that state without querying arbitrary DOM structures.

### Hanji transition

A reusable transition component accepts edge style, direction, strength, and reduced-motion behavior. It is inserted only at the explicitly approved boundaries. It does not wrap every section.

### Route wrappers

Each comparison route contains only route metadata and its selected variant. Business logic remains in the shared Odii feature.

## Interaction and state flow

1. The route selects a background variant.
2. `OdiiAudioFeature` renders the same data-driven content for every route.
3. Section markers report visibility to a background scene controller.
4. The controller calculates active stage and normalized scroll progress.
5. The selected renderer maps that state to decorative visual properties.
6. Reduced-motion and capability checks override motion or renderer choice without altering content state.

No candidate writes its visual state to local storage. Existing bookmark and player persistence behavior remains unchanged.

## Accessibility

- All decorative backgrounds use `aria-hidden="true"` and `pointer-events: none`, except the version 3 canvas event surface when pointer parallax is enabled; that surface remains unfocusable and content stays above it.
- `prefers-reduced-motion: reduce` disables continuous parallax, camera travel, particle animation, and animated tears.
- Static torn edges remain visible as section separators when animation is reduced.
- Text contrast is measured against the effective layered background, not only the base color.
- No information is communicated only through background color, motion, or texture.

## Performance and reliability

- Version 1 and version 2 should not require WebGL.
- Version 3 is dynamically imported and must have a first-render static fallback.
- Expensive observers and animation frames stop when their stage is outside the relevant viewport range.
- Pointer updates are frame-coalesced and never set React state on every move.
- Texture assets are compressed and sized for their rendered use.
- Failure to load any decorative asset leaves a warm neutral background and functional content.
- Candidate route navigation and API behavior must work offline to the same degree as the existing Odii page after assets have been built locally; no runtime dependency on a new third-party service is introduced.

## Testing and review

### Automated checks

- Route tests verify all three candidate pages select the intended variant.
- Component tests verify the default variant preserves the current background path.
- Reduced-motion tests verify motion-heavy layers are disabled or replaced.
- Hanji transition tests verify it is used only at approved boundaries.
- Version 3 tests verify the fallback remains renderable when WebGL capability is absent.
- Existing Odii API tests remain unchanged and passing.
- Type checking, linting, focused Vitest tests, and the production build are required before completion.

### Visual checks

- Desktop widths: 1440 and 1920 pixels.
- Mobile widths: 390 and 430 pixels.
- Validate top, mid-page transition, full archive, active audio player, modal/drawer stacking, and footer.
- Compare motion at normal and reduced-motion settings.
- Confirm that content remains readable when the background is at its brightest and darkest states.

## Selection criteria

The candidates will be evaluated in this order:

1. Does it express Korean warmth and hospitality without relying on clichés?
2. Does Odii content remain easier to browse and hear than the background is to notice?
3. Does the page feel like one continuous place?
4. Does motion remain calm and reversible?
5. Is mobile and low-performance behavior credible?
6. Is the implementation cost justified by the improvement?

Version 1 is the recommended baseline, version 2 is the tactile identity experiment, and version 3 is the spatial technology experiment.

## Acceptance criteria

- All three routes render independently and preserve existing Odii functionality.
- `/odii` has no visual or behavioral regression.
- The three variants are clearly distinguishable by concept, not merely color.
- Torn paper is limited to the two approved semantic boundaries in version 2 and remains subtle if reused in version 1.
- No Western scrapbook motifs are present.
- Reduced-motion users receive a stable, non-animated composition.
- Version 3 works with and without WebGL.
- The repository builds successfully and focused tests pass.
