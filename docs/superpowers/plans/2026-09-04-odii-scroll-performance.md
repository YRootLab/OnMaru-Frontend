# ODII Scroll Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove non-visible ODII data, image, and scroll-animation work while preserving current behavior and visuals.

**Architecture:** Gate the editorial rail's category fetch on its viewport proximity and explicitly preload a category only on its tab interaction. Replace continuous scroll polling with observer/event-driven updates. Eliminate state whose rendered consumer no longer exists.

**Tech Stack:** Next.js 16, React 19, TypeScript, Framer Motion, Vitest.

## Global Constraints

- Do not modify map files, map behavior, ODII layout, UI copy, colors, or card geometry.
- Preserve current API error handling and selected-tab behavior.
- Do not add dependencies.

---

### Task 1: Test and model rail loading policy

**Files:**
- Modify: `src/features/odii-audio/components/odiiEditorialRailModel.ts`
- Test: `src/features/odii-audio/components/odiiEditorialRailModel.test.ts`

- [ ] Add a failing test proving a category is fetchable only after its rail is activated or the user explicitly interacts with its tab.
- [ ] Run `npm exec vitest run src/features/odii-audio/components/odiiEditorialRailModel.test.ts` and confirm the new assertion fails.
- [ ] Add a pure loading-policy helper and use it as the sole eligibility condition.
- [ ] Re-run the targeted test and confirm it passes.

### Task 2: Defer editorial rail work

**Files:**
- Modify: `src/features/odii-audio/components/OdiiEditorialRail.tsx`

- [ ] Use the Task 1 policy to gate the selected category fetch with IntersectionObserver viewport proximity.
- [ ] Delete all-category and all-image eager preloading; preserve selected and hovered/focused category fetches, cache reuse, cancellation, and API error behavior.
- [ ] Remove bulk `new Image()` warming; visible image elements remain responsible for decoding.
- [ ] Run the targeted rail-model test.

### Task 3: Remove dead requests and defer nearby-card work

**Files:**
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`
- Modify: `src/features/odii-audio/components/StoryCarousel.tsx`

- [ ] Delete state, loading state, and effects for unrendered section 4 and section 6 only.
- [ ] Change nearby card images to `loading="lazy"` and `decoding="async"`.
- [ ] Schedule the existing canvas color extraction through requestIdleCallback with a timeout fallback; retain fallback color and rendered color values.

### Task 4: Make scroll work event-driven

**Files:**
- Modify: `src/shared/components/animation/VesselReveal.tsx`
- Modify: `src/shared/components/Header/Header.tsx`

- [ ] Replace VesselReveal's scroll/resize geometry listener with IntersectionObserver thresholds that preserve the `exitThresholdRatio` boundary.
- [ ] Retain transform/opacity/border outputs but stop animating box-shadow and border-radius.
- [ ] Replace the header's unconditional rAF recursion with passive scroll + one pending rAF, retaining existing threshold calculations and initial state evaluation.

### Task 5: Verify

**Files:**
- Test: `src/features/odii-audio/components/odiiEditorialRailModel.test.ts`

- [ ] Run `npm exec vitest run src/features/odii-audio/components/odiiEditorialRailModel.test.ts src/features/odii-audio/api/odiiApi.test.ts`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Inspect `git diff --check` and the changed-path list to verify no map file or visual token was changed.
