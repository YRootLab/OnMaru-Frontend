# handoff.md

## 2026-09-19 — 백엔드 1차 배포 연동 (FE #88~#97)

`myFrontendSkill/frontend-senior-engineer/skill.md`(DI/repository 경계)를 따라 실제
배포된 `onmaru-backend.onrender.com`(`/v3/api-docs` 기준 REST 42종) 연동을 시작했다.

### 완료

- **[FE #89] CSRF 이중 prefix 버그 수정**: `src/lib/api/client.ts`의 `csrfProvider`가
  `resolveApiBase(baseUrl)`("/api/v1" 붙은 값)를 넘겨받아 실제로는
  `.../api/v1/auth/csrf`를 호출하고 있었다(정답은 `/auth/csrf`, `/api/v1` 아래가
  아님). 순수 `baseUrl`을 넘기도록 고쳤다. 기존 테스트는 `endsWith('/auth/csrf')`라
  이중 prefix를 못 잡았어서, 호출 URL 전체를 비교하는 회귀 테스트를
  `client.contract.test.ts`에 추가했다.
- **env 변수 정합**: `client.ts`와 `journeyCuratorApi.ts`가 실제로는 한 번도 설정된
  적 없는 `NEXT_PUBLIC_API_BASE_URL`을 읽고 있어서 `USE_MOCK`이 항상 `true`였다.
  실제 가이드 스펙대로 `NEXT_PUBLIC_API_URL`(`.env.local`/`.env.example`에 이미
  등록됨)을 읽도록 고쳤다. **주의**: 이 결과로 이미 mock 상태로 라이브 연결돼
  있던 `journey-curator`(`/`), `visit-review`(`/map` 온기), `saved-resources`,
  member timeline(`/mypage`) repository들이 이제 실제 백엔드로 요청을 보낸다 —
  백엔드가 아직 seed 데이터뿐이라(아래 참고) 화면에 보이는 내용이 바뀔 수 있다.
  되돌리려면 `.env.local`의 `NEXT_PUBLIC_API_URL` 값을 비우면 된다.
- **[FE #88] OpenAPI 타입 코드젠**: `npm run generate:api-types`
  (`openapi-typescript` devDependency 추가) → `src/types/api.generated.d.ts`.
  단, `GET /api/v1/hanoks` 등 목록 엔드포인트는 success response 스키마가 아직
  `Record<string, never>`로만 문서화돼 있어(백엔드 미기재) 실사용 타입은 별도로
  손으로 검증했다(아래).
- **[FE #90] 한옥/장소 backend repository** (`src/features/hanok-archive/api/hanokApi.ts`,
  테스트 포함): `GET /hanoks`, `GET /places/{placeId}`, `GET /map/places`. 응답
  타입은 실서버를 직접 호출해 받은 실제 JSON으로 검증(OpenAPI 스펙이 비어 있어
  코드젠으로는 못 뽑음). **의도적으로 `HanokArchive`/`HanokMap` 라이브 화면에는
  아직 연결하지 않았다** — 지금 백엔드가 진짜 데이터가 아니라 seed 2건
  (`전주 한옥마을`, `북촌 한옥 찻집`, 썸네일도 `cdn.onmaru.example`이라는
  존재하지 않는 placeholder 도메인)뿐이라, 지금 연결하면 현재 잘 동작하는
  전국 수집분(약 259곳) 화면이 2건짜리로 퇴보한다. 백엔드가 전수 데이터를
  채운 뒤 `defaultHanokRepository`를 실제 화면 데이터 소스로 스왑하면 된다
  (컴포넌트/훅 코드는 안 건드려도 됨 — repository만 교체).
- 검증: `npx tsc --noEmit` 0 errors, `npm test` — 새로 추가/수정한 테스트 전부
  통과(`src/lib/api`, `src/features/hanok-archive/api`, `src/features/journey-curator`,
  `src/features/visit-review`, `src/features/saved-resources`). 전체 스위트 기준
  실패 6건은 전부 `src/app/sorimaru/backgroundRoutes.test.tsx`와
  `pageContainerPresentation.test.ts`에서 나왔고, 둘 다 이 세션에서 손대지
  않은 파일이며 git 기준으로도 미변경 상태라 이번 작업과 무관한 기존 실패다.

### 실서버로 직접 검증한 실제 응답 shape (2026-09-19 기준, 참고용)

- `GET /api/v1/hanoks?limit=2` → `{schemaVersion, items:[{placeId,name,category,
  regionName,thumbnailUrl,summary,tags,savedByMe}], nextCursor, hasMore}` (2건, seed)
- `GET /api/v1/places/{placeId}` → `{schemaVersion,placeId,name,category,region:
  {regionCode,name},address,coordinates:{lat,lng},images:[{url,alt}],description,
  contentTags,savedByMe}`
- `GET /api/v1/map/places?...` → `{schemaVersion,coverageStatus,language,items:[{
  placeId,name,category,region:{regionCode,name,level,parentRegionCode},
  coordinates:{lat,lng},thumbnailUrl,summary,savedByMe,linkedOdiiStoryIds,
  dataAvailability:{place,observation,odii}}],nextCursor,hasMore}` (2건, seed)
- `GET /api/v1/visit-reviews?scope=ALL` → 3건, 전부 같은 placeholder 문구
  ("비 오는 날 처마 밑에서 쉬기 좋았습니다") — seed 데이터임이 명확함.
- `GET /api/v1/odii/stories` → **503 `SERVICE_UNAVAILABLE`** ("Odii data is
  temporarily unavailable", `retryAfterMs:30000`) — 이 세션 시점에 백엔드 자체가
  이 도메인을 아직 못 띄운 상태. 실제 응답 shape을 확인할 수 없어 FE #91
  repository는 이번 패스에서 만들지 않았다(추측으로 shape을 만들면 나중에
  조용히 틀릴 위험이 커서 보류).

### 2026-09-19 (2차 패스) — Wave 0 잔여 + Wave 1 전체

GitHub Issues #90~#97 본문을 각각 직접 읽고(파싱한 요약이 아니라 실제 이슈
본문의 Scope/Acceptance Criteria/Touch Points를 따랐다) 진행했다.

**[FE #90] 완료 — 이번엔 실제로 화면 데이터 소스까지 바꿨다.**
`hanokArchive.service.ts`/`hanokDetail.service.ts`에 `NEXT_PUBLIC_API_URL`이
있으면 백엔드(`/hanoks`, `/places/{id}`)를 먼저 시도하고 실패 시 기존 TourAPI
경로로 폴백하는 로직을 넣었다(이슈가 원한 정확한 패턴). `/api/tourapi`,
`/api/tourapi/detail` Next.js 라우트는 그대로라 클라이언트 쪽은 안 건드렸다.
**중요**: 지금 `.env.local`에 `NEXT_PUBLIC_API_URL`이 설정돼 있으므로 로컬에서
`/hanok`을 열면 실제로 백엔드 seed 2건(placeholder 이미지 포함)이 뜬다 —
1차 패스에서 만들어 둔 `hanokApi.ts`(별도 client repository, 화면에 미연결)는
이제 이 목적을 이미 서비스 레이어가 대신하므로 남겨는 뒀지만 실질적으로 중복이다.
`npm run generate:api-types`도 이미 실행해 `src/types/api.generated.d.ts` 존재.

**[FE #91] 여전히 보류 — 재시도했지만 503 그대로.** 백엔드 Odii 서비스가
이 세션 마지막까지 `SERVICE_UNAVAILABLE`이었다. 응답 shape을 검증할 방법이
없어 추측으로 구현하지 않았다(추측이 틀리면 오디오 재생이 조용히 깨질 수 있는
도메인이라 위험도가 다른 곳보다 높다). 503이 풀리면 한 번의 curl로 shape을
확인하고 `hanokApi.ts`와 같은 패턴으로 만들 것.

**[FE #92] 완료.** `visitReviewApi.ts`에 `listReviewsByPlace(placeId)` 추가.
신규 `regionResolve.service.ts`(GPS→행정구역, 실서버로 shape 검증됨), 신규
`mapInsights.service.ts`(heatmap/observations, 실서버로 shape 검증됨) 추가.
단, `mapInsights`는 **기존 `visitor.service.ts`의 혼잡도 파이프라인에 연결하지
않았다** — 오늘 날짜로 heatmap을 직접 호출해보니 `coverageStatus: "MISSING",
spots: []`라 지금 연결하면 잘 동작하던 혼잡도 지도가 완전히 빈 화면이 된다.

**[FE #93] API 레이어 완료, UI 훅 연결은 안 함.** `journeyApi.ts`의
`JourneyRepository`에 `applyAction`(PIN/EXCLUDE/PROPOSAL)과
`subscribeToRunEvents`(EventSource 기반, 기존 `journeySseParser.ts` 순수
파서 재사용, 테스트 더블로 검증됨)를 추가했다. **발견**: `useJourneyStore.ts`
(홈 `/`의 실제 여정 탐색 UI)는 `journeyApi.ts`의 `JourneyRepository`를 전혀
쓰지 않는다 — `explorationApi.ts`의 `fetchExplorationBoard`(Gemini+TourAPI
기반, board/candidates 모델)라는 완전히 다른 시스템을 쓴다. 두 시스템이
평행하게 존재하는 상태라, "UI 훅에서 최소한으로 연결"은 하지 않았다 — 지금
잘 동작하는 홈 검색 흐름을 건드리는 게 되기 때문이다. `JourneyRepository`
쪽 SSE/액션을 실제로 쓰려면 먼저 두 시스템을 어떻게 합칠지 결정이 필요하다.

**[FE #94] API 모듈만 완료.** 신규 `journeyThreadsApi.ts`
(list/get/delete, 테스트 포함). 응답 shape은 로그인 세션이 있어야 확인 가능해
검증 못 했다(주석에 명시). mypage 목록/상세 UI는 아직 없음(이슈도 "신규 UI
훅이 필요하다"고 명시 — API 연동 범위를 넘어서는 화면 작업).

**[FE #95] 완료.** 신규 `savedJourneysApi.ts`(list/create/remove/resume).
`useSavedExplorationStore.ts`를 async로 바꿔 백엔드 우선 + 실패 시
localStorage 폴백으로 전환(`saveJourney`/`removeSaved`/`loadSaved`).
`renameSaved`는 대응 백엔드 엔드포인트가 없어 여전히 로컬 전용. 응답 shape은
검증 못 했지만(로그인 필요) 실패 시 항상 localStorage로 떨어지므로 저장 기능
자체는 절대 깨지지 않는다. 소비하는 두 컴포넌트(`JourneySaveButton.tsx`,
`mypage/page.tsx`)는 반환값을 안 쓰고 있어 sync→async 전환이 안전했다.

**[FE #96] API 레이어 완료.** 신규 `moderationApi.ts`. 이 도메인만 유일하게
OpenAPI에 요청 스키마가 문서화돼 있었는데, 회원 세션(cookie/CSRF)이 아니라
기존 운영자 Bearer 토큰 + `X-OnMaru-Operator` 헤더 패턴이었다(이슈의 "csrf:true"
제안과 다름 — 스펙을 더 신뢰했다). 붙일 실제 검수 큐 UI가 아직 없어(이슈도
"신규 호출부는 없다"고 명시) 연결은 안 함.

**[FE #97] 완료.** 신규 `memberApi.ts`(getMyProfile/deleteMyAccount/logout).
`useAuth.ts`의 `logout`/`deleteAccount`가 기존에 잘못된 경로(`/api/auth/me`
등, 실제 백엔드에 없는 경로)를 부르고 있던 걸 실제 계약(`DELETE /members/me`,
`POST /auth/logout`)으로 고쳤다. `logout`이 이제 async가 됐지만 호출부
(`mypage/page.tsx`의 `onClick={logout}`)는 반환값을 안 써서 안전했다.
`getMyProfile()`은 만들었지만 mypage 프로필 표시를 이걸로 바꾸진 않았다
(지금은 로그인 시 저장해 둔 로컬 `user` 상태를 그대로 씀).

**검증**: `npx tsc --noEmit` 0 errors. `npm test` 157 passed / 6 failed —
실패 6개는 전부 `backgroundRoutes.test.tsx`/`pageContainerPresentation.test.ts`
(이번 세션에 손대지 않았고 git 기준 미변경 — 완전히 무관한 기존 실패, 세션
시작 전부터 있었음). 새로 만든 파일들은 대상 지정 eslint로 개별 확인,
내가 도입한 `any`/미사용변수는 전부 고쳤고, 기존에 있던 `any`(예:
`client.ts`, `hanokDetail.service.ts`의 원래 TourAPI 매핑 코드)는 건드리지
않았다(리팩터링 범위 밖).

**남은 것 요약**: FE #91(백엔드 503으로 진짜 블록), 그리고 이번에 만든
API 모듈들의 "실제 화면 UI 연결"(journey-threads 히스토리 화면, moderation
큐 화면, mypage 프로필 백엔드 전환, journeyApi.ts 액션/SSE를 실제 홈 검색
흐름과 합치는 결정) — 전부 "API 관련 작업"의 핵심(레포지토리+테스트+실서버
계약 검증)은 끝났고, 남은 건 그 위에 새 화면을 얹거나 기존 화면의 데이터
소스를 스위치하는 UI 작업이다.

Current work:
- Sorimaru expanded-player UI/UX & motion refinement:
  - Implemented one-shot cinematic staggered entrance animation for expanded transcript view (title -> subtitle -> hashtags -> entire transcript block).
  - Consolidated line-by-line staggered motion into an atomic whole-container slide-up & fade-in for smooth visual balance.
  - Managed modal session animation flags so internal tab switching (`roadview` <-> `transcript`) stays instant and seamless without re-triggering sub-element staggers, while re-opening the modal resets and runs the 1-time entrance animation.
  - Re-positioned roadview to top, expanded bottom transcript scroll area, removed background/borders for transparent elegance, and polished audio slider width.
- Scroll Reveal & Reload Protection: Updated `VesselReveal` and `vesselRevealState.ts` so sections bloom once on downward scroll (`0.96 -> 1.0`), permanently stay bloomed during upward scroll or viewport exit without folding or replaying, render immediately in final state on page reload without layout shift, and disconnect observers upon reveal for zero CPU overhead. Documented in `src/shared/components/animation/README.md`.
- GNB & Mobile Navigation refinement: Replaced liquid spring morphing (`layoutId`) across desktop header and mobile bottom tabs (`Header.tsx`, `GlobalMobileTabs.tsx`) with refined, stable glassmorphic capsule active styles.
- Sorimaru UI & Motion polish: Removed inner component slide-up animations inside Sorimaru sections (`SorimaruAudioFeature.tsx`) to prevent double entrance animations with `VesselReveal`, fixed constellation map section (`SoundConstellationSection.tsx`) motion context propagation, and resolved indicator bar clipping.
- Odii transcript refinement: long API narration is now split into sentence
  cues and rendered in three-sentence numbered listening segments. The large
  white quote card is removed; playback keeps only the active sentence at full
  opacity while surrounding sentences remain at 60%.
- Odii expanded-player redesign implemented: the player now presents one
  complete neutral transcript panel,
  60%-opacity inactive lines, active-line centering, direct line seeks, and
  an image/Roadview media frame. The redundant current-status badge and full
  transcript action are removed from the active player flow. Up to seven
  stable tags are rendered from API tags plus available story metadata.
  Focused Vitest (5 tests), TypeScript, and production build passed. Repository
  lint remains blocked by 80 pre-existing errors outside this change.
- Odii expanded-player redesign is specified for this session: replace the
  separate transcript preview/full-view flow with one readable scroll panel;
  center the currently playing line with a reduced-motion-safe transition;
  dim inactive lines to 60%; remove the redundant status badge and full-view
  action; add up to seven normalized content tags; retain Roadview with an
  equal-size image fallback; use a light neutral transcript surface with
  readable contrast; and give media, metadata, controls, and
  transcript rows dimension-matched neutral skeletons. This work is ready for
  PR review against `develop`.
- Hanok reading-flow motion: the regional distribution now uses one-shot GSAP `scaleX` bars with synchronized count-up values; the detail modal uses its own scroll container to focus the centered history paragraph while dimming surrounding paragraphs. Reduced-motion users receive the final readable state immediately.
- Hanok monthly layout stability: the monthly feature now reserves its final responsive height before hydration, preventing the distribution chart from flashing in its space and then being pushed below the viewport.
- Hanok distribution stability: live `/api/tourapi` payloads without regional data no longer replace the complete local snapshot, preventing the chart below “이달의 픽” from appearing briefly and then disappearing.
- Sorimaru playback data fix: the public base-list endpoint currently returns metadata rows with no `audioUrl`, so initial listening content now uses the playable `한옥` story search. The adapter excludes media-less rows and the store rejects them as a final guard. Verified against the live API: the themed search returns playable URLs.
- Verified after the playback fix: `npx tsc --noEmit` and the focused Sorimaru API/initial-load Vitest suite pass.
- Sorimaru player UX pass: the expanded drawer preserves page position while locking background scroll, contains touch overscroll, and uses a Roadview canvas that relayouts responsively. `npx tsc --noEmit` passes.
- Expanded-player layout: at 768px and above, Roadview and playback controls occupy the left column while the synchronized transcript is a scrollable right column; mobile keeps the same reading order vertically.
- Saved sounds: the expanded player now has a heart button. It shares one persisted store with the "saved sounds" drawer, so saved and removed items update immediately.
- Audio-reactive visual layer: Web Audio analyser data now drives a GSAP aura over Roadview while playback is active. The animation only mutates transform and opacity and honors reduced motion.
- Sorimaru motion pass: hero media now has restrained GSAP parallax and ink-like reveal; story cards reveal with one staggered, reduced-motion-safe GSAP sequence.
- Summary: Added an FE-visible backend `toFE` implementation status note.
  - Document: `docs/specs/TOFE_IMPLEMENTATION_STATUS.md`
  - Captures implemented FE foundation, remaining Journey/VisitReview/saved-place/timeline gaps, and exact backend specs that should be resent before final integration.
- Summary: Fixed the Onmaru landing header surface in light mode.
  - Root cause: `Header` treated the `/` landing hero as a dark surface based only on route/scroll state, even when the applied theme was `light`.
  - Added `src/shared/components/Header/headerSurface.ts` to make the rule explicit: landing dark surface is used only when the applied theme is `dark`.
  - Added regression coverage for light-mode landing and dark-mode landing behavior.
- Summary: Made theme mode selection explicit for logged-in and logged-out users.
  - Added `src/design-system/themePreferenceLabels.ts` so `system` is shown as `자동` while keeping the persisted value compatible.
  - Updated the global header theme button to open an `자동` / `라이트` / `다크` picker instead of cycling modes blindly.
  - Updated the `/map` desktop rail theme control with the same picker because the global header is hidden there.
  - My Page's existing `ThemeModeSwitch` now uses `자동` wording and avoids the monitor icon.
- Summary: Updated `system` theme resolution to use local time of day.
  - `src/design-system/timeTheme.ts` resolves 07:00-18:59 to light and 19:00-06:59 to dark.
  - `ThemeProvider` and the initial `beforeInteractive` theme script now use the same time-aware rule to avoid first-paint mismatch for automatic mode.
  - Explicit user selections for `light` or `dark` remain respected.
  - Verified: focused time theme test, `npx tsc --noEmit`, `npm test` (45 files, 135 tests), `npm run check:env`, and `npm run build` passed.
- Summary: Added local and CI controls to prevent Odii/Sorimaru env alias regressions.
  - `.env.local` remains ignored, while `.env.example` is explicitly unignored and tracked as a safe template.
  - Added `npm run check:env` via `scripts/validate-env-contract.mjs` to validate Odii key aliases, `.gitignore` env rules, and accidental tracked secret env files.
  - Wired the same check into `.githooks/pre-push` and `.github/workflows/env-contract.yml`.
  - Verified: `npm run check:env`, focused validator tests, `npx tsc --noEmit`, `npm test` (42 files, 131 tests), and `npm run build` passed.
- Summary: Re-mapped the backend feature delta into the existing product surfaces without changing established UI.
  - Home `/` remains the real journey search surface. `fetchCuratedJourney` now uses the backend journey repository and authoritative snapshot board when `NEXT_PUBLIC_API_BASE_URL` is configured, while preserving the existing local `/api/journey-curator` fallback for local/dev mode.
  - `/discover` now redirects to `/` so there is no second journey UI.
  - `/map` warmth mode remains the owner of "여행자들이 남긴 온기 이야기". Server VisitReview data is converted into the existing `Warmth[]` model so current region/category/sort UI keeps working.
  - Removed the mistakenly placed VisitReview panel from `/map` info mode.
  - Map place rows now use the canonical saved-place button, including guest Kakao-login save intent capture and optimistic logged-in save/unsave.
  - `/mypage` now includes the monthly member timeline surface backed by the server timeline repository.
  - Auth logout/account deletion now clears private local/session state, including pending saved-resource intents.
  - Verified after remap: `npx tsc --noEmit` passed, `npm test` passed (44 files, 133 tests), `npm run build` passed, and local dev routes `/`, `/map`, `/mypage` returned HTTP 200 while `/discover` returned 307 to `/`.
  - Dev server: running at `http://localhost:3000`.
- Note: Hanok/Odii place-save buttons are ready through the shared saved-resource repository/component, but full per-card wiring still depends on those surfaces exposing the backend canonical `placeId` in their view models rather than legacy TourAPI/Odii identifiers.
- Summary: Implemented backend feature delta foundation from the spec using TDD and `frontend-senior-engineer` boundaries.
  - Added contract-aware API foundation: normalized errors, cursor guard, in-memory CSRF provider, cookie/idempotency `apiRequest`, and compatibility helpers.
  - Added pure journey SSE parser/reducer for stage, heartbeat, terminal, reset, snapshot recovery, and BASELINE labeling.
  - Added VisitReview contract validation and stale region response reducer.
  - Added saved `PLACE` guest intent store with injected storage/clock and member timeline contract helpers.
  - Added shared place-slip motion primitive for transform/opacity-only reveals with reduced-motion behavior.
  - Verified: focused foundation tests passed (6 files, 12 tests), `npx tsc --noEmit` passed, `npm test` passed (35 files, 119 tests before final docs-only update), `npm run build` passed.
- Next step: implement Phase 2 UI wiring for `/discover` or continue with `/map` VisitReview container integration, using the new foundation modules.
- Summary: Added implementation plan for the backend feature delta foundation, scoped to typed API/CSRF/cursor/error contracts, journey SSE reducer, VisitReview reducer, saved intent/timeline contracts, and the place-slip motion primitive.
- Plan: `docs/superpowers/plans/2026-09-14-backend-feature-delta-foundation.md`
- Summary: Captured backend-to-FE feature delta design spec for `/discover` REST+SSE journey runs, `/map` VisitReview, shared canonical place saves, My Page monthly timeline, auth/CSRF/cache rules, neutral motion design, and frontend performance constraints.
- Spec: `docs/superpowers/specs/2026-09-14-backend-feature-delta-fe-design.md`
- Source backend docs: `/Users/yangseunghyeon/Development/OnMaru/OnMaruBE/docs/toFE`
- Next step: review/approve the spec, then create a detailed implementation plan before touching feature code.
- Map page (`/map`) logo.png insertion and comprehensive dark mode compatibility:
- 전국 한옥 수결첩(手決帖) 스탬프 시스템 및 지도 인터랙티브 효과 구현 완료:
  - 수결첩 시스템: `src/features/stamp/` 모듈, `/stamps` 라우트, 상세창 체크인 연동, 도장 연출 모달, 8도 SVG 지도, 랭킹 리더보드.
  - 지도 인터랙티브: 금빛 커서 잔상 트레일, 핀 클릭 Ripple 및 Glow Ring, 방문 한옥 뱃지 (하단 뽀글거리는 파티클 레이어 제거).
  - 지도 축소 마커 겹침 해결: `PIN_MAX_LEVEL = 6` 및 시·군·구 스마트 클러스터링(`om-cluster-pill`), 뱃지 핀 불투명 화이트 적용 및 불필요한 별무리 제거.
  - 모드 토글 정제: 라이트 모드 화이트 필 적용 및 온기 옆 붉은 점 제거.
  - 검증: `npx tsc --noEmit` 0 errors 통과, 브라우저 서브에이전트로 모드 전환, 핀 클릭, 인장 획득, 수결첩, 축소 클러스터링 전체 경로 시각 검증 완료.
  - Navigation Rail (`MapNavRail.tsx`): Replaced text script brandmark with `/logo.png` (36x36 contain, rounded 10px). Added a dedicated theme toggle button (Sun/Moon) synced with `useOnmaruTheme()`.
  - Comprehensive Dark Mode styling across all map components:
    - Map viewport & canvas (`KakaoMap.tsx`): Synchronized map moonlight filter (`isNight`) with `useOnmaruTheme()` mode, added dark mode styling for controls stack, control buttons, and research button.
    - Side panels: `ListPanel.tsx`, `SearchBar.tsx`, `ModeToggle.tsx`, `PlaceList.tsx`, `PlaceListItem.tsx`, `DetailPanel.tsx`, `PlaceDetail.styles.ts`, `PopularPlacesPanel.tsx`, `WarmthFeed.styles.ts`, `BottomSheet.tsx`.
    - Feed sections: `SmartAroundFeed.tsx`, `FestivalExhibitionCarousel.tsx`, `SorimaruSpotlightBanner.tsx`, `LiveNoticeBanner.tsx`.
  - Verification: `npx tsc --noEmit` passed (0 errors), browser subagent verified light mode and dark mode transitions (all side panels, controls, and detail cards render in luxury dark mode `#1C1A17`/`#2D2924`).
- Summary:
  1. Restored Section 2 ("장면을 따라 걷는 소리") horizontal gutters by wrapping it in `CenteredContainer` (`max-width: 72rem`, `padding: 0 1rem` to `2rem`) matching Section 3 and 4.
  2. Implemented full dark mode (`[data-theme='dark']`) support across all 12 components in `src/features/sorimaru-audio`.
  3. Completely removed horizontal hanji tear lines (`HanjiTearTransition` returns null, tags removed) to eliminate artificial dot/strip artifacts and let sections breathe with negative space and smooth atmospheric backgrounds.
  4. Added vertical hanji deckle edge frame to Hanok Maru (`/hanok`) via new shared Emotion component `<HanjiDeckleEdge />` (`src/shared/components/HanjiDeckleEdge`).
  5. Removed protruding horizontal deckle fiber needle lines (`LEFT_DECKLE_FIBERS`, `RIGHT_DECKLE_FIBERS`) and grid / graph-paper pattern (창호 격자 모눈종이 효과) from background.
  6. Migrated all 26 components in `src/features/sorimaru-audio` to Emotion CSS and purged Tailwind CSS from the codebase.
  7. Verified: `npx tsc --noEmit` clean (0 errors), all 45 sorimaru tests passed, `npm run build` verified.
- Branch: `feat/hanok-dogam-2`
- Related: PR #71 targeting `develop`.
- Summary:
  1. Created new branch `feat/hanok-dogam` from clean `develop`.
  2. **Font**: `globals.css` body `font-family` → `var(--font-hanok)` (Spoqa Han Sans Neo). CDN import already present from prior session.
  3. **Font weights**: Reduced all `font-weight: 600/700` in `src/hanok/**` to 300–500 range. Affected files: `HanokHero.tsx`, `VillageCard.tsx`, `ArchiveNav.tsx`, `PolaroidCard.tsx`, `HanokManifestoCta.tsx`, `HanokMonthly.tsx`, `HanokStayAccordion.tsx`, `HanokArchive.tsx`, `VillageDetailModal.styles.ts`.
  4. `npx tsc --noEmit`: passed (no errors).
- Summary: /map page navigation-bar transition improvements.
  1. Fixed the bottom nav "jump" when navigating to `/map` from `/hanok` or `/odii`: `Header` now stays mounted and its mobile tab bar crossfades content (`GlobalMobileTabs` ↔ `MapMobileTabs`) inside the same fixed shell, instead of hard-swapping two differently-positioned/sized components.
  2. Desktop `/map` entrance choreography: GNB flips away with a 3D `rotateX` (calendar-page style, `backface-visibility: hidden`, weighted easing curves) while `MapNavRail` slides in from the left simultaneously; the floating list/detail panel then springs in; the category chip bar (`MapChips`) rises in last. All timing lives in `src/shared/navigation/mapEntranceTiming.ts`.
  3. `MapNavRail` redesigned as a slim floating glass capsule (60px wide, 14px inset, matching the GNB's capsule visual language) replacing the old 68px flush opaque sidebar; removed the redundant chevron/dropdown on its 지도 item (`ModeToggle` already covers info/warmth switching).
  4. `MapChips` repositioned/resized to align with the GNB's position and height (`HEADER_HEIGHT` exported from `Header.tsx`); chip pills shrunk slightly.
  5. Added an `AGENTS.md` policy: agents must not create a PR or merge on their own after finishing dev work — always get the user's final approval first.
- Branch: `feature/map-page-navigation-bar-improvements`
- Related: Issue #48 / PR #49 (already merged into `develop`) redesigned the GNB into a slim floating capsule; this branch's `Header.tsx` changes build on top of that merged design rather than conflicting with it — `develop` was merged into this branch at commit `4a0556b`.
- Recent fixes:
  1. Dark Mode White Flash on Reload:
     - Added synchronous theme `<script>` in `<head>` (`src/app/layout.tsx`) to set `<html data-theme="dark">` immediately before browser first paint based on `localStorage` and `prefers-color-scheme`.
     - Eager `mode` initialization in `src/design-system/ThemeProvider.tsx`.
     - Added comprehensive `@media (prefers-color-scheme: dark)` rules across `CategoryChips.tsx`, `FloatingHomeButton`, `MoreButton`, and `OverflowPanel`.
  2. Category Chips Width Jitter & `...` Folding on Reload:
     - On desktop (`align === 'end'`), pinned `visibleCount` to `items.length` so all 8 categories are rendered immediately and stably without collapsing into `...`.
     - Set `GAP = 6px` and chip padding to `0 11px`.
     - Removed dynamic width collapsing animation from `ChipWrap`, eliminating layout jitter on page reload.
  3. ListPanel Initial Mount Transition:
     - Disabled `transition: width 0.28s` during initial mount in `src/map/components/ListPanel.tsx` using `$mounted` flag to prevent initial reflow on reload.


Touched files:
- `src/shared/components/Header/Header.tsx`
- `src/shared/components/Header/GlobalMobileTabs.tsx`
- `src/map/components/MapMobileTabs.tsx`
- `src/map/components/MapNavRail.tsx`
- `src/map/MapPage.tsx`
- `src/map/components/CategoryChips.tsx`
- `src/map/components/ListPanel.tsx`
- `src/app/layout.tsx`
- `src/design-system/ThemeProvider.tsx`
- `src/shared/navigation/mapEntranceTiming.ts`
- `AGENTS.md`

Verified this session:
- `npx tsc --noEmit`: passed cleanly (code 0).
- Reload stability on dark mode confirmed.


PR prep 2026-09-10:
- Branch: `hotfix/odii-page` targeting `develop`.
- Related Issues for PR reference: #62 and #64 because this fixes map/ODII regressions after the Lucide migration.
- Do not close #68 or #69 from this PR; they remain follow-up UI/theme work.

Next step:
- User verification of reload behavior and dark mode appearance on `/map`.
- 지도 카테고리 칩은 PR #66의 가로 스크롤 수축 동작을 유지하면서, mask로 그림자가 잘리는 문제를 제거하고 둥근 pill 스타일/진입 애니메이션을 복원했다. 현재 아이콘은 lucide-react 기준을 유지한다.

## 2026-09-15 — 한옥 도감 AI 장소 해설

- `도감 해설 보기` 상세 모달의 주소 아래에 `이 장소에 얽힌 이야기` 패널을 추가했다.
- 서버 전용 `/api/hanok/story`가 Gemini Google Search grounding을 사용해 장소명·주소가 일치하는 공개 자료를 조사하고, 역사 요약·시간의 층위·현장 관찰 포인트·클릭 가능한 출처를 반환한다.
- API 키 또는 검색 결과가 없을 때는 사실을 만들어내지 않고 기존 TourAPI/도감 설명으로 돌아간다.
- 로딩 패널은 최종 패널과 같은 최소 높이를 확보하고 중립 회색 스켈레톤을 사용한다.
- 프로세스 메모리에서 장소별 결과를 24시간 캐시하며 최대 80개를 유지한다.
- 도감/숙소 상세 모달이 존재하지 않는 `/api/village/:id`를 호출하던 문제를 실제 `/api/tourapi/detail?id=...` 엔드포인트로 수정해 기존 TourAPI 설명도 다시 로드되게 했다.

## 2026-09-15 — 테마 버튼 hydration 불일치 수정

- `ThemeProvider`의 서버 렌더와 첫 클라이언트 렌더가 모두 `defaultMode`에서 시작하도록 통일했다.
- localStorage 테마, 로컬 시간, 시스템 테마는 hydration 이후 animation frame에서 반영해 헤더 버튼의 label과 Emotion class 불일치를 제거했다.
- 초기 effect가 `beforeInteractive` 테마를 SSR 기본값으로 덮어쓰지 않도록 보호해 다크 모드 첫 화면도 유지했다.
- 모바일 지도 폭 감지도 서버와 동일한 초기값에서 시작하도록 정리했다.
- 헤더 표시값에도 `useSyncExternalStore`의 서버 스냅샷을 적용해 Fast Refresh가 Provider 상태를 보존한 경우에도 hydration 시 버튼 속성과 Emotion class가 항상 `자동/라이트` 기준으로 일치하게 했다.

## 2026-09-15 — AI 해설 주소 오인 및 Gemini 모델 수정

- 도감 `summary`에 들어 있던 주소를 AI 해설 폴백으로 사용하지 않도록 제거했다.
- TourAPI 상세 설명 로딩이 끝난 뒤 해당 설명만 Gemini 컨텍스트로 전달하며, 주소형 텍스트는 서버에서도 다시 차단한다.
- Gemini 모델 후보를 현재 키가 노출하는 `gemini-3.8-flash` → `3.7-flash` → `3.6-flash` 순서로 갱신했다.
- 현재 로컬 키는 정상 인식되지만 Gemini API가 429 할당량 응답을 반환한다. 할당량 회복 전에는 TourAPI 설명 또는 명시적인 재시도 안내를 표시한다.
- 유효한 도감 `summary`는 다시 공공 기록 해설로 활용하고, 주소형 summary만 서버에서 제외한다. 공공 설명이 있으면 실패/재시도 문구와 일반적인 관찰 포인트를 노출하지 않는다.
- 라이브 목록 응답이 `summary`에 주소만 제공하더라도 같은 ID의 정적 스냅샷 설명을 병합해 보존한다. 카드와 AI 패널 모두 주소 대신 실제 도감 설명을 받는다.

## 2026-09-15 — AI 해설 모바일 가로 잘림 수정

- 상세 모달의 가로 overflow를 숨기고 AI 패널에 `min-width: 0` 경계를 추가했다.
- 긴 AI 요약·연혁·관찰 포인트는 한국어 어절 줄바꿈을 유지하면서 필요한 경우 안전하게 줄을 바꾼다.
- 타임라인 콘텐츠 열을 `minmax(0, 1fr)`로 바꿔 긴 문장이 모달을 밀지 않게 했다.
- 출처 링크는 모바일에서 한 줄 너비를 사용하며 긴 제목은 말줄임 처리한다.
- 추가 보강: 560px 이하에서는 연혁을 완전한 세로 구조로 전환하고, 출처 제목도 말줄임 없이 여러 줄로 표시한다. 모달 Body의 모든 직계 자식에 최대 너비를 강제했다.
- 사용자 정정에 따라 데스크톱을 포함한 모든 화면에서 AI 해설 헤더, 연혁의 시대/설명, 출처를 한 열로 쌓도록 변경했다.
- AI 결과 전체를 전용 `StoryContent` 단일 열 Grid로 감싸 요약·연혁·관찰 포인트·출처의 가로 배치를 구조적으로 차단했다.

## 2026-09-15 — 상세 사진 확대 duplicate key 수정

- 도감 태그에서 빈 문자열을 제거하고 중복 값을 합쳐 사진 확대 상태 변경 시 `key=""` 충돌이 발생하지 않게 했다.
- 도감/숙소 갤러리 URL도 trim 후 빈 값 제거와 Set 중복 제거를 적용했다.
- 실제 남은 원인은 `AnimatePresence` 안에서 동시에 렌더되는 상세 Overlay와 LightboxOverlay가 둘 다 key가 없던 것이었다. 도감/숙소 각각의 두 오버레이에 명시적인 고유 key를 추가했다.
