# Theme Mode Picker Design

## Context

The app already supports three theme preferences: `light`, `dark`, and `system`.
After the time-aware theme update, `system` now means automatic local time mode:
07:00-18:59 resolves to light, and 19:00-06:59 resolves to dark.

The current top navigation button cycles modes with a single click. This makes it
hard for users to understand which mode is active, especially when a previously
saved `dark` preference keeps the UI dark during the morning.

## Goals

- Keep the existing header shape, spacing, and light header styling intact.
- Let both logged-in and logged-out users explicitly choose `auto`, `light`, or
  `dark` from the top navigation.
- Use clearer user-facing labels: `자동`, `라이트`, `다크`.
- Preserve the internal `system` preference value for compatibility.
- Make automatic mode learnable by showing that it follows local time and by
  displaying the currently applied light/dark result.
- Keep My Page's existing theme section, but align its label from `시스템` to
  `자동`.

## Interaction

The header theme control remains a compact icon button. Clicking it opens a small
popover anchored to the button. The popover contains three radio-style choices:

- `자동`: follows local time, with helper text showing the current applied mode.
- `라이트`: always uses the light theme.
- `다크`: always uses the dark theme.

In automatic mode, the top button uses the currently applied visual icon:
`Sun` when automatic mode resolves to light, `Moon` when it resolves to dark.
The tooltip and accessible label include `자동 · 현재 라이트/다크` so the behavior
is understandable without adding persistent text to the header.

## Component Boundary

- Reuse `useOnmaruTheme()` as the source of truth.
- Add small pure helpers for user-facing labels so preference display can be
  tested without rendering the whole header.
- Keep popover state local to `Header`.
- Do not modify page canvas colors, nav layout, or existing light header styles.

## Verification

- Unit test theme label helpers.
- Run TypeScript, unit tests, env contract check, and production build.
