# UI design guidance

## Color direction

- Do not introduce warm beige, cream, yellow, parchment, or sepia tones as a default surface treatment. They make the product feel overly themed and artificial.
- Prefer neutral gray surfaces for page canvases, cards, hover states, empty states, and loading placeholders. Use colors such as `#f8f8f7`, `#f5f5f4`, `#e5e5e3`, `#d9d9d7`, and `#cdcdca` as the starting palette.
- Preserve established semantic and interaction colors. Do not replace active, selected, warning, or brand colors merely to make a surface neutral.
- If a warm tone is genuinely required by existing brand or content imagery, keep it local to that component and do not spread it to surrounding surfaces.

## Loading states

- Skeletons must reserve the same thumbnail dimensions, title/subtitle positions, controls, and overall row/card height as the loaded UI. Loading must not cause content to shrink, grow, or jump.
- Use neutral gray skeleton colors and a restrained shimmer. Avoid warm/yellow skeleton fills.

## Scroll reveal transitions

- Apply the section reveal only to content the visitor has not yet seen in the current page session.
- On a page reload, sections at or above the current scroll position must render in their final state without a replayed shrink-to-grow animation.
- Once a section has been revealed, keep its final state while scrolling back upward; do not fold and replay it.
- Respect `prefers-reduced-motion` and keep unsupported animation paths functionally identical without motion.

## Shared agent workflow

- `AGENTS.md` is the shared source of truth for Codex, Claude, and Gemini. Read it before making changes; keep harness-specific entry files thin.
- Treat source files as canonical. Do not edit generated output unless the task explicitly requires it.
- Before claiming completion, committing, or releasing, run fresh verification appropriate to the touched code.
- Record resumable work in `handoff.md`, deferred follow-ups in `improvements.md`, and human-readable meaningful changes in `changelog.md`.
- Confirm exact targets before destructive operations. Do not delete, overwrite, or reset user work without explicit approval.

## Git Flow branch policy

- Integration branch: `develop`.
- Production branch: `main`.
- Work branches: `feature/*`, `feat/*`, `fix/*`, and `docs/*` merge into `develop` through a pull request.
- Release branches: `release/*` merge into `main` and back into `develop`.
- Emergency fixes: `hotfix/*` merge into `main` and back into `develop`.
- Direct pushes, force pushes, and unreviewed merges to `develop` or `main` are prohibited.
- Required CI checks must pass and the branch must be current before every merge. Shared changes require at least one approval.
- Create semantic version tags such as `v0.3.2` only from `main`.
- Delete short-lived branches after merge. Release automation must use least-privilege permissions and avoid workflow loops.
