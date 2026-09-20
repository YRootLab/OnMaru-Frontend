# Architecture

## Data flows in, not out

- A component that renders UI must not own `fetch()`/API calls inside its body. Data comes in from outside — as props from a parent (ideally a Server Component that fetched it), or as the return value of a dedicated hook.
- Prefer fetching in the page-level Server Component (`app/**/page.tsx`) and passing the result down as props. Reach for client-side fetching only when the data depends on client-only state a server render can't know in advance (a filter, a user action, a live poll).
- When client-side fetching is unavoidable, isolate it in a `features/<feature>/hooks/use<Thing>.ts` hook that owns the `fetch`/loading/error state and returns plain data (see `src/features/hanok-archive/hooks/*` for the existing shape: `{ data, loading }` or similar). The rendering component calls the hook and stays a pure function of its inputs — reusable and testable without a live network.
- Non-fetch business logic (mapping, decoding, classification) that more than one place needs belongs in `features/<feature>/services/*.ts`, not copy-pasted into a component.
- Refactors that only relocate data-fetching/logic into a hook or service must not change the rendered output, animation, or styling of the component they're extracted from — verify with a type-check and a visual diff before considering the extraction done.

# UI design guidance

## Color direction

- Do not introduce warm beige, cream, yellow, parchment, or sepia tones as a default surface treatment. They make the product feel overly themed and artificial.
- Prefer neutral gray surfaces for page canvases, cards, hover states, empty states, and loading placeholders. Use colors such as `#f8f8f7`, `#f5f5f4`, `#e5e5e3`, `#d9d9d7`, and `#cdcdca` as the starting palette.
- Preserve established semantic and interaction colors. Do not replace active, selected, warning, or brand colors merely to make a surface neutral.
- If a warm tone is genuinely required by existing brand or content imagery, keep it local to that component and do not spread it to surrounding surfaces.

## Typography hierarchy

- In all views and components, the **Main Title must always be placed at the very top**, and **Subtitles, descriptions, and secondary metadata must be placed below the title**. Do not place subtitles above main titles.

## Loading states

- Skeletons must reserve the exact final dimensions, thumbnail aspect ratios, title/subtitle lines, controls, padding, and overall card/container footprint as the fully-loaded UI. Skeletons must match the real response layout 1:1 so that content never shrinks, grows, shifts, or jumps (zero Layout Shift / CLS) when data arrives.
- Skeletons and live data components must share synchronized dimension tokens and container heights to prevent downstream layout shifts and scroll reveal triggers from misfiring.
- Use neutral gray skeleton colors and a restrained shimmer. Avoid warm/yellow skeleton fills.

## Scroll reveal transitions

- Apply the section reveal only to content the visitor has not yet seen in the current page session.
- On a page reload, sections at or above the current scroll position must render in their final state without a replayed shrink-to-grow animation.
- Once a section has been revealed, keep its final state while scrolling back upward; do not fold and replay it.
- Respect `prefers-reduced-motion` and keep unsupported animation paths functionally identical without motion.

## Shared agent workflow

- `AGENTS.md` is the shared source of truth for Codex, Claude, Gemini, Cline, and other agents. Read it before making changes; keep harness-specific entry files thin.
- Treat source files as canonical. Do not edit generated output unless the task explicitly requires it.
- Before claiming completion, committing, or releasing, run fresh verification appropriate to the touched code.
- Record resumable work in `handoff.md`, deferred follow-ups in `improvements.md`, and human-readable meaningful changes in `changelog.md`.
- Confirm exact targets before destructive operations. Do not delete, overwrite, or reset user work without explicit approval.

## Work tracking

- GitHub Issues are the Source of Truth for triaged, actionable work.
- Keep `project-roadmap.md` limited to long-term Vision and milestone-level goals.
- When the user raises an ad hoc request, record it immediately in `handoff.md` if it affects current-session continuity, or in `improvements.md` if it is an untriaged follow-up idea. Issue creation is not required at capture time.
- During triage, keep a local note, link it to an existing Issue, promote it to a new Issue, or remove it only when completion is verified.
- Immediately before creating a Pull Request, invoke `cleaning-work-logs` and reconcile the branch, work logs, related Issues, and PR description.
- Immediately before merge, invoke `cleaning-work-logs` again because PR and Issue state may have changed during review.
- Every PR must reference its related Issue. Use an auto-close keyword only when that PR's merge target should actually close the Issue.
- Before closing an Issue, verify its acceptance criteria and merge state.

## Git Flow branch policy

- Integration branch: `develop`.
- Production branch: `main`.
- Work branches: `feature/*`, `feat/*`, `fix/*`, and `docs/*` merge into `develop` through a pull request.
- Release branches: `release/*` merge into `main` and back into `develop`.
- Emergency fixes: `hotfix/*` merge into `main` and back into `develop`.
- Direct pushes, force pushes, and unreviewed merges to `develop` or `main` are prohibited.
- After finishing development work, agents must not create a PR or merge on their own — always get the user's final approval first.
- Required CI checks must pass and the branch must be current before every merge. Shared changes require at least one approval.
- Create semantic version tags such as `v0.3.2` only from `main`.
- Delete short-lived branches after merge. Release automation must use least-privilege permissions and avoid workflow loops.

## Private core UI submodule

- `src/private/core-ui` is a Git submodule pointing to the private `YRootLab/onmaru-core-ui` repository.
- After cloning the repository, always run `git submodule update --init --recursive`.
- Do not record private submodule access permissions or authentication tokens in source code, `.env.example`, logs, or documentation.
- When modifying files inside the private submodule, commit and push those changes in the submodule repository first, then commit the updated submodule pointer in the parent repository.
- Do not arbitrarily delete the parent repository's `.gitmodules` or `src/private/core-ui` gitlink, or convert the gitlink into a regular directory.
- Verify that the submodule is initialized before deploying to Vercel.
- Deploy applications using the private submodule through the Vercel CLI or CI configured with private submodule access.
- If Vercel Git integration cannot read the private submodule, use Vercel CLI deployment instead of automatic deployment.
- Core UI components are imported via `@/private/core-ui/*`.
- When starting work in a fresh workspace or after branch switches, verify that `src/private/core-ui` is populated. If empty or outdated, immediately run `git submodule update --init --recursive` (or `npm run submodule:init`).
