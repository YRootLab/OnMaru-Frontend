# Odii Section 2 UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/odii/section2-ui-improvements` as an isolated, mock-data comparison page containing four polished alternatives to the existing “장면을 골라 듣다” section.

**Architecture:** A server route supplies metadata and renders one client-side study shell. Study-only mock data, shared visual primitives, and four focused variant components live together under `src/features/odii-audio/section2-study`; local selection state demonstrates play feedback without importing the production audio store or changing the existing Section 2.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 3, Framer Motion, Vitest 4.

## Global Constraints

- The public route is exactly `/odii/section2-ui-improvements`.
- Keep `/odii`, `OdiiAudioFeature.tsx`, and `OdiiEditorialRail.tsx` visually and functionally unchanged.
- Use local mock records only; do not call Odii APIs, geolocation, or the production Zustand audio store.
- Render the same ordered five-story set in every variant.
- Implement only variants 01–04; variants 05–07 are out of scope.
- Preserve the existing Odii palette, typography classes, maximum width, and calm motion language.
- Every rail must remain horizontally scrollable on mobile without page-level horizontal overflow.
- Every interactive story control needs a visible keyboard focus state and must respect `prefers-reduced-motion`.

---

## File Structure

- `src/app/odii/section2-ui-improvements/page.tsx` — route metadata and study-shell assembly only.
- `src/features/odii-audio/section2-study/studyData.ts` — study story type, five local mock stories, variant metadata, and pure playback-label helper.
- `src/features/odii-audio/section2-study/studyData.test.ts` — contract tests for mock completeness, ordering, variants, and local playback labels.
- `src/features/odii-audio/section2-study/StudyPrimitives.tsx` — shared section heading, horizontal rail, image fallback, play indicator, and story metadata primitives.
- `src/features/odii-audio/section2-study/CompactPosterVariant.tsx` — variant 01 only.
- `src/features/odii-audio/section2-study/OverlayInfoVariant.tsx` — variant 02 only.
- `src/features/odii-audio/section2-study/EditorialCaptionVariant.tsx` — variant 03 only.
- `src/features/odii-audio/section2-study/LandscapeCardVariant.tsx` — variant 04 only.
- `src/features/odii-audio/section2-study/Section2UiImprovements.tsx` — page header, local selected-story state, and vertical composition of the four variants.

### Task 1: Study data contract and local playback state

**Files:**
- Create: `src/features/odii-audio/section2-study/studyData.test.ts`
- Create: `src/features/odii-audio/section2-study/studyData.ts`

**Interfaces:**
- Produces: `Section2StudyStory`, `SECTION2_STUDY_STORIES`, `SECTION2_STUDY_VARIANTS`, and `getStudyPlaybackLabel(selectedStoryId, storyId)`.
- Consumes: no production API or store modules.

- [ ] **Step 1: Write the failing data contract tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  SECTION2_STUDY_STORIES,
  SECTION2_STUDY_VARIANTS,
  getStudyPlaybackLabel,
} from './studyData';

describe('section2 UI study data', () => {
  it('provides five complete, uniquely keyed stories', () => {
    expect(SECTION2_STUDY_STORIES).toHaveLength(5);
    expect(new Set(SECTION2_STUDY_STORIES.map((story) => story.id)).size).toBe(5);
    for (const story of SECTION2_STUDY_STORIES) {
      expect(story).toEqual(expect.objectContaining({
        title: expect.any(String),
        audioTitle: expect.any(String),
        category: expect.any(String),
        location: expect.any(String),
        duration: expect.stringMatching(/^\d{1,2}:\d{2}$/),
        imageSrc: expect.stringMatching(/^\/images\//),
      }));
    }
  });

  it('defines exactly the four approved variants in order', () => {
    expect(SECTION2_STUDY_VARIANTS.map((variant) => variant.id)).toEqual([
      'compact-poster', 'overlay-info', 'editorial-caption', 'landscape-card',
    ]);
  });

  it('derives local play labels without audio state', () => {
    expect(getStudyPlaybackLabel(null, 'story-1')).toBe('재생');
    expect(getStudyPlaybackLabel('story-1', 'story-1')).toBe('재생 중');
    expect(getStudyPlaybackLabel('story-2', 'story-1')).toBe('재생');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run src/features/odii-audio/section2-study/studyData.test.ts`

Expected: FAIL because `./studyData` does not exist.

- [ ] **Step 3: Implement the typed mock data and helper**

```ts
export interface Section2StudyStory {
  id: string;
  title: string;
  audioTitle: string;
  category: string;
  location: string;
  duration: string;
  imageSrc: string;
}

export const SECTION2_STUDY_VARIANTS = [
  { id: 'compact-poster', number: '01', title: '낮은 포스터', description: '높이와 내부 간격을 줄인 기본 개선안' },
  { id: 'overlay-info', number: '02', title: '정보 오버레이', description: '정보 패널을 썸네일 안으로 올린 구성' },
  { id: 'editorial-caption', number: '03', title: '분리형 캡션', description: '이미지와 캡션의 프레임을 분리한 구성' },
  { id: 'landscape-card', number: '04', title: '가로형 카드', description: '이미지와 정보를 좌우로 배치한 구성' },
] as const;

export function getStudyPlaybackLabel(selectedStoryId: string | null, storyId: string) {
  return selectedStoryId === storyId ? '재생 중' : '재생';
}
```

Add five local-image stories using existing `/images/hanok/*.png` assets and the fields required by `Section2StudyStory`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npx vitest run src/features/odii-audio/section2-study/studyData.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the data contract**

```bash
git add src/features/odii-audio/section2-study/studyData.ts src/features/odii-audio/section2-study/studyData.test.ts
git commit -m "test(odii): define section2 study data contract"
```

### Task 2: Shared study primitives and first two variants

**Files:**
- Create: `src/features/odii-audio/section2-study/StudyPrimitives.tsx`
- Create: `src/features/odii-audio/section2-study/CompactPosterVariant.tsx`
- Create: `src/features/odii-audio/section2-study/OverlayInfoVariant.tsx`

**Interfaces:**
- Consumes: `Section2StudyStory` and `getStudyPlaybackLabel` from `studyData.ts`.
- Produces: `StudyVariantProps`, `StudySectionFrame`, `StudyRail`, `StudyImage`, `StudyPlayControl`, `CompactPosterVariant`, and `OverlayInfoVariant`.

- [ ] **Step 1: Define shared component contracts**

```tsx
export interface StudyVariantProps {
  stories: Section2StudyStory[];
  selectedStoryId: string | null;
  onSelectStory: (storyId: string) => void;
}

export function StudySectionFrame(props: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) { /* semantic section and heading */ }

export function StudyRail({ children }: { children: React.ReactNode }) {
  return <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">...</div>;
}
```

Implement `StudyImage` with an existing local fallback asset, and `StudyPlayControl` as a semantic button with `focus-visible:ring-2`, an explicit Korean `aria-label`, and a local active label.

- [ ] **Step 2: Implement variant 01 as a compact vertical poster**

Use a consistent fixed basis (`basis-[232px]` desktop and `basis-[196px]` mobile), a reduced image aspect ratio, `rounded-[18px]`, compact padding, two-line title clamp, and a subtle hover lift disabled by `useReducedMotion()`.

- [ ] **Step 3: Implement variant 02 with an internal information panel**

Keep the image dominant, anchor a translucent `backdrop-blur` panel to the bottom inset of the thumbnail, place category at the top, and keep title/duration readable against light and dark imagery. The panel must remain inside one `rounded-[24px]` clipping boundary.

- [ ] **Step 4: Run lint on the new primitives and variants**

Run:

```bash
npx eslint src/features/odii-audio/section2-study/StudyPrimitives.tsx \
  src/features/odii-audio/section2-study/CompactPosterVariant.tsx \
  src/features/odii-audio/section2-study/OverlayInfoVariant.tsx
```

Expected: exit code 0.

- [ ] **Step 5: Commit the shared UI and first two variants**

```bash
git add src/features/odii-audio/section2-study/StudyPrimitives.tsx \
  src/features/odii-audio/section2-study/CompactPosterVariant.tsx \
  src/features/odii-audio/section2-study/OverlayInfoVariant.tsx
git commit -m "feat(odii): add compact and overlay section2 studies"
```

### Task 3: Remaining variants and comparison route

**Files:**
- Create: `src/features/odii-audio/section2-study/EditorialCaptionVariant.tsx`
- Create: `src/features/odii-audio/section2-study/LandscapeCardVariant.tsx`
- Create: `src/features/odii-audio/section2-study/Section2UiImprovements.tsx`
- Create: `src/app/odii/section2-ui-improvements/page.tsx`

**Interfaces:**
- Consumes: `StudyVariantProps`, shared primitives, `SECTION2_STUDY_STORIES`, and the first two variant components.
- Produces: the public `/odii/section2-ui-improvements` comparison page.

- [ ] **Step 1: Implement variant 03 as thumbnail plus unboxed caption**

Apply radius, border, and shadow only to `StudyImage`. Render location, title, audio title, and duration in a separate caption below it with deliberate vertical spacing and a slightly wider rail gap so adjacent captions do not merge visually.

- [ ] **Step 2: Implement variant 04 as a readable landscape card**

Use a fixed horizontal card width around `360px` desktop and `300px` mobile, a left image column around 44%, a right text column, consistent clamping, and a play control reachable without clicking the whole card. Do not collapse it into a vertical poster on mobile.

- [ ] **Step 3: Compose the client study shell**

```tsx
'use client';

export function Section2UiImprovements() {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const sharedProps = {
    stories: SECTION2_STUDY_STORIES,
    selectedStoryId,
    onSelectStory: setSelectedStoryId,
  };

  return (
    <main className="odii-feature overflow-x-clip pb-24 text-[#211e19]">
      <header>{/* study title and mock-data notice */}</header>
      <CompactPosterVariant {...sharedProps} />
      <OverlayInfoVariant {...sharedProps} />
      <EditorialCaptionVariant {...sharedProps} />
      <LandscapeCardVariant {...sharedProps} />
    </main>
  );
}
```

Use generous separators and consistent study labels so each item reads as a complete Section 2 rather than as one mixed card gallery.

- [ ] **Step 4: Add the server route and metadata**

```tsx
import type { Metadata } from 'next';
import { Section2UiImprovements } from '@/features/odii-audio/section2-study/Section2UiImprovements';

export const metadata: Metadata = {
  title: 'Section 2 UI Improvements — 온마루',
  description: '장면을 골라 듣다 섹션의 네 가지 카드 UI 비교 시안.',
};

export default function Section2UiImprovementsPage() {
  return <Section2UiImprovements />;
}
```

- [ ] **Step 5: Run focused tests and lint**

Run:

```bash
npx vitest run src/features/odii-audio/section2-study/studyData.test.ts
npx eslint src/app/odii/section2-ui-improvements/page.tsx src/features/odii-audio/section2-study
```

Expected: tests PASS and lint exits 0.

- [ ] **Step 6: Commit the complete comparison route**

```bash
git add src/app/odii/section2-ui-improvements/page.tsx src/features/odii-audio/section2-study
git commit -m "feat(odii): add section2 UI improvements page"
```

### Task 4: Production isolation and visual verification

**Files:**
- Verify only; modify study files only if the checks reveal a defect.

**Interfaces:**
- Consumes: completed comparison route.
- Produces: evidence that the study is buildable, responsive, accessible, and isolated from production Section 2.

- [ ] **Step 1: Verify production Section 2 files were not changed**

Run:

```bash
git diff bd1745b..HEAD -- src/features/odii-audio/components/OdiiAudioFeature.tsx \
  src/features/odii-audio/components/OdiiEditorialRail.tsx
```

Expected: no output.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit code 0 and `/odii/section2-ui-improvements` appears in the generated route list.

- [ ] **Step 3: Inspect the comparison page at desktop width**

Run the local development server, open `/odii/section2-ui-improvements` at approximately 1440×1000, and verify all four full sections, consistent story order, clipped rail continuation, visible labels, and local “재생 중” feedback.

- [ ] **Step 4: Inspect the comparison page at mobile width**

Inspect at approximately 390×844 and verify touch-scrollable rails, no page-level horizontal overflow, readable landscape cards, title clamping, touch target size, and visible focus styles.

- [ ] **Step 5: Spot-check the existing `/odii` Section 2**

Open `/odii`, navigate to “장면을 골라 듣다,” and confirm its title, rail layout, controls, API-driven content, and neighboring sections remain unchanged.

- [ ] **Step 6: Run the final focused verification suite**

Run:

```bash
npx vitest run src/features/odii-audio/section2-study/studyData.test.ts
npx eslint src/app/odii/section2-ui-improvements/page.tsx src/features/odii-audio/section2-study
git diff --check
git status --short
```

Expected: tests and lint pass, `git diff --check` prints nothing, and status contains no unintended files.

- [ ] **Step 7: Commit any QA-only corrections**

If visual inspection required study-only corrections, stage only those files and commit:

```bash
git add src/app/odii/section2-ui-improvements/page.tsx src/features/odii-audio/section2-study
git commit -m "fix(odii): polish section2 comparison layouts"
```

If no corrections were needed, do not create an empty commit.

### Task 5: Temporary desktop navigation link

**Files:**
- Modify: `src/shared/components/Header/Header.tsx`

**Interfaces:**
- Consumes: the completed `/odii/section2-ui-improvements` route.
- Produces: a removable desktop `카드들` navigation link; mobile navigation remains unchanged.

- [ ] **Step 1: Add the isolated temporary link**

Immediately after the existing `소리마루` `NavLink`, add one commented JSX block:

```tsx
{/* 임시 UI 비교 페이지 링크: 스터디 종료 후 이 블록만 제거 */}
<NavLink
  href="/odii/section2-ui-improvements"
  $isLanding={usesDarkSurface}
  $isOdii={isOdiiPage}
>
  카드들
</NavLink>
```

Do not add the link to `MobileTabNav` or `MobileMenuPanel`.

- [ ] **Step 2: Run focused lint**

Run: `npx eslint src/shared/components/Header/Header.tsx`

Expected: exit code 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0 and `/odii/section2-ui-improvements` remains in the route list.

- [ ] **Step 4: Verify the existing and target routes**

With the local server running, request `/odii` and `/odii/section2-ui-improvements` and expect HTTP 200 for both. Confirm the rendered header contains the `카드들` label and target href.

- [ ] **Step 5: Commit the temporary navigation entry**

```bash
git add src/shared/components/Header/Header.tsx
git commit -m "feat(odii): link temporary section2 card studies"
```
