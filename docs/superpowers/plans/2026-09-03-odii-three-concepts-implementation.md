# Odii Three Design Concepts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three fully usable Odii page concepts that share production data and playback behavior, remove temporary study UI, preserve discovery controls and `오늘, 여기에서`, and replace the abstract sound map with a recognizable interactive South Korea map.

**Architecture:** Keep `OdiiAudioFeature` as the single data-loading and state-owning feature, adding an optional `conceptVariant` prop. Delegate only the visual differences to focused concept components: a hero, scene rail, regional sound map, and subtle section atmosphere. Route wrappers pass one of three validated concept IDs, so API calls, playback state, bookmarks, nearby stories, and archive behavior are never duplicated.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand, Vitest.

## Global Constraints

- Preserve the existing Odii API, playback state, bookmarks, category chips, region chips, and geolocation behavior.
- Keep `장면을 골라 듣다` topic hashtags, theme category chips, region chips, and `오늘, 여기에서`; improve their hierarchy without adding explanatory copy.
- Remove `SECTION 2 · UI STUDY`, `IMPROVEMENT`, `임시 테스트`, and the temporary comparison section from production output.
- Use only `#FAFAF8`, `#1D1D1F`, `#746F68`, `#F84E76`, `#FFB36B`, and `#40685A` as new concept-defining colors.
- Use `MaruBuri` only for restrained emotional display copy and the current Odii sans stack for headings, body, controls, captions, and data.
- Add no large UI or map dependency; use an inline SVG map and the existing Framer Motion dependency.
- Support keyboard focus, responsive layouts, and `prefers-reduced-motion`.

---

### Task 1: Define the concept model and preview routes

**Files:**
- Create: `src/features/odii-audio/concepts/odiiConcept.ts`
- Create: `src/features/odii-audio/concepts/odiiConcept.test.ts`
- Create: `src/app/odii/concepts/page.tsx`
- Create: `src/app/odii/concepts/[concept]/page.tsx`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`

**Interfaces:**
- Produces: `OdiiConcept = 'sori' | 'hanji' | 'studio'`
- Produces: `ODII_CONCEPTS`, `isOdiiConcept(value: string): value is OdiiConcept`, and `getOdiiConceptMeta(concept: OdiiConcept)`.
- Produces: `OdiiAudioFeatureProps.conceptVariant?: OdiiConcept`.

- [ ] **Step 1: Write the failing concept model test**

```ts
import { describe, expect, it } from 'vitest';
import { ODII_CONCEPTS, getOdiiConceptMeta, isOdiiConcept } from './odiiConcept';

describe('Odii concept model', () => {
  it('keeps the three approved concepts in comparison order', () => {
    expect(ODII_CONCEPTS).toEqual(['sori', 'hanji', 'studio']);
  });

  it('rejects unsupported route values', () => {
    expect(isOdiiConcept('sori')).toBe(true);
    expect(isOdiiConcept('unknown')).toBe(false);
  });

  it('uses user-facing Korean names without production labels', () => {
    expect(getOdiiConceptMeta('sori').title).toBe('소리로 듣는 한국');
    expect(getOdiiConceptMeta('hanji').title).toBe('디지털 한지 아카이브');
    expect(getOdiiConceptMeta('studio').title).toBe('프리미엄 오디오 스튜디오');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the module is missing**

Run: `npx vitest run src/features/odii-audio/concepts/odiiConcept.test.ts`

Expected: FAIL because `./odiiConcept` does not exist.

- [ ] **Step 3: Implement the model and thin App Router pages**

```ts
export const ODII_CONCEPTS = ['sori', 'hanji', 'studio'] as const;
export type OdiiConcept = (typeof ODII_CONCEPTS)[number];

export const ODII_CONCEPT_META = {
  sori: { title: '소리로 듣는 한국', note: '장소와 지도를 따라 듣는 온마루의 대표안' },
  hanji: { title: '디지털 한지 아카이브', note: '기록지가 펼쳐지는 듯한 조용한 편집안' },
  studio: { title: '프리미엄 오디오 스튜디오', note: '사진과 재생 경험에 집중한 현대적 청음안' },
} as const;

export const isOdiiConcept = (value: string): value is OdiiConcept =>
  ODII_CONCEPTS.includes(value as OdiiConcept);

export const getOdiiConceptMeta = (concept: OdiiConcept) => ODII_CONCEPT_META[concept];
```

The dynamic page must await `params`, call `notFound()` for unsupported values, and render `<OdiiAudioFeature conceptVariant={concept} />`. The index page must render three plain links to the preview routes without inserting a preview switcher into the production experience.

- [ ] **Step 4: Run the model test and type-check the route signatures**

Run: `npx vitest run src/features/odii-audio/concepts/odiiConcept.test.ts && npx tsc --noEmit`

Expected: 3 tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the concept model and routes**

```bash
git add src/features/odii-audio/concepts src/app/odii/concepts src/features/odii-audio/components/OdiiAudioFeature.tsx
git commit -m "feat(odii): add three concept preview routes"
```

### Task 2: Build the three restrained hero compositions

**Files:**
- Create: `src/features/odii-audio/concepts/OdiiConceptHero.tsx`
- Create: `src/features/odii-audio/concepts/OdiiConceptFrame.tsx`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `OdiiConcept` and the existing `OdiiStoryItem` shape.
- Produces: `<OdiiConceptHero concept story isPlaying onPlay />`.
- Produces: `<OdiiConceptFrame concept children />` with concept-scoped CSS custom properties.

- [ ] **Step 1: Add a failing source-level contract test**

Create `src/features/odii-audio/concepts/odiiConceptCopy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ODII_CONCEPT_COPY } from './odiiConceptCopy';

describe('Odii concept copy', () => {
  it('uses one thesis and no decorative English eyebrow per concept', () => {
    expect(ODII_CONCEPT_COPY.sori.thesis).toBe('한국의 마음은 소리로 남습니다');
    expect(Object.values(ODII_CONCEPT_COPY).every(({ eyebrow }) => eyebrow === undefined)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the copy test and confirm it fails**

Run: `npx vitest run src/features/odii-audio/concepts/odiiConceptCopy.test.ts`

Expected: FAIL because `odiiConceptCopy.ts` does not exist.

- [ ] **Step 3: Implement concept copy and hero variants**

Create `odiiConceptCopy.ts` with exactly one thesis and one supporting sentence per concept. Use these theses: `한국의 마음은 소리로 남습니다`, `한 장의 기록을 펼쳐 듣습니다`, and `장소의 결까지 선명하게 듣다`. Keep `한국관광공사 오디와 온마루` inside the supporting sentence, not as an eyebrow.

Build the variants with the same semantic order: one `h1`, one support paragraph, current story location/title, and one play/pause button. `sori` uses a split editorial layout, `hanji` uses an offset paper/photo composition, and `studio` uses a full-bleed image with a restrained dark control surface.

Add `.odii-concept--sori`, `.odii-concept--hanji`, and `.odii-concept--studio` custom properties in `globals.css`. Do not use global attribute selectors for these concept rules.

- [ ] **Step 4: Pass the copy test and run lint on concept files**

Run: `npx vitest run src/features/odii-audio/concepts/odiiConceptCopy.test.ts && npx eslint src/features/odii-audio/concepts src/features/odii-audio/components/OdiiAudioFeature.tsx`

Expected: test PASS and ESLint exits 0.

- [ ] **Step 5: Commit the hero compositions**

```bash
git add src/features/odii-audio/concepts src/features/odii-audio/components/OdiiAudioFeature.tsx src/app/globals.css
git commit -m "feat(odii): compose three concept heroes"
```

### Task 3: Refine section two into three center-weighted scene rails

**Files:**
- Create: `src/features/odii-audio/concepts/OdiiConceptSceneRail.tsx`
- Create: `src/features/odii-audio/concepts/sceneRailModel.ts`
- Create: `src/features/odii-audio/concepts/sceneRailModel.test.ts`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`

**Interfaces:**
- Consumes: `concept`, `stories`, and `storySets`.
- Produces: `getVisibleSceneIndices(length: number, activeIndex: number): { previous: number; active: number; next: number }`.
- Produces: `<OdiiConceptSceneRail concept stories storySets />`.

- [ ] **Step 1: Write the failing circular-index test**

```ts
import { describe, expect, it } from 'vitest';
import { getVisibleSceneIndices } from './sceneRailModel';

describe('scene rail model', () => {
  it('wraps previous and next indices around the active card', () => {
    expect(getVisibleSceneIndices(5, 0)).toEqual({ previous: 4, active: 0, next: 1 });
    expect(getVisibleSceneIndices(5, 4)).toEqual({ previous: 3, active: 4, next: 0 });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npx vitest run src/features/odii-audio/concepts/sceneRailModel.test.ts`

Expected: FAIL because `sceneRailModel.ts` does not exist.

- [ ] **Step 3: Implement the rail model and visual variants**

The rail must render exactly three spatial cards on desktop. The active card uses `scale: 1` and the side cards use `scale: 0.86`, making the active card about 16% larger. On mobile, show the active card plus clipped edges of adjacent cards. Preserve the existing topic hashtag row and theme/category controls immediately above the rail.

For `sori`, use a large photographic center card; for `hanji`, let the center card widen like an unfolded record; for `studio`, show a centered album surface and animate a five-bar waveform only when its story is playing. All motions must resolve to opacity-only or no transform under reduced motion.

- [ ] **Step 4: Run the model test, lint, and type-check**

Run: `npx vitest run src/features/odii-audio/concepts/sceneRailModel.test.ts && npx eslint src/features/odii-audio/concepts && npx tsc --noEmit`

Expected: tests PASS, lint exits 0, and TypeScript exits 0.

- [ ] **Step 5: Commit the scene rail**

```bash
git add src/features/odii-audio/concepts src/features/odii-audio/components/OdiiAudioFeature.tsx
git commit -m "feat(odii): refine featured scenes around a larger center card"
```

### Task 4: Replace the abstract blob with a truthful interactive Korea sound map

**Files:**
- Create: `src/features/odii-audio/concepts/koreaRegions.ts`
- Create: `src/features/odii-audio/concepts/koreaRegions.test.ts`
- Create: `src/features/odii-audio/concepts/OdiiKoreaSoundMap.tsx`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`

**Interfaces:**
- Produces: `KoreaRegion` with `id`, `label`, `shortLabel`, `path`, `labelX`, `labelY`, and `keywords`.
- Produces: `KOREA_REGIONS`, `matchStoriesToRegion(stories, region)`, and `<OdiiKoreaSoundMap concept stories />`.

- [ ] **Step 1: Write failing map data tests**

```ts
import { describe, expect, it } from 'vitest';
import { KOREA_REGIONS, matchStoriesToRegion } from './koreaRegions';

describe('Korea sound map data', () => {
  it('includes the full discovery region set and Jeju geometry', () => {
    expect(KOREA_REGIONS.map(({ id }) => id)).toEqual([
      'capital', 'gangwon', 'chungcheong', 'jeolla', 'gyeongsang', 'jeju',
    ]);
    expect(KOREA_REGIONS.find(({ id }) => id === 'jeju')?.path.length).toBeGreaterThan(10);
  });

  it('does not substitute unrelated stories for an empty region', () => {
    const region = KOREA_REGIONS.find(({ id }) => id === 'jeju')!;
    expect(matchStoriesToRegion([{ title: '서울 북촌', locationName: '서울' }] as never, region)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npx vitest run src/features/odii-audio/concepts/koreaRegions.test.ts`

Expected: FAIL because `koreaRegions.ts` does not exist.

- [ ] **Step 3: Implement province-group paths and the accessible interaction**

Create six adjoining, recognizable peninsula-region SVG paths plus a distinct Jeju path in a stable `viewBox`. Each path is a real button target using `role="button"`, `tabIndex={0}`, `aria-pressed`, Enter/Space handling, and visible focus styling. Keep synchronized text buttons below the map for reliable keyboard and small-screen selection.

Selecting a region updates only that region's real matches. Empty results render `이 지역의 오디 이야기는 준비 중입니다` and a category exploration action; never fall back to `stories.slice(0, 4)`. Render the selected region's lead story and a single play/pause control beside or below the map.

Use one concept-specific signature: an ondol-colored pulse for `sori`, a seal-like selected marker for `hanji`, and a playback-synchronized waveform for `studio`.

- [ ] **Step 4: Run map tests, lint, and type-check**

Run: `npx vitest run src/features/odii-audio/concepts/koreaRegions.test.ts && npx eslint src/features/odii-audio/concepts/OdiiKoreaSoundMap.tsx && npx tsc --noEmit`

Expected: tests PASS, lint exits 0, and TypeScript exits 0.

- [ ] **Step 5: Commit the Korea map**

```bash
git add src/features/odii-audio/concepts src/features/odii-audio/components/OdiiAudioFeature.tsx
git commit -m "feat(odii): add interactive Korea sound map"
```

### Task 5: Preserve discovery controls and add restrained section depth

**Files:**
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`
- Modify: `src/features/odii-audio/components/CategoryTagFilter.tsx`
- Modify: `src/features/odii-audio/components/OdiiEditorialRail.tsx`
- Modify: `src/features/odii-audio/components/StoryCarousel.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing category, search, nearby, and geolocation state.
- Produces: stable `data-odii-section` hooks for `themes`, `nearby`, and `archive`, scoped beneath the selected concept frame.

- [ ] **Step 1: Add an integration contract test for preserved copy and removed temporary UI**

Create `src/features/odii-audio/concepts/odiiConceptIntegration.test.ts` that reads `OdiiAudioFeature.tsx` and asserts it still contains `장면을 골라 듣다` and `오늘, 여기에서`, and no longer imports or renders `OdiiSection2Experiments`.

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../components/OdiiAudioFeature.tsx', import.meta.url), 'utf8');

describe('Odii concept integration', () => {
  it('preserves discovery anchors and removes the temporary study', () => {
    expect(source).toContain('장면을 골라 듣다');
    expect(source).toContain('오늘, 여기에서');
    expect(source).not.toContain('OdiiSection2Experiments');
  });
});
```

- [ ] **Step 2: Run the contract test and confirm it fails on the temporary import**

Run: `npx vitest run src/features/odii-audio/concepts/odiiConceptIntegration.test.ts`

Expected: FAIL because `OdiiSection2Experiments` is still imported and rendered.

- [ ] **Step 3: Remove temporary output and refine the retained controls**

Remove only the temporary experiment import/render from `OdiiAudioFeature`. Keep topic hashtags, theme chips, city chips, and the complete `오늘, 여기에서` location behavior.

Group category and city chips with their nearest content instead of stacking three unrelated rows. Use 40px minimum interactive height on compact screens, one-pixel quiet boundaries, visible focus rings, and concept variables for selected states.

Add restrained section depth through concept-scoped backgrounds: `sori` gets a diffuse white-to-ondol glow behind the nearby carousel, `hanji` gets a subtle paper-edge shadow without a full-page cream wash, and `studio` gets a soft photographic luminance field. Do not add new explanatory labels.

- [ ] **Step 4: Run the integration test and project checks**

Run: `npx vitest run src/features/odii-audio/concepts/odiiConceptIntegration.test.ts && npx eslint src/features/odii-audio/components/OdiiAudioFeature.tsx src/features/odii-audio/components/CategoryTagFilter.tsx src/features/odii-audio/components/OdiiEditorialRail.tsx src/features/odii-audio/components/StoryCarousel.tsx && npx tsc --noEmit`

Expected: test PASS, lint exits 0, and TypeScript exits 0.

- [ ] **Step 5: Commit the retained discovery experience**

```bash
git add src/features/odii-audio/components src/features/odii-audio/concepts src/app/globals.css
git commit -m "refactor(odii): simplify copy while preserving discovery controls"
```

### Task 6: Verify all routes and production readiness

**Files:**
- Modify: `docs/superpowers/plans/2026-09-03-odii-three-concepts-implementation.md` (checkboxes only)

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: verified concept routes and a clean handoff describing any visual QA limitation.

- [ ] **Step 1: Run every Odii unit and contract test**

Run: `npx vitest run src/app/odii/backgroundRoutes.test.tsx src/features/odii-audio/**/*.test.ts src/features/odii-audio/**/*.test.tsx`

Expected: all tests PASS with 0 failures.

- [ ] **Step 2: Run the full static checks**

Run: `npx tsc --noEmit && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 3: Build every App Router route**

Run: `npm run build`

Expected: Next.js exits 0 and lists `/odii/concepts`, `/odii/concepts/sori`, `/odii/concepts/hanji`, and `/odii/concepts/studio` or the equivalent dynamic route.

- [ ] **Step 4: Inspect the running pages at desktop and mobile widths**

Open all three concept URLs at 1440×1000 and 390×844. Verify no horizontal overflow, the active section-two card is visibly larger, category and city chips remain usable, `오늘, 여기에서` remains present, all Korea regions and Jeju are recognizable/selectable, focus indicators are visible, and reduced motion removes ambient transforms.

- [ ] **Step 5: Check the final diff and commit only verification bookkeeping if needed**

Run: `git status --short && git diff --check && git log --oneline -8`

Expected: no unintended generated files, no whitespace errors, and task commits present in order.
