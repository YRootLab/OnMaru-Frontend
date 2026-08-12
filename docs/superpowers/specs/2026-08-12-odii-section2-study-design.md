# Odii Section 2 UI Study Design

## Goal

Create an isolated comparison page for four polished alternatives to the existing Odii “장면을 골라 듣다” section. The study uses mock stories and must not change the existing `/odii` page, `OdiiEditorialRail`, its API requests, or its audio-store behavior.

## Route and isolation

- Add the comparison at `/odii/section2-ui-improvements`.
- Keep `/odii` visually and functionally unchanged.
- Do not import the study page into `OdiiAudioFeature`.
- Use local mock records only; the study must not call an API or depend on geolocation.
- Keep all study-specific UI under a dedicated `section2-study` component directory so it can be removed without touching production components.

## Temporary navigation entry

- Add a desktop-only `카드들` link immediately after `소리마루` in the shared header's center navigation.
- Link it directly to `/odii/section2-ui-improvements`.
- Keep mobile navigation unchanged.
- Isolate the temporary link in one commented JSX block so it can be removed without changing any surrounding navigation behavior.

## Page structure

The page begins with a compact study header explaining that the four sections contain the same stories and differ only in card treatment. Below it, all four complete section variants appear vertically in a single page. Each variant repeats the title “장면을 골라 듣다,” includes a short label explaining the tested change, and presents the same horizontal story set.

The page uses the existing Odii visual language: warm neutral surfaces, dark brown type, restrained pink accents, the project’s Odii font classes, and calm shadows. It does not introduce a separate visual theme.

## Four variants

### 01. 낮은 포스터

- Preserve the current vertical-poster composition.
- Reduce thumbnail and overall card height.
- Tighten internal spacing without making the title or duration difficult to scan.
- Use a moderate radius rather than the current near-square poster edge.

This is the conservative baseline and demonstrates how far spacing and height adjustments alone can improve the section.

### 02. 정보 오버레이

- Keep the thumbnail visually dominant.
- Move the title and secondary metadata into a translucent panel anchored near the bottom of the thumbnail.
- Keep the category badge at the thumbnail’s top edge.
- Use a unified rounded silhouette for the image and overlay panel.

This variant removes the separate lower card body and reduces total height while preserving strong imagery.

### 03. 분리형 캡션

- Apply the card surface, radius, and shadow to the thumbnail only.
- Place title, location, audio title, and duration beneath the thumbnail without an enclosing white card body.
- Increase the gap between stories slightly so the unboxed captions remain visually distinct.

This variant should feel lighter and more editorial while retaining the familiar vertical rail.

### 04. 가로형 카드

- Place the thumbnail on the left and story information on the right.
- Reduce the section’s vertical footprint and show fewer, wider cards at once.
- Preserve horizontal scrolling and a clear play affordance.
- On narrow screens, keep a readable horizontal card rather than collapsing into an unrelated vertical layout.

This is the strongest structural change, intended to test readability and compactness rather than poster emphasis.

## Shared content and interaction

- Provide at least five realistic mock stories containing title, audio title, category, location, duration, and local fallback image.
- Render the same ordered story set in every variant so visual differences are directly comparable.
- Each story is a semantic button or contains a semantic play button with a visible keyboard focus state.
- Clicking play toggles a local “재생 중” display for comparison purposes; it does not start audio or write to the production Zustand store.
- Use only a small hover lift and image scale on pointer devices, and disable those transitions when `prefers-reduced-motion` is enabled.

## Responsive behavior

- Desktop: constrain content to the existing Odii maximum width and show horizontal rails with intentionally clipped continuation cards.
- Tablet: reduce card widths and outer padding while preserving each variant’s defining structure.
- Mobile: keep every rail horizontally scrollable with touch-friendly controls and no page-level horizontal overflow.
- Text is clamped consistently so mock titles cannot create uneven card heights within a variant.

## Component boundaries

- The route component owns only page metadata and page assembly.
- A study shell owns the heading, shared mock state, and the vertical list of variants.
- Each variant is a separate focused component receiving the same story array and the locally selected story ID.
- Small shared primitives may handle the study label, image fallback, play indicator, and horizontal rail behavior. Variant-specific layout styles remain inside the corresponding component rather than being controlled by a large mode switch.

## Verification

- Confirm that `OdiiAudioFeature.tsx` and `OdiiEditorialRail.tsx` are unchanged.
- Run lint on all new study files.
- Run the production build to verify the new route and TypeScript boundaries.
- Inspect `/odii/section2-ui-improvements` at desktop and mobile widths for clipping, card-height consistency, keyboard focus, and horizontal overflow.
- Spot-check `/odii` to confirm its existing Section 2 is unchanged.

## Out of scope

- Selecting a winning design and replacing the production Section 2.
- Live API data, audio playback, bookmarks, geolocation, or production-store integration.
- Variants 05–07.
- Changes to sections other than the isolated study page.
