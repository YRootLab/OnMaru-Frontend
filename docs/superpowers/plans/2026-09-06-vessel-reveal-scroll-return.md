# Vessel Reveal Scroll Return Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make unseen Odii sections bloom while scrolling down and fold as they leave through the lower reveal boundary while preventing reload-time shrink/bloom replay for the current and preceding sections.

**Architecture:** Keep geometry-to-state decisions in the existing pure `vesselRevealState.ts` module. `VesselReveal.tsx` owns only DOM measurement, the mount-local reload protection flag, and Motion rendering; a colocated README documents the contract.

**Tech Stack:** React 19, TypeScript, Framer Motion 12, IntersectionObserver, Vitest

## Global Constraints

- Do not change UI, colors, typography, layout, interaction flow, scale values, opacity values, duration, or easing.
- Initial hydration must render current and preceding sections in their final state without replaying reveal motion.
- `prefers-reduced-motion` must preserve states while using zero animation duration.
- Keep the implementation inside `src/shared/components/animation` except continuity documentation.

---

### Task 1: Reversible Vessel Reveal State

**Files:**
- Modify: `src/shared/components/animation/vesselRevealState.ts`
- Modify: `src/shared/components/animation/vesselRevealState.test.ts`
- Modify: `src/shared/components/animation/VesselReveal.tsx`
- Create: `src/shared/components/animation/README.md`
- Modify: `changelog.md`
- Modify: `handoff.md`

**Interfaces:**
- Consumes: observer geometry `{ currentStage, isInitialObservation, isReloadProtected, isIntersecting, top, revealBoundary }`.
- Produces: `resolveVesselRevealState(input): { stage: VesselRevealStage; isReloadProtected: boolean }`.

- [x] **Step 1: Write failing state-transition tests**

```ts
expect(resolveVesselRevealState({
  currentStage: 'bloomed', isInitialObservation: false,
  isReloadProtected: false, isIntersecting: false,
  top: 760, revealBoundary: 720,
})).toEqual({ stage: 'vessel', isReloadProtected: false });

expect(resolveVesselRevealState({
  currentStage: 'bloomed', isInitialObservation: false,
  isReloadProtected: true, isIntersecting: false,
  top: 760, revealBoundary: 720,
})).toEqual({ stage: 'bloomed', isReloadProtected: true });
```

- [x] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run src/shared/components/animation/vesselRevealState.test.ts`

Expected: FAIL because `resolveVesselRevealState` is not exported.

- [x] **Step 3: Implement the pure transition model**

```ts
export function resolveVesselRevealState(input: VesselRevealStateInput): VesselRevealStateResult {
  if (input.isInitialObservation) {
    const isReloadProtected = input.top < input.revealBoundary;
    return { stage: isReloadProtected ? 'bloomed' : 'vessel', isReloadProtected };
  }
  if (input.isReloadProtected) return { stage: 'bloomed', isReloadProtected: true };
  if (input.isIntersecting) return { stage: 'bloomed', isReloadProtected: false };
  if (input.top >= input.revealBoundary) return { stage: 'vessel', isReloadProtected: false };
  return { stage: input.currentStage, isReloadProtected: false };
}
```

- [x] **Step 4: Run the focused test and confirm GREEN**

Run: `npx vitest run src/shared/components/animation/vesselRevealState.test.ts`

Expected: all initial, downward reveal, upward fold, above-viewport preservation, and reload-protection cases pass.

- [x] **Step 5: Connect `VesselReveal` to the state module**

Initialize the render state as `{ stage: 'bloomed', shouldAnimate: false }`. In `useIsomorphicLayoutEffect`, synchronously measure `getBoundingClientRect().top`, resolve the initial state before observing, save `isReloadProtected` in a ref, and process later observer callbacks as non-initial transitions. Set `shouldAnimate` only when the stage changes and reduced motion is disabled.

- [x] **Step 6: Document the module contract**

Create `src/shared/components/animation/README.md` describing the three geometry cases, mount-local reload protection, `prefers-reduced-motion`, unchanged visual parameters, and guidance that API/data loading must not control reveal state.

- [x] **Step 7: Run full verification**

Run: `npx vitest run`

Run: `npx tsc --noEmit --pretty false`

Run: `npm run build`

Run: `npx eslint src/shared/components/animation/VesselReveal.tsx src/shared/components/animation/vesselRevealState.ts src/shared/components/animation/vesselRevealState.test.ts`

Expected: tests, typecheck, build, and targeted lint pass.

- [x] **Step 8: Record and commit the change**

Update `changelog.md` and `handoff.md` with the behavior and verification evidence.

```bash
git add src/shared/components/animation docs/superpowers changelog.md handoff.md
git commit -m "fix: restore reversible vessel reveals"
```
