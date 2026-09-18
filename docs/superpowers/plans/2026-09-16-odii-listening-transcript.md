# Odii Listening Transcript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the expanded Odii player as a dark, readable listening transcript with centered active playback, tags, Roadview parity, and stable loading states.

**Architecture:** `LocalMiniPlayer` remains the Zustand/audio orchestration container. Pure tag normalization and following policy move to a model module; a transcript panel receives lines, active ID, and seek callback as props, while its hook owns DOM centering and user-scroll pause.

**Tech Stack:** Next.js 16, React 19, TypeScript, Emotion, Framer Motion, Zustand, Vitest, Lucide.

## Global Constraints

- Use neutral gray skeletons and exact loaded component dimensions.
- Limit gold to the active playback marker; inactive transcript lines render at 60% opacity.
- Render a maximum of seven unique tags and remove both the status badge and full-transcript action.
- Respect reduced motion; no rendering or interaction path may depend on motion.
- Do not create a PR or merge the branch.

---

### Task 1: Transcript presentation model

**Files:**

- Create: `src/features/sorimaru-audio/components/playerTranscriptModel.ts`
- Create: `src/features/sorimaru-audio/components/playerTranscriptModel.test.ts`

**Interfaces:**

- Produces `normalizeContentTags(values: readonly (string | null | undefined)[]): string[]` and `shouldFollowTranscript(input: TranscriptFollowInput): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
it('returns at most seven unique trimmed tags', () => {
  expect(normalizeContentTags([' 한옥 ', '골목', '한옥', '', undefined, '문화', '역사', '마을', '산책', '도슨트']))
    .toEqual(['한옥', '골목', '문화', '역사', '마을', '산책', '도슨트']);
});

it('does not follow playback during visitor scrolling', () => {
  expect(shouldFollowTranscript({ isUserScrolling: true, activeLineChanged: true, requestedSeek: false })).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/sorimaru-audio/components/playerTranscriptModel.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export function normalizeContentTags(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].slice(0, 7);
}

export function shouldFollowTranscript(input: TranscriptFollowInput): boolean {
  return input.requestedSeek || (input.activeLineChanged && !input.isUserScrolling);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/sorimaru-audio/components/playerTranscriptModel.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/features/sorimaru-audio/components/playerTranscriptModel.ts src/features/sorimaru-audio/components/playerTranscriptModel.test.ts && git commit -m "feat: add odii transcript model"`

### Task 2: Prop-injected transcript panel

**Files:**

- Create: `src/features/sorimaru-audio/components/PlayerTranscriptPanel.tsx`
- Create: `src/features/sorimaru-audio/components/PlayerTranscriptPanel.test.tsx`
- Create: `src/features/sorimaru-audio/components/useTranscriptFollow.ts`

**Interfaces:**

- Consumes `lines: readonly ScriptLine[]`, `activeLineId: number | undefined`, `onSeek(timeSec: number): void`, and `isLoading: boolean`.
- Produces `PlayerTranscriptPanel`; no store selection or API access occurs inside it.

- [ ] **Step 1: Write the failing test**

```tsx
it('marks only the supplied active line as current and seeks on selection', async () => {
  // Render two literal ScriptLine values with activeLineId={2}; click line 1.
  // Assert line 2 has aria-current="true" and onSeek receives 0.
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/sorimaru-audio/components/PlayerTranscriptPanel.test.tsx`

Expected: FAIL because `PlayerTranscriptPanel` does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function PlayerTranscriptPanel({ lines, activeLineId, onSeek, isLoading }: Props) {
  if (isLoading) return <TranscriptSkeleton />;
  return <TranscriptPanel aria-label="실시간 해설 대본">{lines.map((line) => <TranscriptLine key={line.id} aria-current={line.id === activeLineId} onClick={() => onSeek(line.timeSec)}>{line.text}</TranscriptLine>)}</TranscriptPanel>;
}
```

Add `useTranscriptFollow` with a scroll pause timer, active ref callback, and `scrollIntoView({ block: 'center', behavior })`; choose `auto` for reduced motion and call it only when `shouldFollowTranscript` permits it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/sorimaru-audio/components/PlayerTranscriptPanel.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/features/sorimaru-audio/components/PlayerTranscriptPanel.tsx src/features/sorimaru-audio/components/PlayerTranscriptPanel.test.tsx src/features/sorimaru-audio/components/useTranscriptFollow.ts && git commit -m "feat: add synchronized odii transcript panel"`

### Task 3: Expanded player composition and skeleton parity

**Files:**

- Create: `src/features/sorimaru-audio/components/PlayerMetadata.tsx`
- Create: `src/features/sorimaru-audio/components/ExpandedPlayerSkeleton.tsx`
- Create: `src/features/sorimaru-audio/components/ExpandedPlayerSkeleton.test.tsx`
- Modify: `src/features/sorimaru-audio/components/LocalMiniPlayer.tsx`
- Modify: `src/features/sorimaru-audio/types/sorimaru.types.ts`

**Interfaces:**

- `SorimaruStoryItem` gains optional `tags?: string[]`.
- `PlayerMetadata` receives already-normalized tags. `ExpandedPlayerSkeleton` shares the loaded grid, media ratio, and transcript panel dimensions.

- [ ] **Step 1: Write the failing test**

```tsx
it('reserves media, tag, control, and transcript regions while loading', () => {
  // Render ExpandedPlayerSkeleton and assert each labelled skeleton region exists.
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/sorimaru-audio/components/ExpandedPlayerSkeleton.test.tsx`

Expected: FAIL because `ExpandedPlayerSkeleton` does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function ExpandedPlayerSkeleton() {
  return <PlayerExperienceGrid><MediaSkeleton /><MetadataSkeleton /><TranscriptSkeleton /></PlayerExperienceGrid>;
}
```

Use the same grid and media `aspect-ratio` as loaded content. In `LocalMiniPlayer`, derive tags from story inputs through `normalizeContentTags`, remove `isTranscriptOpen`, `previewLines`, `PlayingStatusBadge`, and the full-view route, then pass selected store values and callbacks to the new components. Add the static panel-local lamp header wash and preserve a readable dark transcript surface.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/sorimaru-audio/components/ExpandedPlayerSkeleton.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/features/sorimaru-audio/components/PlayerMetadata.tsx src/features/sorimaru-audio/components/ExpandedPlayerSkeleton.tsx src/features/sorimaru-audio/components/ExpandedPlayerSkeleton.test.tsx src/features/sorimaru-audio/components/LocalMiniPlayer.tsx src/features/sorimaru-audio/types/sorimaru.types.ts && git commit -m "feat: redesign expanded odii player"`

### Task 4: Verify and record the change

**Files:**

- Modify: `handoff.md`
- Modify: `changelog.md`

- [ ] **Step 1: Run focused test suite**

Run: `npm test -- src/features/sorimaru-audio/components/playerTranscriptModel.test.ts src/features/sorimaru-audio/components/PlayerTranscriptPanel.test.tsx src/features/sorimaru-audio/components/ExpandedPlayerSkeleton.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run full verification**

Run: `npx tsc --noEmit && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 3: Inspect responsive view**

Run: start `npm run dev` and capture the expanded player at 1440px and 390px widths. Check centered active line, 60% inactive lines, tag wrapping, Roadview/image parity, and no skeleton layout jump.

- [ ] **Step 4: Update work logs**

Add the completed behavior and actual verification result to `handoff.md` and an Unreleased entry to `changelog.md`.

- [ ] **Step 5: Commit**

Run: `git add handoff.md changelog.md && git commit -m "docs: record odii player redesign"`

## Plan Self-review

- Tasks 2 and 3 cover the transcript styling, lamp header, tag limit, Roadview fallback, and skeleton parity.
- All test expectations exercise observable behavior rather than implementation text.
- The component interfaces are consistent with the model names used by the player container.
