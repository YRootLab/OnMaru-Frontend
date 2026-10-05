# Home Brand Aurora Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle, animated five-color brand aurora behind the home search hero that fades transparently before the recommendation feed.

**Architecture:** Create one presentation-only `HomeBrandAurora` component next to `JourneyHome`, composed of CSS-only decorative layers and no runtime state or network access. Mount it as an absolutely positioned, non-interactive sibling beneath the existing home content; use CSS masking for the transparent lower fade and a reduced-motion media query to stop animation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Emotion styled components, Vitest, Testing Library

## Global Constraints

- Use only the `juhong`, `hwanggeum`, `cheongrok`, `kobalt`, and `jaha` brand families as gradient colors; do not add neutral colors to the aurora gradients.
- Preserve all existing home copy, layout dimensions, search behavior, card styles, and data fetching.
- Keep motion subtle with independent 18-second and 24-second cycles.
- Fade the color layer itself to transparency before the recommendation feed; do not cover it with a white or gray gradient.
- Stop all aurora animation under `prefers-reduced-motion: reduce`.
- Keep the decorative layer hidden from assistive technology and pointer input.
- Do not add dependencies or modify global design tokens.

---

### Task 1: Build and test the presentation-only aurora

**Files:**
- Create: `src/features/journey-curator/components/HomeBrandAurora.tsx`
- Create: `src/features/journey-curator/components/HomeBrandAurora.test.tsx`

**Interfaces:**
- Consumes: `palette` from `@/design-system/tokens`
- Produces: default React component `HomeBrandAurora(): React.JSX.Element` with root marker `data-testid="home-brand-aurora"`

- [ ] **Step 1: Write the failing structural and CSS contract tests**

```tsx
// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HomeBrandAurora from './HomeBrandAurora';

afterEach(cleanup);

describe('HomeBrandAurora', () => {
  it('renders two decorative, non-interactive color layers', () => {
    render(<HomeBrandAurora />);

    const aurora = screen.getByTestId('home-brand-aurora');
    expect(aurora.getAttribute('aria-hidden')).toBe('true');
    expect(aurora.querySelectorAll('[data-aurora-layer]')).toHaveLength(2);
  });

  it('uses transparent masking and disables movement for reduced motion', () => {
    render(<HomeBrandAurora />);

    const css = document.head.textContent ?? '';
    expect(css).toContain('mask-image');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('animation:none');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the component is absent**

Run: `npm test -- src/features/journey-curator/components/HomeBrandAurora.test.tsx`

Expected: FAIL with module resolution error for `./HomeBrandAurora`.

- [ ] **Step 3: Implement the CSS-only aurora component**

Create a root `AuroraField` with `position: absolute`, `inset: 0 0 auto`, a hero-sized height, `pointer-events: none`, `overflow: hidden`, `contain: paint`, and a bottom mask equivalent to `linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)`. The mask controls alpha only; it is not a visible neutral color.

Create two child layers using the five required palette values in oversized radial gradients:

```tsx
const primaryGlow = `
  radial-gradient(ellipse 60% 55% at 12% 18%, ${palette.cheongrok[50]} 0%, transparent 72%),
  radial-gradient(ellipse 58% 60% at 82% 10%, ${palette.jaha[50]} 0%, transparent 72%),
  radial-gradient(ellipse 54% 48% at 50% 42%, ${palette.kobalt[50]} 0%, transparent 74%)
`;

const warmthGlow = `
  radial-gradient(ellipse 48% 42% at 36% 46%, ${palette.hwanggeum[50]} 0%, transparent 74%),
  radial-gradient(ellipse 46% 44% at 68% 48%, ${palette.juhong[50]} 0%, transparent 74%)
`;
```

Animate transforms and scale only, with separate 18s and 24s `ease-in-out infinite alternate` keyframes and maximum translation of 2%. In the dark-theme selector, use the same five families at low-opacity color-mix values over the existing page surface. Add `@media (prefers-reduced-motion: reduce) { animation: none; transform: none; }` for both layers.

Render:

```tsx
export default function HomeBrandAurora() {
  return (
    <AuroraField data-testid="home-brand-aurora" aria-hidden="true">
      <PrimaryLayer data-aurora-layer="primary" />
      <WarmthLayer data-aurora-layer="warmth" />
    </AuroraField>
  );
}
```

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `npm test -- src/features/journey-curator/components/HomeBrandAurora.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 5: Commit the isolated component**

```bash
git add src/features/journey-curator/components/HomeBrandAurora.tsx src/features/journey-curator/components/HomeBrandAurora.test.tsx
git commit -m "feat: add home brand aurora background"
```

---

### Task 2: Integrate the aurora without changing home layout

**Files:**
- Modify: `src/features/journey-curator/components/JourneyHome.tsx`
- Modify: `changelog.md`
- Modify: `handoff.md`

**Interfaces:**
- Consumes: default `HomeBrandAurora` component from `./HomeBrandAurora`
- Produces: unchanged `JourneyHome()` public interface with a decorative background below `Landing` and `JourneyDiscoveryFeed`

- [ ] **Step 1: Add the aurora beneath existing content**

Import `HomeBrandAurora` and place `<HomeBrandAurora />` immediately after `<JourneyAssemblyLoader />`. Keep the existing `Landing` and `ContentLayer` at `z-index: 1`; do not alter their spacing or dimensions. Retain `MainWrapper`'s existing light and dark background colors as the surface revealed by the transparent fade.

```tsx
<MainWrapper ref={mainRef}>
  <JourneyAssemblyLoader />
  <HomeBrandAurora />

  <Landing $centered={!hasSearched}>...</Landing>
  ...
</MainWrapper>
```

- [ ] **Step 2: Record the user-visible change and resumable state**

Add a concise dated entry to `changelog.md` describing the animated five-color home hero background, transparent feed transition, dark-theme treatment, and reduced-motion fallback. Update the existing 2026-10-06 `handoff.md` entry from design-only status to implementation and verification status without duplicating it.

- [ ] **Step 3: Run focused and static verification**

Run:

```bash
npm test -- src/features/journey-curator/components/HomeBrandAurora.test.tsx
npx tsc --noEmit
npx eslint src/features/journey-curator/components/HomeBrandAurora.tsx src/features/journey-curator/components/HomeBrandAurora.test.tsx src/features/journey-curator/components/JourneyHome.tsx
git diff --check
```

Expected: all commands exit 0 with no new warnings in touched files.

- [ ] **Step 4: Verify the rendered result at desktop and mobile widths**

Start `npm run dev`, open `/` at 1440×900 and 390×844, and capture light-theme screenshots. Confirm that all five color families are visible but subdued, title/search readability is unchanged, the background fades without a visible band before the recommendation feed, and no element position changes relative to the baseline. Repeat at least one desktop view in dark theme and emulate `prefers-reduced-motion: reduce` to confirm the layers remain static.

- [ ] **Step 5: Commit integration and documentation**

```bash
git add src/features/journey-curator/components/JourneyHome.tsx changelog.md handoff.md
git commit -m "feat: integrate brand aurora into home hero"
```

---

### Task 3: Final regression verification

**Files:**
- Verify only; no planned source changes

**Interfaces:**
- Consumes: completed Tasks 1 and 2
- Produces: fresh evidence that the branch is ready for user review

- [ ] **Step 1: Run the journey-curator component tests**

Run: `npm test -- src/features/journey-curator/components`

Expected: all discovered component tests PASS.

- [ ] **Step 2: Run a production build**

Run: `npm run build`

Expected: Next.js production build exits 0 and `/` is generated successfully.

- [ ] **Step 3: Review the final diff and branch status**

Run:

```bash
git diff develop...HEAD --stat
git status --short --branch
```

Expected: only the approved aurora component, its tests, `JourneyHome` integration, and work-log/design documents differ; the working tree is clean.

