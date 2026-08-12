# Odii Interactive Background Variants Design

## Objective

Create four comparison routes that change only the atmospheric background and section transitions of the existing Korea Tourism Organization Odii discovery and playback page:

- `/odii/be-ver1`
- `/odii/be-ver2`
- `/odii/be-ver3`
- `/odii/be-ver4`

The production `/odii` route remains unchanged until the team selects a candidate. Existing featured audio, theme curation, nearby audio, related stories, topic and location archives, playback, filters, bookmarks, modals, and drawers remain the foreground and retain their behavior.

## Product interpretation

The On-Maru PRD provides brand context, not a feature list for this page. The Odii background follows four principles:

- Korean warmth and hospitality are expressed through restraint, light, material, and continuity.
- Hanok references support audio stories rather than explain architecture.
- Odii data and audio remain more prominent than visual effects.
- The page feels calm, premium, and Korean without filling every area with traditional decoration.

## Explicit exclusions

- No 3D hanok tour, architectural disassembly, maru explanation, or camera journey through a building.
- No dark scene, night mode, dramatic sunset, or large saturated color field.
- No sound wave, equalizer, ripple, or waveform background.
- No imitation of Shopify's Renaissance artwork, game-like scale, or heavy 3D stack.
- No Western scrapbook language using tape, newspaper, loud stickers, dirty paper, burnt edges, or artificial aging.
- No changes to Odii data contracts, playback behavior, content ordering, or the production `/odii` route.

## Shared interaction model

The reusable lesson from Shopify Editions is structural:

> One fixed background stage remains mounted while scroll position and the active Odii section transform it into a sequence of related atmospheres.

The stage is not visually identical in every section. Each major section owns a scene state with distinct light position, material emphasis, decorative motif, motion density, and spatial balance. Crossing a boundary interpolates between scene states over 0.8-1.4 seconds instead of hard-swapping unrelated backgrounds.

### Section sequence

| Stage | Foreground role | Background mood |
| --- | --- | --- |
| `featured` | Featured and ranked stories | Broad, clean morning light; most open and welcoming |
| `themes` | Scene and theme curation | Hanji fiber becomes visible; gentle framed rhythm |
| `nearby` | Location-aware audio | Shadows open outward; airy garden light |
| `related` | Continue-listening lists | Warm timber reflection and gathered warmth points |
| `archive` | Search and full archive | Motion and texture recede into a legible white record space |
| `collection` | Short visual collection | Material detail returns lightly, modified by category |
| `closing` | Seasonal return invitation | Warm late-afternoon light without darkness or orange saturation |

### Category modifiers

Category selection changes one small motif, not the entire palette:

- Hanok and historic homes: faint changho rhythm and straight timber shadow.
- Traditional market: clustered warm specks suggesting people gathering.
- Village and alley: soft stone-and-earth texture at the edges.
- Palace and history: restrained roof-curve framing shadow.
- Nature and paths: brighter open-air shadow with sparse leaf movement.

### Interaction limits

- Stable section markers and `IntersectionObserver` select the dominant scene.
- Scroll progress moves light and material inside that scene.
- Pointer parallax is clamped to 4-6 CSS pixels and frame-coalesced.
- Foreground hit targets and text never move with the background.

## Brightness and color constraints

- Base backgrounds remain warm white or light hanji.
- No full-screen state becomes darker than pale beige or light warm gray.
- Timber, changho, leaf, and roof shadows remain low-opacity.
- On-Maru pink appears only in small seals, existing controls, or minute warmth accents.
- Other colors stay desaturated and occupy a small viewport area.
- Sections differ through composition, texture, light direction, and motion rather than large hue changes.

## Version 1 — 온기의 결

Route: `/odii/be-ver1`

A safe evolution of the existing white background using fine hanji grain, large soft light pools, and sparse warmth points.

- Featured: one broad light pool supports the hero.
- Themes: paper grain becomes clearer and warm light divides gently.
- Nearby: warmth points spread apart to suggest local discovery.
- Related: points gather into small groups without connecting lines.
- Archive: pools flatten and points nearly disappear.
- Collection: category modifiers alter only the edge texture.
- Closing: warmth settles near the central invitation.

This is the lowest-risk candidate and the most content-first, but it references hanok indirectly.

## Version 2 — 창호 사이의 바람

Route: `/odii/be-ver2`

A recognizable but restrained hanok atmosphere built from warm-white space, changho shadow, leaf shadow, and eaves-like framing. Breeze appears through slow shadow drift and fiber movement, never as a wave graphic.

- Featured: open morning light with almost no lattice.
- Themes: a partial changho shadow enters from one side.
- Nearby: lattice recedes while leaf shadow and open-air light increase.
- Related: warm timber reflection anchors the lower edge.
- Archive: shadows align and fade for search clarity.
- Collection: the selected category chooses one shadow motif.
- Closing: a long, soft changho shadow returns without darkening the page.

This candidate creates the clearest immediate hanok association and requires careful contrast QA.

## Version 3 — 한지로 이어진 여행

Route: `/odii/be-ver3`

A clean Korean editorial-record system using one persistent hanji surface with nearly white paper depths, small index tabs, restrained seals, record numbers, and faint location notation. Marks remain decorative and contain no extra copy.

Strong torn-hanji transitions appear only when entering the location-aware portion and the full archive. Each prepared tear has an irregular edge, a narrow light fiber fringe, and a shallow warm contact shadow. It reverses naturally when scrolling upward. Other boundaries use paper depth and position only.

- Featured: clean cover sheet and one small seal.
- Themes: offset index and slightly clearer fiber.
- Nearby: the first tear reveals an airy location record.
- Related: record slips overlap only near the edges.
- Archive: the second tear opens a quiet catalog sheet.
- Collection: a category-specific index marker appears without recoloring.
- Closing: the final sheet settles without dramatic folding.

This is the most distinctive editorial candidate and must remain restrained to avoid a scrapbook result.

## Version 4 — 소리가 머무는 온마루

Route: `/odii/be-ver4`

This is the recommended final candidate. It synthesizes the strongest parts of the analysis into one Odii-specific experience rather than displaying every decorative technique at once.

The page feels like listening at a bright, open threshold where place, memory, and people meet. Hanji provides air, sunlight communicates welcome, changho and leaf shadow establish hanok without illustration, and small warmth gatherings express jeong.

### Persistent layers

1. **Hanji air** — an almost imperceptible fiber base.
2. **Hospitality light** — broad warm light that shifts to create space around active content.
3. **Threshold shadow** — changho, leaf, or eaves-like shadow selected by section.
4. **Gathered warmth** — sparse soft points used only for location, people, and market contexts.
5. **Archive edge** — one restrained torn-hanji reveal at the full archive entrance.

All layers share one coordinate system and interpolate together. This provides Shopify-like continuity without Shopify's imagery, darkness, 3D weight, or dramatic camera movement.

### Section direction

- Featured: bright open threshold and one concentrated warmth behind the lead story.
- Themes: faint changho rhythm frames the chosen scene while fiber becomes clearer.
- Nearby: the frame opens and sparse leaf shadow drifts outward.
- Related: warmth points gather near the lower periphery, suggesting stories passing between people.
- Archive: one soft hanji edge reveals the catalog; texture and motion then reduce sharply.
- Collection: the selected category awakens one small motif while archive clarity remains.
- Closing: a warm late-afternoon beam settles near the CTA, ending with welcome rather than spectacle.

Playback does not create a visualizer. During playback, only the nearest warmth point and hospitality light may breathe within a very small opacity range at a slow interval. Pause and reduced-motion return them to a static state.

### Why version 4 is recommended

- It belongs to Odii's people-and-place stories rather than a generic hanok showcase.
- Each section is distinct while the page still feels like one place.
- Korean materials are present without decorative overload.
- It remains bright and compatible with a content-heavy service.
- It requires no WebGL or new dependency and degrades to a complete static background.

## Architecture

### Variant contract

`OdiiAudioFeature` receives an optional background variant. No variant preserves current `/odii` behavior. Four thin route wrappers select the experimental variants.

### Background controller

A focused controller owns active section, normalized scroll progress, selected category modifier, reduced-motion state, and an optional playback-active flag for version 4. It returns a declarative scene model and never fetches Odii data or mutates player state.

### Renderers

- Version 1: DOM and CSS gradient layers.
- Version 2: DOM and SVG shadow masks.
- Version 3: DOM and SVG/CSS paper masks.
- Version 4: composed DOM/SVG renderer reusing shared material, light, shadow, warmth, and edge primitives.

Framer Motion values and CSS custom properties interpolate state. No candidate requires WebGL or a new package.

### Section markers

Each existing major section receives a stable stage identifier without changing content or layout. The controller follows the most relevant visible marker with deterministic boundary tie-breaking to prevent flicker.

## Accessibility and fallback

- Backgrounds are decorative, `aria-hidden`, unfocusable, and pointer-transparent.
- Reduced-motion disables drift, parallax, breathing, and animated tearing while preserving static section compositions.
- No information is communicated only by background color, texture, or motion.
- A warm-white static background renders before client initialization and remains if animation setup fails.
- Observers disconnect on unmount; animation pauses while the document is hidden.
- Pointer input writes motion values or CSS properties, not React state on every event.
- No runtime dependency on a new third-party service is introduced.

## Verification

### Automated

- Route tests verify versions 1-4 select the intended variant.
- Default-route tests verify `/odii` preserves current background behavior.
- Controller tests cover section selection and deterministic boundary behavior.
- Category tests cover hanok and traditional-market modifiers.
- Reduced-motion tests verify parallax, drift, breathing, and animated tears are disabled.
- Transition tests verify strong tears appear only at approved boundaries.
- Existing Odii tests, type checking, linting, focused Vitest tests, and production build must pass.

### Visual

- Review at desktop widths 1440 and 1920 pixels and mobile widths 390 and 430 pixels.
- Inspect every stage transition in both scroll directions.
- Inspect hanok and traditional-market category modifiers.
- Inspect active playback, modal, saved drawer, and mini-player stacking.
- Compare normal and reduced-motion modes.
- Confirm no state becomes dark, saturated, or less readable.

## Acceptance criteria

- All four comparison routes render the same working Odii content with distinct background systems.
- `/odii` remains unchanged.
- Every major section has a distinct atmosphere in all candidates.
- Transitions remain continuous rather than unrelated swaps.
- All candidates stay close to the current light palette.
- No waveform or 3D-hanok treatment appears.
- Torn paper is limited, reversible, and materially plausible.
- Version 4 is the most cohesive expression of On-Maru warmth, hanok atmosphere, and Odii discovery.
- Reduced-motion and static fallback states remain complete.
- Focused tests and production build pass.
