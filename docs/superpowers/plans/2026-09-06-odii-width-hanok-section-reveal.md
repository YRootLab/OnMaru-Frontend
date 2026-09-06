# Odii Width And Hanok Section Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Odii scene rail to one content boundary and apply the existing section reveal behavior to every major Hanok archive section.

**Architecture:** Keep layout ownership in the existing page containers. Add source-contract helpers only for testable structural invariants, reuse `VesselReveal` without changing its state machine or motion parameters, and leave child section data and interaction logic untouched.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Emotion, Framer Motion, Vitest.

## Global Constraints

- Preserve UI colors, typography, content order, child animations, and interactions.
- Keep the Odii maximum content width at `max-w-6xl`.
- Reuse the existing `VesselReveal` defaults without introducing Hanok-specific observer or motion state.
- Keep reload/current-viewport protection and reduced-motion behavior unchanged.
- Do not couple the Hanok Kakao lazy mount or API refresh to reveal state.

---

### Task 1: Align The Odii Scene Section

**Files:**
- Create: `src/features/odii-audio/components/odiiSectionLayout.ts`
- Create: `src/features/odii-audio/components/odiiSectionLayout.test.ts`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx:313-331`
- Inspect: `src/features/odii-audio/components/OdiiEditorialRail.tsx:459-469`

**Interfaces:**
- Produces: `ODII_SECTION_CONTENT_CLASS`, the canonical `mx-auto w-full max-w-6xl` class contract.
- Consumes: Existing `OdiiEditorialRail` props and carousel behavior unchanged.

- [x] **Step 1: Write the failing layout contract test**

```ts
import { describe, expect, it } from 'vitest';
import { ODII_SECTION_CONTENT_CLASS } from './odiiSectionLayout';

describe('ODII_SECTION_CONTENT_CLASS', () => {
  it('keeps Odii sections on the shared six-column maximum width', () => {
    expect(ODII_SECTION_CONTENT_CLASS).toBe('mx-auto w-full max-w-6xl');
  });
});
```

- [x] **Step 2: Run test and verify RED**

Run: `npx vitest run src/features/odii-audio/components/odiiSectionLayout.test.ts`

Expected: FAIL because `odiiSectionLayout` does not exist.

- [x] **Step 3: Add the shared class contract and one scene wrapper**

```ts
export const ODII_SECTION_CONTENT_CLASS = 'mx-auto w-full max-w-6xl';
```

Use one wrapper in `OdiiAudioFeature` around the scene title and rail. Keep `OdiiEditorialRail`'s matching internal maximum-width guard for safe standalone reuse. Keep its `overflow-hidden`, height, and animation calculations unchanged.

- [x] **Step 4: Run focused tests and lint**

Run: `npx vitest run src/features/odii-audio/components/odiiSectionLayout.test.ts src/features/odii-audio/components/odiiEditorialRailModel.test.ts`

Run: `npx eslint src/features/odii-audio/components/OdiiAudioFeature.tsx src/features/odii-audio/components/OdiiEditorialRail.tsx src/features/odii-audio/components/odiiSectionLayout.ts src/features/odii-audio/components/odiiSectionLayout.test.ts`

Expected: PASS with no errors.

### Task 2: Add Hanok Section Reveal Boundaries

**Files:**
- Create: `src/hanok/hanokSectionReveal.ts`
- Create: `src/hanok/hanokSectionReveal.test.ts`
- Modify: `src/hanok/HanokArchive.tsx:1-160`
- Modify: `src/hanok/README.md`
- Modify: `changelog.md`
- Modify: `handoff.md`

**Interfaces:**
- Produces: `HANOK_REVEAL_SECTION_IDS`, a stable ordered list for the six reveal boundaries.
- Consumes: Existing `VesselReveal` component with default props.

- [x] **Step 1: Write the failing reveal boundary test**

```ts
import { describe, expect, it } from 'vitest';
import { HANOK_REVEAL_SECTION_IDS } from './hanokSectionReveal';

describe('HANOK_REVEAL_SECTION_IDS', () => {
  it('defines one stable boundary for each major archive section', () => {
    expect(HANOK_REVEAL_SECTION_IDS).toEqual([
      'hanok-intro',
      'hanok-monthly',
      'hanok-grid',
      'hanok-stay',
      'hanok-map',
      'hanok-manifesto',
    ]);
  });
});
```

- [x] **Step 2: Run test and verify RED**

Run: `npx vitest run src/hanok/hanokSectionReveal.test.ts`

Expected: FAIL because `hanokSectionReveal` does not exist.

- [x] **Step 3: Add IDs and wrap the six sections**

```ts
export const HANOK_REVEAL_SECTION_IDS = [
  'hanok-intro',
  'hanok-monthly',
  'hanok-grid',
  'hanok-stay',
  'hanok-map',
  'hanok-manifesto',
] as const;
```

Import `VesselReveal` into `HanokArchive` and wrap each designed unit with its corresponding ID. Keep `EditorialSection`, `ArchiveGroup`, and `ArchiveSection` spacing wrappers in place, and keep `VillageDetailModal` outside all reveal wrappers.

- [x] **Step 4: Document ownership and run focused tests**

Document that Hanok delegates reveal lifecycle to the shared animation module and must not add local observers.

Run: `npx vitest run src/hanok/hanokSectionReveal.test.ts src/shared/components/animation/vesselRevealState.test.ts`

Expected: PASS.

- [x] **Step 5: Run full verification**

Run: `npx vitest run`

Run: `npx tsc --noEmit --pretty false`

Run: `npx eslint src/features/odii-audio/components/OdiiAudioFeature.tsx src/features/odii-audio/components/OdiiEditorialRail.tsx src/features/odii-audio/components/odiiSectionLayout.ts src/features/odii-audio/components/odiiSectionLayout.test.ts src/hanok/HanokArchive.tsx src/hanok/hanokSectionReveal.ts src/hanok/hanokSectionReveal.test.ts`

Run: `npm run build`

Expected: all commands exit 0. Restart `npm run dev` and verify `/odii` and `/hanok` return HTTP 200.
