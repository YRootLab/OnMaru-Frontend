# Home Layout and Navigation Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the existing visual design while simplifying home copy, containing the popular-sound grid, reserving first-load height, and aligning desktop navigation content on one centerY axis.

**Architecture:** Keep changes in existing presentation components. Replace manual vertical transforms with local Header auto-layout primitives, fix grid intrinsic sizing at the track/card boundary, and reserve loading height in document flow without hiding the Footer.

**Tech Stack:** Next.js 16.3.5, React 19, TypeScript, Emotion, Vitest, Testing Library.

## Global Constraints

- Preserve colors, typography, control heights, horizontal spacing, hover/active states, routes, and responsive visibility.
- Do not introduce API calls or change data ownership.
- Keep the shared maximum width at `1140px`.
- Do not hide the Footer or introduce a new blocking overlay.
- Loading placeholders must reserve final dimensions and use neutral gray surfaces.

---

### Task 1: Header centerY Auto Layout

**Files:**
- Modify: `src/shared/components/Header/Header.tsx`
- Create: `src/shared/components/Header/Header.alignment.test.tsx`

**Interfaces:**
- Consumes: existing `NavLink`, `LoginButton`, `OniAvatar`, and Hugeicons.
- Produces: local `NavItemContent`, `NavIconBox`, `LoginLabel`, and `LoginChevron` primitives with no positional transforms.

- [ ] **Step 1: Write the failing test**

Render an authenticated desktop Header and assert the nav content, profile label, and chevron use `align-items: center` with `transform: none`.

```tsx
expect(getComputedStyle(screen.getByTestId('desktop-nav-home-content')).alignItems).toBe('center');
expect(getComputedStyle(screen.getByTestId('desktop-profile-label')).transform).toBe('none');
expect(getComputedStyle(screen.getByTestId('desktop-profile-chevron')).transform).toBe('none');
```

- [ ] **Step 2: Verify the test fails**

Run `npx vitest run src/shared/components/Header/Header.alignment.test.tsx` and expect missing slots plus the current `translateY` rules.

- [ ] **Step 3: Implement the minimal alignment refactor**

Use a stable-height inline grid/flex row with centered children. Remove desktop-nav `translateY(-2px)` and profile `translateY(2px)`. Preserve icon sizes and gaps.

```css
display: inline-grid;
grid-auto-flow: column;
align-items: center;
line-height: 1;
```

- [ ] **Step 4: Verify focused tests pass**

Run `npx vitest run src/shared/components/Header/Header.alignment.test.tsx src/shared/components/Header/headerSurface.test.ts` and expect PASS.

- [ ] **Step 5: Commit**

Stage only Header source/test files and commit `refactor(header): align navigation content on center axis`.

### Task 2: Home copy and popular-sound containment

**Files:**
- Modify: `src/features/journey-curator/components/JourneyHeroSearch.tsx`
- Modify: `src/features/journey-curator/components/JourneyDiscoveryFeed.tsx`
- Create: `src/features/journey-curator/components/JourneyHeroSearch.copy.test.tsx`
- Create: `src/features/journey-curator/components/JourneyDiscoveryFeed.layout.test.tsx`

**Interfaces:**
- Consumes: existing auth and home-data hooks unchanged.
- Produces: constant hero copy and a responsive grid that cannot exceed the feed container.

- [ ] **Step 1: Write failing copy/layout tests**

```tsx
expect(screen.getByRole('heading', { name: '어떤 장소로 떠나고 싶으세요?' })).toBeInTheDocument();
expect(screen.getByPlaceholderText('가고 싶은 지역이나 분위기를 알려주세요')).toBeInTheDocument();
```

Also assert the grid uses `minmax(0, 1fr)` tracks and sound cards expose `min-width: 0`.

- [ ] **Step 2: Verify the tests fail**

Run both new test files and expect failures on personalized copy, old placeholder, and `repeat(3, 1fr)`.

- [ ] **Step 3: Implement minimal presentation changes**

Replace only the two strings. Use `repeat(3, minmax(0, 1fr))`, tablet `repeat(2, minmax(0, 1fr))`, and `min-width: 0; box-sizing: border-box` on sound cards. Preserve ellipsis and visual tokens.

- [ ] **Step 4: Verify focused tests pass**

Run the two new tests and expect PASS.

- [ ] **Step 5: Commit**

Stage only home source/test files and commit `fix(home): contain sound grid and simplify hero copy`.

### Task 3: Initial loading footprint and Footer flow

**Files:**
- Modify: `src/app/loading.tsx`
- Create: `src/app/loading.test.tsx`
- Modify only if measurement proves collapse: `src/features/journey-curator/components/JourneyHome.tsx`
- Modify only if measurement proves collapse: `src/features/hanok-archive/HanokArchive.tsx`
- Modify only if measurement proves collapse: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`

**Interfaces:**
- Consumes: existing page minimum heights and feature skeletons.
- Produces: an in-flow loading footprint of at least one viewport with the current loading character centered inside it.

- [ ] **Step 1: Write the failing loading test**

```tsx
expect(getComputedStyle(screen.getByRole('status')).position).not.toBe('fixed');
expect(getComputedStyle(screen.getByRole('status')).minHeight).toBe('100dvh');
expect(screen.getByText('페이지 로딩 중')).toBeInTheDocument();
```

- [ ] **Step 2: Verify the test fails**

Run `npx vitest run src/app/loading.test.tsx`; expect failure because the current fixed layer reserves no document height.

- [ ] **Step 3: Implement the in-flow footprint**

Keep the same artwork, copy, transparency, sizing, and non-interactive behavior. Replace fixed inset positioning with a width-100%, `min-height: 100dvh` in-flow container.

- [ ] **Step 4: Measure all three feature roots**

Capture delayed-response initial states for `/`, `/hanok`, and `/sorimaru` at desktop/mobile widths. Leave roots already reserving `100dvh` unchanged. If a first section collapses, add the smallest shared loading/loaded minimum-height token at that section.

- [ ] **Step 5: Verify loading/skeleton tests**

Run `npx vitest run src/app/loading.test.tsx src/features/sorimaru-audio/components/StoryCarousel.test.tsx src/features/sorimaru-audio/components/SorimaruArchiveBrowse.test.tsx` and expect PASS.

- [ ] **Step 6: Commit**

Stage only measured loading-footprint source/test files and commit `fix(layout): reserve initial page loading footprint`.

### Task 4: Integrated verification and work logs

**Files:**
- Modify: `changelog.md`
- Update only if work remains: `handoff.md`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: verified local changes without PR creation.

- [ ] **Step 1: Run focused tests, `npx tsc --noEmit`, and `git diff --check`**

All commands must exit 0.

- [ ] **Step 2: Perform visual verification**

Check desktop/tablet/mobile and light/dark states. Confirm unchanged styling, a contained 1140px sound grid, shared Header centerY, stable loading/live footprints, and Footer below the initial viewport.

- [ ] **Step 3: Record the change**

Add one concise Unreleased entry to `changelog.md` without overwriting existing entries.

- [ ] **Step 4: Review final diff**

Run `git diff --check`, `git status --short`, and `git diff --stat`; expect only intended source, test, design/plan, and work-log files.
