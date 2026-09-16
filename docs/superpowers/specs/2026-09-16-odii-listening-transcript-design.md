# Odii Listening Transcript Design

## Purpose

The expanded Odii player helps a visitor listen to a cultural commentary while
following its wording without losing their place. The audience is someone
viewing a heritage place on desktop or mobile; the screen's single job is to
make the spoken guide and the place feel present at the same time.

## Design Direction

The layout takes its cue from a field notebook rather than a generic media
dashboard: a place view sits beside a continuous, readable narration.

### Tokens

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#f8f8f7` | Expanded-player page surface |
| Reading well | `#f1f1ef` | Transcript scroll area |
| Rule | `#e5e5e3` | Dividers and inactive control boundaries |
| Ink | `#292927` | Active transcript and primary type |
| Secondary ink | `#6f706d` | Metadata and inactive transcript copy |
| Position marker | existing brand gold | Current-sentence rail and time marker only |

Typography uses the existing `--font-hanok` face for the place title and the
project's Korean body face for narration. Transcript body type increases to a
comfortable desktop reading size and scales down only at narrow mobile widths;
it never uses viewport-relative font sizing.

The signature interaction is a quiet reading cursor: the current sentence is
the visual anchor while the list moves beneath it. This replaces decorative
cards, gradients, and persistent status badges.

## Layout

Desktop uses a two-column grid. The left column holds the Roadview when
coordinates are available, otherwise the story image at the same fixed aspect
ratio. It then shows place metadata, up to seven content tags, seek controls,
and playback controls. The right column is a full-height transcript panel with
its own scroll container.

Mobile keeps the same information order: media, place metadata and tags,
controls, transcript. The transcript receives a bounded height so the visitor
can still scroll it independently from the player drawer.

The top-level "now playing" status badge and "view full transcript" button are
removed. The transcript is complete and directly available in the expanded
player.

## Transcript Behavior

- Each parsed script line is a keyboard-accessible seek target.
- Non-current lines render at `opacity: 0.6` (with readable contrast).
- The current line uses full opacity, stronger weight, an understated neutral
  fill, and a thin gold leading marker. Gold is never used as a surface fill.
- When active playback advances, the current line scrolls into the vertical
  center of the transcript panel using a short, reduced-motion-safe smooth
  transition. The line change itself crossfades and settles without layout
  shifts.
- A user-initiated scroll temporarily pauses automatic recentering, then it
  resumes on the next explicit seek or after a short idle period. Clicking a
  sentence seeks audio immediately and recenters it.
- With `prefers-reduced-motion`, the current sentence updates and is centered
  instantly; the interaction remains otherwise identical.

## Data and Component Boundaries

`LocalMiniPlayer` remains the orchestration container: it selects audio-store
state, calls the injected player action, and supplies story metadata. The
presentational transcript component receives only `lines`, `activeLineId`, and
`onSeek`. A small transcript-following hook owns DOM refs, user-scroll pause,
and the reduced-motion-aware centering behavior.

Story tags are normalized outside the presentational metadata component. The
component receives a stable, de-duplicated array limited to seven values so an
API response can later change shape without changing the UI component.

## Loading and Errors

The Roadview fallback preserves its loaded media aspect ratio. Missing script
lines hide the transcript panel rather than leave an empty box. If Roadview is
unavailable, the image fallback is shown in the identical media frame. Any
future transcript skeleton must reserve each line row's final height and use
neutral gray shimmer only.

## Verification

- Unit tests cover tag normalization and transcript-follow decisions,
  including current-line selection and user-scroll pause.
- Component tests verify all lines are rendered, inactive lines receive the
  60% state, the active line exposes the current marker, and selecting a line
  invokes its supplied seek callback.
- Run TypeScript, focused Vitest tests, lint, and production build.
- Inspect desktop and mobile screenshots for readable transcript sizing,
  non-overlapping tags, Roadview/image parity, and reduced-motion behavior.

## Self-review

- No placeholder requirements remain.
- Gold is scoped to existing active-playback semantics rather than default
  surface styling.
- The layout, component boundaries, and tests all refer to the same one-panel
  transcript model.
- The scope is limited to the expanded Odii player and its local data shaping.
