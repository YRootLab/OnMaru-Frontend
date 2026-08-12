# Odii Interactive Background Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build four light, section-reactive Odii background comparison routes while leaving the production `/odii` experience and all Odii data/playback behavior unchanged.

**Architecture:** A pure scene model defines variants, stages, category modifiers, and approved tear boundaries. A client-side controller observes stable stage markers and exposes one active scene to a fixed decorative background renderer; four route wrappers select a renderer while the existing `OdiiAudioFeature` remains the single content implementation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Framer Motion 12, CSS Modules, inline SVG, Zustand, Vitest 4.

## Global Constraints

- `/odii` must preserve its current background behavior when `backgroundVariant` is omitted.
- Comparison routes are exactly `/odii/be-ver1`, `/odii/be-ver2`, `/odii/be-ver3`, and `/odii/be-ver4`.
- Background variants are exactly `default`, `warmth-grain`, `changho-breeze`, `hanji-journey`, and `onmaru-signature`.
- Stages are exactly `featured`, `themes`, `nearby`, `related`, `archive`, `collection`, and `closing`.
- No 3D hanok, WebGL, waveform, ripple, equalizer, dark scene, large saturated field, new npm package, or new runtime third-party service.
- Strong torn-hanji transitions are version 3 before `nearby` and `archive`, and version 4 before `archive` only.
- All decorative layers are `aria-hidden`, unfocusable, pointer-transparent, and non-semantic.
- Reduced motion disables drift, parallax, breathing, and animated tearing while preserving static section compositions.
- Existing Odii API, playback, bookmark, filter, modal, drawer, and content-order behavior remains unchanged.

---

## File structure

- `src/features/odii-audio/background/odiiBackground.types.ts` — stable variant, stage, category, observation, and scene types.
- `src/features/odii-audio/background/odiiBackgroundScenes.ts` — variant metadata, category mapping, tear boundaries, and scene resolution.
- `src/features/odii-audio/background/odiiBackgroundScenes.test.ts` — pure configuration and category tests.
- `src/features/odii-audio/background/odiiBackgroundController.ts` — pure dominant-stage selection and intersection snapshot types.
- `src/features/odii-audio/background/odiiBackgroundController.test.ts` — deterministic tie-breaking tests.
- `src/features/odii-audio/background/useOdiiBackgroundController.ts` — shared observer, pointer, visibility, and reduced-motion controller.
- `src/features/odii-audio/background/OdiiBackgroundStage.tsx` — fixed stage and version renderer selection.
- `src/features/odii-audio/background/OdiiBackgroundStage.module.css` — material, light, shadow, warmth, transition, and reduced-motion styling.
- `src/features/odii-audio/background/HanjiTearTransition.tsx` — approved decorative tear boundary.
- `src/features/odii-audio/components/OdiiAtmosphereBackground.tsx` — compatibility entry point for default and experimental renderers.
- `src/features/odii-audio/components/OdiiAudioFeature.tsx` — optional variant prop and stable stage markers.
- `src/app/odii/be-ver1/page.tsx` through `be-ver4/page.tsx` — thin comparison routes.
- `src/app/odii/backgroundRoutes.test.tsx` — route-to-variant contract tests.

---

### Task 1: Scene domain model and invariant tests

**Files:**
- Create: `src/features/odii-audio/background/odiiBackground.types.ts`
- Create: `src/features/odii-audio/background/odiiBackgroundScenes.ts`
- Create: `src/features/odii-audio/background/odiiBackgroundScenes.test.ts`

**Interfaces:**
- Produces `OdiiBackgroundVariant`, `OdiiBackgroundStage`, `OdiiBackgroundCategory`, `OdiiBackgroundScene`, `ODII_BACKGROUND_STAGES`, `resolveOdiiBackgroundCategory(category)`, `resolveOdiiBackgroundScene(variant, stage, category)`, and `getOdiiTearBoundaries(variant)`.
- Later tasks must import these names rather than repeat strings.

- [x] **Step 1: Write the failing scene tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  getOdiiTearBoundaries,
  resolveOdiiBackgroundCategory,
  resolveOdiiBackgroundScene,
} from './odiiBackgroundScenes';

describe('Odii background scene model', () => {
  it('maps Odii categories to restrained background modifiers', () => {
    expect(resolveOdiiBackgroundCategory('한옥')).toBe('hanok');
    expect(resolveOdiiBackgroundCategory('시장')).toBe('market');
    expect(resolveOdiiBackgroundCategory('마을')).toBe('village');
    expect(resolveOdiiBackgroundCategory('궁')).toBe('palace');
    expect(resolveOdiiBackgroundCategory('길')).toBe('nature');
    expect(resolveOdiiBackgroundCategory('서울')).toBe('default');
  });

  it('limits strong tear boundaries to the approved variants and stages', () => {
    expect(getOdiiTearBoundaries('warmth-grain')).toEqual([]);
    expect(getOdiiTearBoundaries('changho-breeze')).toEqual([]);
    expect(getOdiiTearBoundaries('hanji-journey')).toEqual(['nearby', 'archive']);
    expect(getOdiiTearBoundaries('onmaru-signature')).toEqual(['archive']);
  });

  it('resolves stable data attributes for every stage', () => {
    expect(resolveOdiiBackgroundScene('onmaru-signature', 'nearby', '시장')).toMatchObject({
      variant: 'onmaru-signature',
      stage: 'nearby',
      category: 'market',
      motif: 'leaf',
    });
    expect(resolveOdiiBackgroundScene('warmth-grain', 'archive', '전체').motionLevel).toBe('quiet');
  });
});
```

- [x] **Step 2: Run the scene test and verify RED**

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundScenes.test.ts`

Expected: FAIL because `odiiBackgroundScenes` does not exist.

- [x] **Step 3: Implement the model**

Create the exact unions and exported functions:

```ts
export type OdiiBackgroundVariant =
  | 'default'
  | 'warmth-grain'
  | 'changho-breeze'
  | 'hanji-journey'
  | 'onmaru-signature';

export type OdiiBackgroundStage =
  | 'featured'
  | 'themes'
  | 'nearby'
  | 'related'
  | 'archive'
  | 'collection'
  | 'closing';

export type OdiiBackgroundCategory =
  | 'default'
  | 'hanok'
  | 'market'
  | 'village'
  | 'palace'
  | 'nature';

export type OdiiBackgroundMotif = 'open' | 'paper' | 'leaf' | 'timber' | 'catalog' | 'seal';
export type OdiiBackgroundMotionLevel = 'quiet' | 'gentle';

export interface OdiiBackgroundScene {
  variant: OdiiBackgroundVariant;
  stage: OdiiBackgroundStage;
  category: OdiiBackgroundCategory;
  motif: OdiiBackgroundMotif;
  motionLevel: OdiiBackgroundMotionLevel;
}
```

`resolveOdiiBackgroundScene` uses a total `Record<OdiiBackgroundStage, ...>` so every stage has a motif and archive is always `quiet`. `resolveOdiiBackgroundCategory` maps only the five approved theme keywords; region chips resolve to `default`.

- [x] **Step 4: Run the scene test and verify GREEN**

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundScenes.test.ts`

Expected: 3 tests pass.

- [x] **Step 5: Commit Task 1**

```bash
git add src/features/odii-audio/background/odiiBackground.types.ts src/features/odii-audio/background/odiiBackgroundScenes.ts src/features/odii-audio/background/odiiBackgroundScenes.test.ts
git commit -m "feat: define Odii background scenes"
```

---

### Task 2: Deterministic section controller

**Files:**
- Create: `src/features/odii-audio/background/odiiBackgroundController.ts`
- Create: `src/features/odii-audio/background/odiiBackgroundController.test.ts`
- Create: `src/features/odii-audio/background/useOdiiBackgroundController.ts`

**Interfaces:**
- Consumes `OdiiBackgroundStage` and `ODII_BACKGROUND_STAGES` from Task 1.
- Produces `OdiiStageObservation`, `selectDominantOdiiStage(observations, currentStage)`, `resolveOdiiMotionState(...)`, and `useOdiiBackgroundController({ variant, selectedCategory, isPlaying })`.
- The hook returns `{ scene, motion, isDocumentVisible, pointerX, pointerY, scrollProgress }` where pointer values are Framer `MotionValue<number>` instances in the `-1..1` range and section-local `scrollProgress` is clamped to `0..1`.

- [x] **Step 1: Write the failing controller tests**

```ts
import { describe, expect, it } from 'vitest';
import { selectDominantOdiiStage } from './odiiBackgroundController';

describe('selectDominantOdiiStage', () => {
  it('selects the visible stage with the highest intersection ratio', () => {
    expect(selectDominantOdiiStage([
      { stage: 'themes', isIntersecting: true, intersectionRatio: 0.28, top: -120 },
      { stage: 'nearby', isIntersecting: true, intersectionRatio: 0.72, top: 260 },
    ], 'themes')).toBe('nearby');
  });

  it('breaks equal-ratio ties by proximity to the viewport focus line', () => {
    expect(selectDominantOdiiStage([
      { stage: 'related', isIntersecting: true, intersectionRatio: 0.5, top: -420 },
      { stage: 'archive', isIntersecting: true, intersectionRatio: 0.5, top: 80 },
    ], 'related')).toBe('archive');
  });

  it('keeps the current stage when no marker is visible', () => {
    expect(selectDominantOdiiStage([], 'collection')).toBe('collection');
  });

  it('turns every ambient animation off for reduced motion', () => {
    expect(resolveOdiiMotionState({
      isReducedMotion: true,
      isDocumentVisible: true,
      isPlaying: true,
    })).toEqual({ drift: false, parallax: false, breathing: false, animatedTear: false });
  });
});
```

- [x] **Step 2: Run the controller test and verify RED**

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundController.test.ts`

Expected: FAIL because the controller module does not exist.

- [x] **Step 3: Implement the pure selector**

Sort intersecting observations by descending `intersectionRatio`, then ascending `Math.abs(top - windowFocusTop)`. The pure selector receives `windowFocusTop = 0` as an optional third argument so tests do not read `window`.

- [x] **Step 4: Run the controller test and verify GREEN**

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundController.test.ts`

Expected: 3 tests pass.

- [x] **Step 5: Implement the hook without changing the pure selector**

The hook:

```ts
export interface UseOdiiBackgroundControllerOptions {
  variant: Exclude<OdiiBackgroundVariant, 'default'>;
  selectedCategory: string;
  isPlaying: boolean;
}
```

- Observes `[data-odii-stage]` elements once per mount with thresholds `[0, 0.2, 0.4, 0.6, 0.8]` and root margin `-18% 0px -38% 0px`.
- Maintains observations in a `Map<Element, OdiiStageObservation>` and derives the stage with `selectDominantOdiiStage`.
- Uses `useReducedMotion()`.
- Registers one passive pointer listener only when motion is allowed; clamps normalized pointer values and schedules one animation frame at a time.
- Registers one passive scroll listener that updates the active marker's normalized viewport progress through a frame-coalesced MotionValue rather than React state.
- Tracks `document.visibilityState` and returns a static scene while hidden.
- Resolves drift, parallax, playback breathing, and animated-tear permissions with the pure `resolveOdiiMotionState`; reduced motion or a hidden document disables all four.
- Resolves category and scene through Task 1 functions.

- [x] **Step 6: Run focused tests and type checking**

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundScenes.test.ts src/features/odii-audio/background/odiiBackgroundController.test.ts`

Run: `npx tsc --noEmit`

Expected: 6 tests pass and TypeScript exits 0.

- [x] **Step 7: Commit Task 2**

```bash
git add src/features/odii-audio/background/odiiBackgroundController.ts src/features/odii-audio/background/odiiBackgroundController.test.ts src/features/odii-audio/background/useOdiiBackgroundController.ts
git commit -m "feat: track Odii background sections"
```

---

### Task 3: Four visual renderers and hanji transition

**Files:**
- Create: `src/features/odii-audio/background/OdiiBackgroundStage.tsx`
- Create: `src/features/odii-audio/background/OdiiBackgroundStage.module.css`
- Create: `src/features/odii-audio/background/HanjiTearTransition.tsx`
- Modify: `src/features/odii-audio/components/OdiiAtmosphereBackground.tsx`
- Test: `src/features/odii-audio/background/odiiBackgroundScenes.test.ts`

**Interfaces:**
- Consumes Task 1 scene functions and Task 2 hook.
- Produces `<OdiiBackgroundStage variant selectedCategory isPlaying />`, `<HanjiTearTransition stage variant />`, and `<OdiiAtmosphereBackground variant selectedCategory isPlaying />`.

- [x] **Step 1: Extend the failing scene test with presentation assertions**

```ts
it('keeps the production default separate from experimental renderers', () => {
  expect(resolveOdiiBackgroundScene('default', 'featured', '전체').variant).toBe('default');
  expect(resolveOdiiBackgroundScene('onmaru-signature', 'closing', '한옥')).toMatchObject({
    stage: 'closing',
    category: 'hanok',
    motif: 'seal',
  });
});
```

Run the test and expect it to fail until the closing motif is configured as `seal`.

- [x] **Step 2: Implement shared fixed-stage markup**

`OdiiBackgroundStage` renders one fixed root with these non-semantic layers:

```tsx
<div
  aria-hidden="true"
  className={styles.stage}
  data-variant={scene.variant}
  data-stage={scene.stage}
  data-category={scene.category}
  data-motion={scene.motionLevel}
>
  <div className={styles.hanjiAir} />
  <motion.div className={styles.hospitalityLight} />
  <motion.div className={styles.thresholdShadow} />
  <motion.div className={styles.gardenShadow} />
  <div className={styles.warmthField}>{/* six fixed warmth points */}</div>
  <div className={styles.paperDepth} />
</div>
```

Use data-attribute selectors in the CSS Module to make every stage visually distinct for every variant. Version 1 emphasizes `hospitalityLight` and `warmthField`; version 2 emphasizes shadows; version 3 emphasizes `paperDepth`; version 4 balances all layers and reduces them in `archive`.

- [x] **Step 3: Implement brightness-safe CSS**

- Root background stays between `#fffefa`, `#fcfaf4`, and `#f8f4ec`.
- Shadow layer opacity stays at or below `0.12`.
- Pink decorative opacity stays at or below `0.09`.
- Warmth points use blurred radial gradients without connecting lines.
- Motion uses transforms and opacity only.
- `@media (prefers-reduced-motion: reduce)` removes all keyframe animation and transitions longer than `120ms`.

- [x] **Step 4: Implement the approved tear component**

`HanjiTearTransition` returns `null` unless `getOdiiTearBoundaries(variant).includes(stage)`. When present it renders a decorative, pointer-transparent edge with three layers: paper body, fiber fringe, and contact shadow. The irregular edge is an inline SVG mask with a deterministic path, not randomized geometry.

- [x] **Step 5: Preserve the default compatibility path**

`OdiiAtmosphereBackground` keeps the existing white radial-gradient markup when `variant` is missing or `default`. Experimental variants render `OdiiBackgroundStage`. This is the production regression boundary.

- [x] **Step 6: Run focused tests, type checking, and lint**

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundScenes.test.ts src/features/odii-audio/background/odiiBackgroundController.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint src/features/odii-audio/background src/features/odii-audio/components/OdiiAtmosphereBackground.tsx`

Expected: focused tests pass and both static checks exit 0.

- [x] **Step 7: Commit Task 3**

```bash
git add src/features/odii-audio/background src/features/odii-audio/components/OdiiAtmosphereBackground.tsx
git commit -m "feat: render Odii background variants"
```

---

### Task 4: Integrate stage markers and comparison routes

**Files:**
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`
- Create: `src/app/odii/be-ver1/page.tsx`
- Create: `src/app/odii/be-ver2/page.tsx`
- Create: `src/app/odii/be-ver3/page.tsx`
- Create: `src/app/odii/be-ver4/page.tsx`
- Create: `src/app/odii/backgroundRoutes.test.tsx`

**Interfaces:**
- Consumes `OdiiBackgroundVariant`, `OdiiAtmosphereBackground`, and `HanjiTearTransition`.
- Extends `OdiiAudioFeatureProps` with `backgroundVariant?: OdiiBackgroundVariant`.
- Produces four pages whose returned `OdiiAudioFeature` element has the exact experimental variant prop.

- [x] **Step 1: Write the failing route tests**

```tsx
import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import OdiiPage from './page';
import BeVer1Page from './be-ver1/page';
import BeVer2Page from './be-ver2/page';
import BeVer3Page from './be-ver3/page';
import BeVer4Page from './be-ver4/page';

type VariantElement = ReactElement<{ backgroundVariant?: string }>;

describe('Odii background comparison routes', () => {
  it('leaves the production Odii route on the compatibility background', () => {
    expect((OdiiPage() as VariantElement).props.backgroundVariant).toBeUndefined();
  });

  it.each([
    [BeVer1Page, 'warmth-grain'],
    [BeVer2Page, 'changho-breeze'],
    [BeVer3Page, 'hanji-journey'],
    [BeVer4Page, 'onmaru-signature'],
  ] as const)('passes the intended background variant', (Page, variant) => {
    expect((Page() as VariantElement).props.backgroundVariant).toBe(variant);
  });
});
```

- [x] **Step 2: Run the route test and verify RED**

Run: `npx vitest run src/app/odii/backgroundRoutes.test.tsx`

Expected: FAIL because the four pages do not exist.

- [x] **Step 3: Add the prop and background state inputs**

In `OdiiAudioFeature`, read `isPlaying` from the existing Zustand store and pass `backgroundVariant`, `selectedCategory`, and `isPlaying` to `OdiiAtmosphereBackground`. The default value is `default`.

- [x] **Step 4: Add stable stage markers and approved tear boundaries**

Add `data-odii-stage` to existing section-owning elements without changing copy or content ordering:

- header and hero: `featured`;
- editorial theme rail: `themes`;
- nearby section: `nearby`;
- compact continuation list: `related`;
- full archive: `archive`;
- card collection: `collection`;
- footer wrapper: `closing`.

Render `HanjiTearTransition` immediately before nearby and archive. Its own invariant suppresses unapproved variants and boundaries.

- [x] **Step 5: Create thin route wrappers**

Each page imports `OdiiAudioFeature`, exports concise Odii comparison metadata, and returns exactly one feature element with its variant. It contains no duplicated data or playback logic.

- [x] **Step 6: Run the route test and verify GREEN**

Run: `npx vitest run src/app/odii/backgroundRoutes.test.tsx`

Expected: the default compatibility case and 4 parameterized cases pass.

- [x] **Step 7: Run the complete focused suite and static checks**

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundScenes.test.ts src/features/odii-audio/background/odiiBackgroundController.test.ts src/app/odii/backgroundRoutes.test.tsx src/features/odii-audio/api/odiiApi.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint src/app/odii src/features/odii-audio/background src/features/odii-audio/components/OdiiAtmosphereBackground.tsx src/features/odii-audio/components/OdiiAudioFeature.tsx`

Expected: all tests pass and static checks exit 0.

- [x] **Step 8: Commit Task 4**

```bash
git add src/app/odii src/features/odii-audio/components/OdiiAudioFeature.tsx
git commit -m "feat: add Odii background preview routes"
```

---

### Task 5: Browser QA, regression checks, and delivery verification

**Files:**
- Modify only files with a reproducible visual or functional defect found during this task.
- Update: `docs/superpowers/checkpoints/2026-08-12-odii-background-variants.md`

**Interfaces:**
- Consumes the completed routes and existing local development server.
- Produces verified screenshots or visual observations at specified widths and a completed recovery record.

- [x] **Step 1: Run the production build before visual review**

Run: `npm run build`

Expected: Next.js production build exits 0 and lists `/odii` plus all four comparison routes.

- [x] **Step 2: Start or reuse the development server on port 3000**

Run: `npm run dev -- -p 3000`

Expected: server reports `Ready` and `http://localhost:3000`.

- [ ] **Step 3: Inspect desktop and mobile compositions** — deferred: no browser backend available

For `/odii`, `/odii/be-ver1`, `/odii/be-ver2`, `/odii/be-ver3`, and `/odii/be-ver4`, inspect at 1440x1000, 1920x1080, 390x844, and 430x932. Check every stage in both scroll directions, modal/drawer/player stacking, hanok and market modifiers, and archive tear boundaries.

- [ ] **Step 4: Inspect reduced motion** — automated logic/CSS verified; browser emulation deferred

Emulate `prefers-reduced-motion: reduce` and verify static section compositions remain distinct while drift, parallax, breathing, and animated tears stop.

- [x] **Step 5: Correct only observed defects and rerun covering checks**

For each defect, record route, viewport, stage, expected result, actual result, and covering check in the checkpoint before editing. Rerun the focused test or static command covering the changed file.

- [x] **Step 6: Run final verification from a clean state** — task-scoped suite, TypeScript, ESLint and webpack build pass; repository-wide legacy lint debt recorded

Run: `npx vitest run src/features/odii-audio/background/odiiBackgroundScenes.test.ts src/features/odii-audio/background/odiiBackgroundController.test.ts src/app/odii/backgroundRoutes.test.tsx src/features/odii-audio/api/odiiApi.test.ts`

Run: `npx tsc --noEmit`

Run: `npm run lint`

Run: `npm run build`

Expected: all commands exit 0.

- [x] **Step 7: Update recovery checkpoint and commit verification changes**

Record completed tasks, commit hashes, commands, results, routes, and any intentionally deferred visual observations in the checkpoint.

```bash
git add docs/superpowers/checkpoints/2026-08-12-odii-background-variants.md
git add src
git commit -m "test: verify Odii background previews"
```

If no source fix was necessary, commit only the checkpoint.
