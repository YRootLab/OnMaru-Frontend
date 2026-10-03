# Home Course Korean Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw home-course category codes with Korean labels and render the category, content tags, and saved state as compact semantic chips.

**Architecture:** Add a deterministic presentation helper that owns category labels and produces a maximum-three-chip view model. Render that view model through a focused `HomeCourseTagList` component, while `JourneyDiscoveryFeed` continues to own course selection and passes raw API values into the presentation boundary. API contracts, filter request codes, card dimensions, and carousel behavior remain unchanged.

**Tech Stack:** React 19, Next.js 16, TypeScript, Emotion styled components, Vitest, Testing Library

## Global Constraints

- Display `문화 예술` and `정원 생태` without middle dots.
- Never expose unknown English category codes; use `추천 장소` instead.
- Preserve already-Korean category values.
- Show at most three chips: category plus two content tags, or category plus one content tag plus `저장됨`.
- Remove leading `#`, trim and collapse whitespace, and remove duplicate tags.
- Keep the original category code for API filter requests.
- Do not change card size, image ratio, title/description footprint, or carousel behavior.

---

### Task 1: Korean category and tag view model

**Files:**
- Create: `src/features/journey-curator/presentation/homeCourseTags.ts`
- Create: `src/features/journey-curator/presentation/homeCourseTags.test.ts`
- Modify: `src/features/journey-curator/components/JourneyDiscoveryFeed.tsx:856-863`

**Interfaces:**
- Produces: `COURSE_CATEGORY_LABELS: Readonly<Record<string, string>>`.
- Produces: `getHomeCourseCategoryLabel(category?: string | null): string`.
- Produces: `buildHomeCourseTags(input: { category?: string | null; tags?: string[] | null; savedByMe?: boolean }): HomeCourseTag[]`.
- Produces: `HomeCourseTag = { label: string; kind: 'category' | 'content' | 'saved' }`.

- [x] **Step 1: Write failing helper tests**

```ts
expect(getHomeCourseCategoryLabel('HANOK')).toBe('한옥');
expect(getHomeCourseCategoryLabel('HANOK_EXPERIENCE')).toBe('한옥 체험');
expect(getHomeCourseCategoryLabel('HANOK_CAFE')).toBe('한옥 카페');
expect(getHomeCourseCategoryLabel('HANOK_STAY')).toBe('한옥 숙박');
expect(getHomeCourseCategoryLabel('CULTURE_ART')).toBe('문화 예술');
expect(getHomeCourseCategoryLabel('TRADITIONAL_FOOD')).toBe('전통 음식');
expect(getHomeCourseCategoryLabel('GARDEN_ECOLOGY')).toBe('정원 생태');
expect(getHomeCourseCategoryLabel('LOCAL_SCENE')).toBe('지역 생활');
expect(getHomeCourseCategoryLabel('UNKNOWN_CODE')).toBe('추천 장소');
expect(getHomeCourseCategoryLabel('')).toBe('추천 장소');
expect(getHomeCourseCategoryLabel('전통시장')).toBe('전통시장');
```

Test normalization, duplicate removal, and the three-chip budget:

```ts
expect(buildHomeCourseTags({
  category: 'HANOK',
  tags: ['#한옥', '  고택  ', '#고택', '산책', '사진'],
})).toEqual([
  { label: '한옥', kind: 'category' },
  { label: '고택', kind: 'content' },
  { label: '산책', kind: 'content' },
]);

expect(buildHomeCourseTags({
  category: 'HANOK_CAFE',
  tags: ['#한옥 카페', '#차', '#디저트'],
  savedByMe: true,
})).toEqual([
  { label: '한옥 카페', kind: 'category' },
  { label: '차', kind: 'content' },
  { label: '저장됨', kind: 'saved' },
]);
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/features/journey-curator/presentation/homeCourseTags.test.ts`

Expected: FAIL because the presentation helper does not exist.

- [x] **Step 3: Implement the minimal deterministic helper**

```ts
export const COURSE_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  HANOK: '한옥',
  HANOK_EXPERIENCE: '한옥 체험',
  HANOK_CAFE: '한옥 카페',
  HANOK_STAY: '한옥 숙박',
  CULTURE_ART: '문화 예술',
  TRADITIONAL_FOOD: '전통 음식',
  GARDEN_ECOLOGY: '정원 생태',
  LOCAL_SCENE: '지역 생활',
};

export type HomeCourseTag = {
  label: string;
  kind: 'category' | 'content' | 'saved';
};

const normalizeTag = (value: string) => value.replace(/^#+/, '').trim().replace(/\s+/g, ' ');
const comparisonKey = (value: string) => normalizeTag(value).toLocaleLowerCase('ko-KR');

export function getHomeCourseCategoryLabel(category?: string | null): string {
  const normalized = category?.trim();
  if (!normalized) return '추천 장소';
  const mapped = COURSE_CATEGORY_LABELS[normalized.toUpperCase()];
  if (mapped) return mapped;
  return /[가-힣]/.test(normalized) ? normalized : '추천 장소';
}

export function buildHomeCourseTags(input: {
  category?: string | null;
  tags?: string[] | null;
  savedByMe?: boolean;
}): HomeCourseTag[] {
  const category = getHomeCourseCategoryLabel(input.category);
  const seen = new Set([comparisonKey(category)]);
  const contentLimit = input.savedByMe ? 1 : 2;
  const content = (input.tags ?? []).flatMap((raw) => {
    const label = normalizeTag(raw);
    const key = comparisonKey(label);
    if (!label || seen.has(key)) return [];
    seen.add(key);
    return [{ label, kind: 'content' as const }];
  }).slice(0, contentLimit);

  return [
    { label: category, kind: 'category' },
    ...content,
    ...(input.savedByMe ? [{ label: '저장됨', kind: 'saved' as const }] : []),
  ];
}
```

Remove the duplicated local label object from `JourneyDiscoveryFeed` and import `COURSE_CATEGORY_LABELS` from this helper. The filter continues to submit the existing enum code.

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run src/features/journey-curator/presentation/homeCourseTags.test.ts`

Expected: all category, fallback, normalization, duplicate, saved-state, and limit tests PASS.

- [x] **Step 5: Commit the helper**

```bash
git add src/features/journey-curator/presentation/homeCourseTags.ts \
  src/features/journey-curator/presentation/homeCourseTags.test.ts \
  src/features/journey-curator/components/JourneyDiscoveryFeed.tsx
git commit -m "fix(home): localize curated course categories"
```

### Task 2: Semantic course tag chips

**Files:**
- Create: `src/features/journey-curator/components/HomeCourseTagList.tsx`
- Create: `src/features/journey-curator/components/HomeCourseTagList.test.tsx`
- Modify: `src/features/journey-curator/components/JourneyDiscoveryFeed.tsx:396-425,1023-1031`

**Interfaces:**
- Consumes: `category?: string | null`, `tags?: string[] | null`, and `savedByMe?: boolean`.
- Produces: `HomeCourseTagList(props): React.ReactElement`, an accessible one-line chip list backed by `buildHomeCourseTags`.

- [x] **Step 1: Write the failing component test**

```tsx
render(
  <HomeCourseTagList
    category="HANOK_EXPERIENCE"
    tags={['#한옥 체험', '#공예', '#전통', '#가족']}
    savedByMe
  />,
);

expect(screen.queryByText('HANOK_EXPERIENCE')).toBeNull();
expect(screen.getByText('한옥 체험').getAttribute('data-tag-kind')).toBe('category');
expect(screen.getByText('공예').getAttribute('data-tag-kind')).toBe('content');
expect(screen.getByText('저장됨').getAttribute('data-tag-kind')).toBe('saved');
expect(screen.queryByText('#공예')).toBeNull();
expect(screen.getAllByRole('listitem')).toHaveLength(3);
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/features/journey-curator/components/HomeCourseTagList.test.tsx`

Expected: FAIL because `HomeCourseTagList` does not exist.

- [x] **Step 3: Implement the chip list and integrate it**

```tsx
export function HomeCourseTagList(props: HomeCourseTagListProps) {
  const displayTags = buildHomeCourseTags(props);
  return (
    <TagList role="list" aria-label="코스 태그">
      {displayTags.map((tag) => (
        <Tag key={`${tag.kind}-${tag.label}`} role="listitem" data-tag-kind={tag.kind} $kind={tag.kind}>
          {tag.label}
        </Tag>
      ))}
    </TagList>
  );
}
```

Use a single-row flex list with `gap: 4px`, `overflow: hidden`, and `min-width: 0`. Give every chip `fontSize.xs`, `padding: 2px 7px`, `border-radius: 999px`, `white-space: nowrap`, and ellipsis overflow. Category chips use `palette.juhong[50]`/`palette.juhong[700]`; content and saved chips use neutral `#f5f5f4`/`meok[600]`. Add corresponding dark-mode surfaces and colors.

Replace the inline `<TagList>` block in `renderCourseCard` with:

```tsx
<HomeCourseTagList
  category={course.category}
  tags={course.tags}
  savedByMe={course.savedByMe}
/>
```

- [x] **Step 4: Synchronize the course skeleton footer**

Replace the single 42%-width footer line with three small pill-shaped `SkeletonLine` elements grouped at the left, while preserving the existing CTA skeleton at the right. Use heights and gaps matching the final 20px chips so loading and loaded footers keep the same footprint.

- [x] **Step 5: Run component tests and verify GREEN**

Run: `npx vitest run src/features/journey-curator/components/HomeCourseTagList.test.tsx src/features/journey-curator/components/JourneyDiscoveryFeed.test.tsx`

Expected: chip semantics, Korean labels, three-chip limit, and existing image fallback tests PASS.

- [x] **Step 6: Commit the UI change**

```bash
git add src/features/journey-curator/components/HomeCourseTagList.tsx \
  src/features/journey-curator/components/HomeCourseTagList.test.tsx \
  src/features/journey-curator/components/JourneyDiscoveryFeed.tsx
git commit -m "fix(home): render curated course tags as chips"
```

### Task 3: Integrated verification and delivery

**Files:**
- Modify: `changelog.md`
- Update: GitHub Issue/PR records for this work

**Interfaces:**
- Consumes: the helper and chip component from Tasks 1 and 2.
- Produces: a verified branch and a documented `develop` PR.

- [x] **Step 1: Add the changelog entry**

Add under `Unreleased`:

```markdown
- 홈 `이번 주 추천 코스`의 영문 분류 코드를 한국어로 바꾸고, 분류·콘텐츠·저장 상태를 중복 없는 최대 3개의 태그 칩으로 정리했다.
```

- [x] **Step 2: Run fresh verification**

```bash
npx vitest run \
  src/features/journey-curator/presentation/homeCourseTags.test.ts \
  src/features/journey-curator/components/HomeCourseTagList.test.tsx \
  src/features/journey-curator/components/JourneyDiscoveryFeed.test.tsx
npm test -- --run
npx tsc --noEmit
git diff --name-only origin/develop...HEAD | rg '\.(ts|tsx)$' | xargs npx eslint
npm run check:env
npm run build
git diff origin/develop...HEAD --check
```

Expected: every command exits 0.

- [x] **Step 3: Verify the rendered home cards**

On port 3002, verify desktop and mobile `/` views: no raw `HANOK*` values are visible; category chips are pale orange; content and saved chips are neutral; middle dots are absent from `문화 예술` and `정원 생태`; no more than three chips render; the CTA remains visible; cards and skeletons keep the same footer height.

- [ ] **Step 4: Reconcile work logs and prepare delivery**

Run `cleaning-work-logs`, reference the related Issue in the PR body, include fresh verification totals, and wait for explicit user approval before pushing the feature branch or creating/merging the `develop` PR.
