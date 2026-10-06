# Temporary Popular Sounds Preview Design

## Goal

Allow the user to visually inspect the newly constrained home popular-sounds grid at `localhost:3001` without depending on the backend.

## Scope

- Add exactly five representative popular-sound records as an isolated development fixture.
- Use the fixture only for the current local visual preview of the popular-sounds section.
- Preserve the existing card component, spacing, responsive grid, interactions, and production API contract.
- Do not replace or reshape unrelated home data.

## Data flow

`JourneyDiscoveryFeed` receives the existing `usePopularSounds` result. In development preview mode, a small presentation helper selects the five-record fixture; otherwise it returns the hook data unchanged. The fixture lives outside the rendering component so it can be removed without altering the server-backed hook.

## Removal

After the user finishes checking the screen, remove the fixture and preview selection only. The existing server-backed `usePopularSounds` flow remains the final implementation.

## Verification

- Unit-test that preview selection yields exactly five records only in development preview mode.
- Run the focused test, TypeScript check, and a browser check at port 3001.
