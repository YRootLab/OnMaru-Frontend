# Sorimaru Card Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both Sorimaru story-card variants easier to read, allow titles to occupy at most two lines, and emphasize only `반경 3km` and `전국 큐레이션` in the nearby fallback notice.

**Architecture:** Keep network and location state unchanged. Add one small presentation component for the nearby notice, then update the existing Emotion card styles and their matching skeleton dimensions in place. Tests assert rendered copy segmentation and final CSS behavior before implementation changes are made.

**Tech Stack:** React 19, Next.js 16, TypeScript, Emotion styled components, Vitest, Testing Library

## Global Constraints

- Use the existing neutral `meok` palette for ordinary notice text and existing `juhong` palette for the two emphasized phrases.
- Increase the small text hierarchy by one existing design-token step; do not introduce new global tokens.
- Clamp both story-card title variants to exactly two lines maximum.
- Keep card widths, carousel behavior, archive column count, data fetching, and player behavior unchanged.
- Synchronize skeleton and loaded-card footprints so the change introduces no layout shift.
- Preserve light and dark theme semantics.

---

### Task 1: Nearby fallback notice emphasis

**Files:**
- Create: `src/features/sorimaru-audio/presentation/NearbyLocationDescription.tsx`
- Create: `src/features/sorimaru-audio/presentation/NearbyLocationDescription.test.tsx`
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx:224-245,553-557`

**Interfaces:**
- Consumes: `message: string` from the existing `locationMessage` state.
- Produces: `NearbyLocationDescription({ message }: { message: string }): React.ReactElement`, rendering ordinary messages neutrally and the exact fallback message with two emphasized spans.

- [ ] **Step 1: Write the failing presentation tests**

```tsx
render(
  <NearbyLocationDescription message="반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드릴게요." />,
);

expect(screen.getByText('반경 3km').getAttribute('data-emphasis')).toBe('nearby-radius');
expect(screen.getByText('전국 큐레이션').getAttribute('data-emphasis')).toBe('national-curation');
expect(document.querySelector('[data-tone="neutral"]')?.textContent).toBe(
  '반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드릴게요.',
);

cleanup();
render(<NearbyLocationDescription message="현재 위치를 확인하고 주변 이야기를 찾는 중이에요." />);
expect(screen.queryByText('반경 3km')).toBeNull();
expect(screen.getByText('현재 위치를 확인하고 주변 이야기를 찾는 중이에요.')).toBeTruthy();
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/features/sorimaru-audio/presentation/NearbyLocationDescription.test.tsx`

Expected: FAIL because `NearbyLocationDescription` does not exist.

- [ ] **Step 3: Implement the minimal notice component**

```tsx
const FALLBACK_MESSAGE = '반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드릴게요.';

export function NearbyLocationDescription({ message }: { message: string }) {
  if (message !== FALLBACK_MESSAGE) {
    return <NeutralText data-tone="neutral">{message}</NeutralText>;
  }

  return (
    <NeutralText data-tone="neutral">
      <Emphasis data-emphasis="nearby-radius">반경 3km</Emphasis>
      {' 안에는 아직 등록된 이야기가 없어요. '}
      <Emphasis data-emphasis="national-curation">전국 큐레이션</Emphasis>
      {'을 보여드릴게요.'}
    </NeutralText>
  );
}
```

Style `NeutralText` with `meok[700]`/dark `meok[400]`; style `Emphasis` with `palette.juhong[700]`/dark `palette.juhong[300]` and `font-weight: 700`. Replace the `$notice` whole-line color branch in `SorimaruAudioFeature` with this component while retaining the existing `0.875rem` description size and margin.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run src/features/sorimaru-audio/presentation/NearbyLocationDescription.test.tsx`

Expected: both fallback segmentation and ordinary-message tests PASS.

- [ ] **Step 5: Commit the independently working notice change**

```bash
git add src/features/sorimaru-audio/presentation/NearbyLocationDescription.tsx \
  src/features/sorimaru-audio/presentation/NearbyLocationDescription.test.tsx \
  src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx
git commit -m "fix(sorimaru): focus nearby fallback emphasis"
```

### Task 2: Nearby carousel card typography and skeleton

**Files:**
- Create: `src/features/sorimaru-audio/components/StoryCarousel.test.tsx`
- Modify: `src/features/sorimaru-audio/components/StoryCarousel.tsx:78-324,399-452`

**Interfaces:**
- Consumes: existing `StoryCarouselProps` without changes.
- Produces: the same carousel behavior with readable one-step-larger text, two-line titles, and matching skeleton footprint.

- [ ] **Step 1: Write a failing card-style test**

Render one story after mocking animation, image, and player-store dependencies. Query its title by heading role and its card with `closest('[data-story-card]')`.

```tsx
const title = screen.getByRole('heading', { name: LONG_TITLE });
expect(getComputedStyle(title).webkitLineClamp).toBe('2');
expect(getComputedStyle(title).fontSize).toBe('16px');

const card = title.closest('[data-story-card]');
expect(card).not.toBeNull();
expect(parseFloat(getComputedStyle(card!).minHeight)).toBeGreaterThanOrEqual(176);
```

Render `StoryCarouselSkeleton`, then assert its card exposes `data-skeleton-story-card` and reserves the same minimum height as the loaded card.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/features/sorimaru-audio/components/StoryCarousel.test.tsx`

Expected: FAIL because the title is clamped to one line, the mobile title is 14px, and the skeleton has no synchronized card marker.

- [ ] **Step 3: Implement the minimal typography and footprint changes**

```css
CardButton {
  min-height: 11rem;
}

CardMainTitle {
  font-size: 1rem;
  line-height: 1.35;
  -webkit-line-clamp: 2;
}

@media (min-width: 640px) {
  CardMainTitle { font-size: 1.125rem; }
}
```

Change `CardSubTitle`, `MiniCategoryTag`, `LocationSpan`, `ExcerptText`, and `CardBottomMeta` from `fontSize.micro` to `fontSize.xs`. Give the skeleton card `data-skeleton-story-card`, the same `minHeight: '11rem'`, and two title skeleton rows so its content footprint matches the loaded card without changing its width or columns.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run src/features/sorimaru-audio/components/StoryCarousel.test.tsx`

Expected: title clamp, one-step token size, and skeleton footprint assertions PASS.

- [ ] **Step 5: Commit the independently working carousel change**

```bash
git add src/features/sorimaru-audio/components/StoryCarousel.tsx \
  src/features/sorimaru-audio/components/StoryCarousel.test.tsx
git commit -m "fix(sorimaru): improve nearby card readability"
```

### Task 3: Archive story-card typography and skeleton

**Files:**
- Modify: `src/features/sorimaru-audio/components/SorimaruArchiveBrowse.tsx:74-129,151-371`
- Modify: `src/features/sorimaru-audio/components/SorimaruArchiveBrowse.test.tsx`

**Interfaces:**
- Consumes: existing `SorimaruArchiveBrowseProps` without changes.
- Produces: the same story/place archive modes with larger story-row text and two-line story titles.

- [ ] **Step 1: Add a failing archive-card test**

Render one long-titled story in the default `이야기별` mode, then query its heading and article.

```tsx
const title = screen.getByRole('heading', { name: LONG_TITLE });
expect(getComputedStyle(title).webkitLineClamp).toBe('2');
expect(getComputedStyle(title).fontSize).toBe('16px');

const article = title.closest('article');
expect(article).not.toBeNull();
expect(parseFloat(getComputedStyle(article!).minHeight)).toBeGreaterThanOrEqual(104);
```

Render the loading state and assert each `data-skeleton-archive-card` reserves the same minimum height and contains two title skeleton bars.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/features/sorimaru-audio/components/SorimaruArchiveBrowse.test.tsx`

Expected: FAIL because archive titles are clamped to one line and the loaded/skeleton cards do not reserve two-line height.

- [ ] **Step 3: Implement the minimal archive changes**

```css
StoryArticle {
  min-height: 6.5rem;
}

StoryRowTitle {
  font-size: 1rem;
  -webkit-line-clamp: 2;
}
```

Change `DurationPill`, `LocationMeta`, and `HashtagsRow` to `fontSize.xs`. Keep `PlaceGroupTitle` and place-mode structure unchanged, while the shared `StoryRow` receives the same two-line treatment in both modes. Mark skeleton cards with `data-skeleton-archive-card`, reserve `6.5rem`, and render two title bars matching the final title block.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run src/features/sorimaru-audio/components/SorimaruArchiveBrowse.test.tsx`

Expected: existing request-state tests and new typography/skeleton tests PASS.

- [ ] **Step 5: Commit the independently working archive change**

```bash
git add src/features/sorimaru-audio/components/SorimaruArchiveBrowse.tsx \
  src/features/sorimaru-audio/components/SorimaruArchiveBrowse.test.tsx
git commit -m "fix(sorimaru): allow two-line archive titles"
```

### Task 4: Integrated verification and PR update

**Files:**
- Modify: `changelog.md`
- Update: GitHub PR body for the current branch

**Interfaces:**
- Consumes: all three completed UI tasks.
- Produces: verified branch and a PR record that describes the additional typography work.

- [ ] **Step 1: Run focused and full automated verification**

```bash
npx vitest run \
  src/features/sorimaru-audio/presentation/NearbyLocationDescription.test.tsx \
  src/features/sorimaru-audio/components/StoryCarousel.test.tsx \
  src/features/sorimaru-audio/components/SorimaruArchiveBrowse.test.tsx
npm test -- --run
npx tsc --noEmit
git diff --name-only origin/develop...HEAD | rg '\.(ts|tsx)$' | xargs npx eslint
npm run build
git diff origin/develop...HEAD --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Verify the rendered UI on port 3002**

Open `/sorimaru` at desktop width and a narrow mobile width. Confirm both emphasized phrases are orange while the rest of the sentence is neutral gray; nearby and archive titles wrap to at most two lines; all small card text is one token larger; card metadata does not overlap; loaded cards replace skeletons without a visible height jump.

- [ ] **Step 3: Reconcile logs and update the existing PR**

Run `cleaning-work-logs`, add the following concise entry under `Unreleased`, push the new commits, and append the typography scope plus fresh verification totals to the open PR targeting `develop`. Do not merge the PR.

```markdown
- 소리마루 주변 이야기와 아카이브 카드의 작은 글자를 한 단계 키우고 긴 제목을 최대 두 줄로 표시했다. 위치 기반 전국 큐레이션 안내는 핵심 조건과 대체 콘텐츠만 주황색으로 강조하고 카드 스켈레톤 높이를 실제 레이아웃과 맞췄다.
```
