# Odii Archive and RAG Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` or `subagent-driven-development` to execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Korea Tourism Organization Odii API story records while making the archive denser and adding a source-grounded natural-language assistant boundary.

**Architecture:** The archive remains paginated by the upstream `stid` story record. A pure client-side model derives optional place groups only from the current page. The browser asks a same-origin proxy; an externally configured RAG/LangGraph service owns retrieval, model access, and citations.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Framer Motion, Korea Tourism Organization Odii API.

## Global Constraints

- Keep the existing Odii API as the canonical source for story metadata and audio playback.
- Do not preload all archive pages or images.
- Use neutral gray surfaces; preserve the existing pink interaction color.
- Do not claim RAG answers when the RAG backend is unavailable or returns no Odii source.
- Keep all model credentials and vector-store credentials server-side.

---

### Task 1: Derive current-page place groups

**Files:**
- Create: `src/features/odii-audio/utils/odiiArchiveGrouping.ts`
- Create: `src/features/odii-audio/utils/odiiArchiveGrouping.test.ts`

**Interfaces:**
- Produces `groupOdiiStoriesByPlace(stories: OdiiStoryItem[]): OdiiPlaceGroup[]`.
- Produces groups with stable `key`, readable `label`, `stories`, and the first story as `representative`.

- [ ] Write a failing test that groups `백제문화단지 - 입구` and `백제문화단지 - 천정전` together but leaves a different place separate.
- [ ] Run `npx vitest run src/features/odii-audio/utils/odiiArchiveGrouping.test.ts` and verify the missing-module failure.
- [ ] Implement only title-prefix grouping with a `stid` fallback for titles without a meaningful separator.
- [ ] Re-run the test and verify it passes.

### Task 2: Render the story-first archive in two columns

**Files:**
- Create: `src/features/odii-audio/components/OdiiArchiveBrowse.tsx`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`

**Interfaces:**
- Consumes `stories`, `isLoading`, `viewMode`, and existing audio-store playback actions.
- Produces a desktop two-column story grid, mobile one-column list, and optional current-page place-group view.

- [ ] Use the grouping utility’s failing test before any grouping UI.
- [ ] Keep each story row’s thumbnail, title, category/location, duration, and play control in the loaded geometry.
- [ ] Request 12 upstream records per archive page and retain API `totalCount` pagination.
- [ ] Verify the loading skeleton uses the same two-column geometry.

### Task 3: Define the RAG proxy contract and assistant UI

**Files:**
- Create: `src/features/odii-audio/api/odiiAssistant.types.ts`
- Create: `src/features/odii-audio/api/odiiAssistant.service.ts`
- Create: `src/app/api/odii/ask/route.ts`
- Create: `src/features/odii-audio/components/OdiiQuestionAssistant.tsx`
- Create: `src/features/odii-audio/api/odiiAssistant.service.test.ts`
- Modify: `src/features/odii-audio/components/OdiiAudioFeature.tsx`

**Interfaces:**
- Browser sends `{ question, filters }` to `POST /api/odii/ask`.
- Successful response contains `{ answer, sources: [{ stid, title, locationName, formattedDuration }] }` with at least one source.
- The proxy rejects missing backend configuration, invalid body, and source-less upstream answers.

- [ ] Write a failing service test for a response without sources.
- [ ] Verify the test fails because the service does not exist.
- [ ] Implement a server-only RAG proxy controlled by `ODII_RAG_API_URL` and optional `ODII_RAG_API_TOKEN`.
- [ ] Add a restrained neutral assistant panel with suggested natural-language questions, streamed-style loading copy, and clickable cited stories.
- [ ] Re-run focused tests and build.

### Task 4: Record and validate decisions

**Files:**
- Create: `docs/decisions/0002-odii-story-first-archive.md`
- Create: `docs/decisions/0003-odii-rag-langgraph-assistant.md`

- [ ] Validate ADR schema and regenerate the ADR index.
- [ ] Run `git diff --check`, focused Vitest tests, and `npm run build`.
