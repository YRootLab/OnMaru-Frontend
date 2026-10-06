# Sorimaru Theme and Info Map Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Sorimaru theme tabs and the info map to the new backend category contracts without changing unrelated UI behavior.

**Architecture:** Keep network access in existing infrastructure repositories and client hooks. Define Sorimaru display labels and API codes together, feed the selected code into the catalog controller, and make `hanok` the only valid info-map initial/fallback category.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Zustand, Vitest, Testing Library

## Global Constraints

- Sorimaru all requests omit `category`; theme requests use the six fixed uppercase codes.
- Sorimaru theme requests never send `regionCode`.
- Cursor requests preserve the selected theme and add only the response cursor.
- Info map list and viewport requests always send a category, initially `HANOK`.
- Preserve existing layouts, animation, and non-info-map behavior.

---

### Task 1: Sorimaru theme contract

**Files:**
- Modify: `src/features/sorimaru-audio/data/sorimaruCategoryData.ts`
- Modify: `src/features/sorimaru-audio/hooks/useSorimaruCatalog.ts`
- Modify: `src/features/sorimaru-audio/components/CategoryTagFilter.tsx`
- Modify: `src/features/sorimaru-audio/components/SorimaruAudioFeature.tsx`
- Test: `src/features/sorimaru-audio/hooks/useSorimaruCatalog.test.ts`
- Test: `src/features/sorimaru-audio/components/SorimaruAudioFeature.totalCount.test.tsx`

**Interfaces:**
- Consumes: `SorimaruRepository.listStories(SorimaruListQuery)`
- Produces: theme definitions whose `category` is one of the six BE codes and catalog queries without `regionCode`

- [x] Add failing tests for all-view omission, fixed theme codes, cursor preservation, tab-driven reload, and region-chip removal.
- [x] Run the focused tests and confirm contract assertions fail.
- [x] Add category codes to the theme definitions, render the theme-only filter, and pass the selected code to `useSorimaruCatalog`.
- [x] Run the focused tests and confirm they pass.

### Task 2: Mandatory info-map category

**Files:**
- Modify: `src/features/map/types.ts`
- Modify: `src/features/map/hooks/useMapStore.ts`
- Modify: `src/features/map/components/CategoryChips.tsx`
- Modify: `src/features/map/MapPage.tsx`
- Test: `src/features/map/components/CategoryChips.test.tsx`
- Test: `src/features/map/services/infoMap.service.test.ts`
- Test: `src/features/map/hooks/useInfoMapData.test.tsx`

**Interfaces:**
- Consumes: `listInfoPlaces` and `loadMapViewport`
- Produces: info-map state that always resolves to a concrete category, defaulting to `hanok`

- [x] Add failing tests proving initial requests use `HANOK`, invalid/all URL input falls back to `hanok`, and selecting the active chip does not clear the category.
- [x] Run the focused tests and confirm the old `all` behavior fails.
- [x] Remove `all` from `MapInfoCategory` and info chips, default the store to `hanok`, and preserve the active category on repeated clicks.
- [x] Run the focused tests and confirm they pass.

### Task 3: Documentation, logs, and verification

**Files:**
- Create: `docs/toFE/sorimaru-api.md`
- Modify: `handoff.md`
- Modify: `changelog.md`

- [x] Copy the BE contract document verbatim into `docs/toFE/sorimaru-api.md`.
- [x] Record the resumable work and meaningful behavior change.
- [x] Run all touched-area Vitest suites.
- [x] Run `npx tsc --noEmit` and ESLint for touched source files.
- [x] Review `git diff --check`, branch status, and the final requirement checklist.
