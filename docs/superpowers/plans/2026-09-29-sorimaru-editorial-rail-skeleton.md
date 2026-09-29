# Sorimaru Editorial Rail Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Sorimaru editorial rail footprint and current card positions stable while replacing only card media and content fields with neutral skeleton UI during initial loading and refresh.

**Architecture:** The page-level feature component derives a single loading boolean from the catalog hook and injects it into the presentational editorial rail. The rail reuses its existing virtual positions and card transform path, rendering a focused skeleton card when loading; when no stories exist yet it creates five placeholder positions solely for the loading view.

**Tech Stack:** Next.js App Router, React, Emotion styled components, Framer Motion, GSAP, Vitest, Testing Library.

## Global Constraints

- Skeleton dimensions must match the final card dimensions, image aspect/footprint, text lines, controls, padding, and container footprint.
- Use neutral gray skeleton surfaces and restrained shimmer; respect reduced motion.
- Rendering components must not own API calls; loading state comes from the existing hook/controller through props.
- Do not change existing card animation or styling outside the loading content substitution.

---

### Task 1: Add failing tests for loading layout

**Files:**
- Modify: `src/private/core-ui/sorimaru/SorimaruEditorialRail.test.tsx`
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx` (test-facing prop wiring only after the rail test)

**Interfaces:**
- Consumes: `SorimaruEditorialRail` props `{ stories, isLoading, onSelectStory }`.
- Produces: assertions for five loading cards, `aria-busy`, and stable loading-to-content rendering.

- [ ] **Step 1: Add a test that renders the rail with no stories and `isLoading` and asserts five skeleton cards plus `aria-busy="true"`.**
- [ ] **Step 2: Add a test that renders existing stories with `isLoading` and asserts the same five virtual card positions remain while content text is absent.**
- [ ] **Step 3: Run `npx vitest run src/private/core-ui/sorimaru/SorimaruEditorialRail.test.tsx` and confirm the new assertions fail before implementation.**

### Task 2: Implement stable-position skeleton rendering

**Files:**
- Modify: `src/private/core-ui/sorimaru/SorimaruEditorialRail.tsx`

**Interfaces:**
- Consumes: `isLoading` from the parent.
- Produces: internal `EditorialRailSkeletonCard`, loading placeholder positions, and the existing card track rendered during loading.

- [ ] **Step 1: Add shared skeleton styled blocks with the same card and panel geometry as `CardMotionButton` and `CardBottomPanel`.**
- [ ] **Step 2: Add an `EditorialRailSkeletonCard` that preserves the outer motion card props and replaces image/content with skeleton blocks, including the active-card duration slot.**
- [ ] **Step 3: Derive `showSkeleton = isLoading` and use five active-position-based placeholder entries only when `featured` is empty.**
- [ ] **Step 4: Keep the track mounted during loading, render skeleton cards from either existing visible positions or placeholder positions, and disable the card interaction callback while loading.**
- [ ] **Step 5: Pause the interval-driven auto-scroll while loading without resetting `activePosition`; restore it when loading ends.**
- [ ] **Step 6: Add reduced-motion CSS for the shimmer animation and preserve the existing `aria-busy` behavior.**
- [ ] **Step 7: Run the focused rail test and confirm all assertions pass.**

### Task 3: Wire feature loading state and verify

**Files:**
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`

**Interfaces:**
- Consumes: `initialLoading` and `catalog.status` returned by `useSorimaruCatalog`.
- Produces: `isLoading={initialLoading || catalog.status === 'loading'}` on `SorimaruEditorialRail`.

- [ ] **Step 1: Pass the derived loading state into `SorimaruEditorialRail` without moving any fetch logic into the rail.**
- [ ] **Step 2: Run `npx vitest run src/private/core-ui/sorimaru/SorimaruEditorialRail.test.tsx src/features/sorimaru-audio/hooks/useSorimaruCatalog.test.ts`.**
- [ ] **Step 3: Run `npx tsc --noEmit` and `npm run lint -- --quiet`.**
- [ ] **Step 4: Review the diff to confirm no generated files or unrelated styling changed.**
