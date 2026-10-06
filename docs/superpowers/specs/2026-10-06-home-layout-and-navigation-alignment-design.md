# Home layout and navigation alignment design

## Goal

Remove duplicated personalization from the home hero, keep the popular-sound grid inside the shared 1140px content boundary, prevent the global footer from appearing prematurely during first-load data fetching, and align every desktop navigation icon and label on a shared vertical center without manual offsets.

## Scope

### Home hero copy

- Render `어떤 장소로 떠나고 싶으세요?` for both authenticated and anonymous visitors.
- Use `가고 싶은 지역이나 분위기를 알려주세요` as the search placeholder.
- Keep authentication state and profile personalization in the global navigation; do not fetch or derive additional data in the hero.

### Popular-sound grid containment

- Preserve the desktop three-column, tablet two-column, and mobile one-column layouts.
- Define grid tracks with `minmax(0, 1fr)` so long non-wrapping titles cannot enlarge a track beyond the 1140px feed container.
- Allow cards and their content wrappers to shrink with `min-width: 0`; preserve the existing single-line ellipsis.
- Apply the same track sizing to loading and loaded states so no layout shift is introduced.

### Initial loading footprint

- Home, Hanokmaru, and Sorimaru must reserve the footprint of their first meaningful content sections while initial data is loading.
- Prefer layout-matched skeletons already owned by each feature. Add synchronized minimum-height tokens only where the loading branch currently collapses.
- Do not hide the footer or use a full-screen blocking overlay. The footer remains in document flow below the reserved content.
- Loading and loaded layouts must share widths, card counts, responsive breakpoints, and meaningful section heights to avoid CLS.

### Navigation center alignment

- Treat each desktop navigation control as an Auto Layout row: icon, label, and optional chevron share one centerY axis.
- Remove child-level `translateY`, positional margins, or `top` adjustments used for vertical alignment.
- Use a reusable inline layout wrapper based on CSS grid or flex with `align-items: center`, a stable control height, and explicit icon boxes.
- Apply the same pattern to the central navigation items and authenticated/anonymous profile button.
- Preserve current typography, horizontal spacing, active states, hover behavior, button dimensions, route behavior, responsive visibility, and mobile navigation.

## Architecture and data flow

All changes remain in presentation code. Existing hooks continue to own client-side data state. No new API calls, business rules, or infrastructure dependencies are introduced.

Shared alignment primitives stay local to `Header.tsx` unless another consumer already exists. Loading footprint changes use feature-owned presentation components so Home, Hanokmaru, and Sorimaru do not become coupled.

## Accessibility and motion

- Preserve link and button semantics, accessible labels, focus behavior, and reduced-motion behavior.
- Decorative icons remain hidden from assistive technology where already appropriate.
- Skeletons are non-interactive and expose a loading state without replacing final content dimensions.

## Verification

- Add or update focused tests for hero copy, sound-grid containment, navigation alignment primitives, and loading footprints.
- Run the focused Vitest suites, TypeScript checking, and `git diff --check`.
- Verify desktop, tablet, and mobile layouts in light and dark themes.
- Compare initial-loading and loaded screenshots for Home, Hanokmaru, and Sorimaru, confirming that the footer does not jump into the initial viewport and that the navigation elements share the same centerY axis.

## Non-goals

- No navigation redesign, height change, typography change, or route behavior change.
- No data-fetching relocation or API contract change.
- No footer visibility toggle.
- No conversion of the popular-sound grid into a carousel.
