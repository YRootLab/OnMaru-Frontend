# 백엔드(Spring/Java) 전달 사항 — 이야기길 실데이터 연동

작성일: 2026-09-16. 상태: FE가 Java 서버 연결 전까지 자체 구현한 stand-in 기록. Spring 서버가 준비되면 이 문서를 기준으로 교체 작업을 진행한다.

공식 계약(필드명·타입)의 source of truth는 여전히 [`seven-day-mvp-fe-handoff.md`](seven-day-mvp-fe-handoff.md)와 [`fe-experience-api-implementation-report.md`](fe-experience-api-implementation-report.md)다. 이 문서는 그 계약과 지금 FE가 실제로 돌리고 있는 stand-in 구현 사이의 차이점만 기록한다.

## 1. 지금 FE가 무엇으로 Spring/FastAPI를 대신하고 있는가

Spring·FastAPI가 아직 없어서 FE가 Next.js API route(`src/app/api/journey-curator/explore/route.ts`)에서 TourAPI + Gemini를 **직접** 호출해 `JourneyBoard`와 같은 모양의 응답을 만들고 있다.

- run/poll 상태 머신이 없다. `POST` 한 번으로 검색·선정·근거·거리 계산까지 동기로 끝낸다(`AcceptedRun`/`RunSnapshot` 폴링 없음).
- 브라우저가 이 route를 직접 호출한다 — "브라우저는 Spring만 호출한다" 원칙을 임시로 어기고 있는 상태다. Spring이 준비되면 이 route는 삭제하고 `POST /api/v1/explorations` + `GET /api/v1/explorations/{id}/runs/{runId}`로 교체한다.
- `regionCode`를 받긴 하지만 실제로는 쓰지 않는다(`'JONGNO'` 포함 여부만 확인). 지역 판별은 사용자 질문 문자열에서 알려진 지명 키워드를 찾는 방식(`extractKeyword`)이라 정교하지 않다.

## 2. 지금 실제로 동작 중인 요청/응답 모양

```http
POST /api/journey-curator/explore
{
  "query": "서촌에서 한옥과 역사 이야기를 조용히 만나고 싶어",
  "regionCode": null
}
```

```json
{
  "board": { "...": "JourneyBoard, seven-day-mvp-fe-handoff.md §12와 동일 필드" },
  "aiGenerated": true,
  "hanokDogan": [ { "placeId": "...", "overview": "...", "usetime": "...", "restdate": "...", "images": ["..."], "homepage": "..." } ],
  "nearbyAudio": [ { "stid": "...", "title": "...", "audioTitle": "...", "audioUrl": "...", "distance": "1.1km", "formattedDuration": "3분 31초", "imageUrl": "...", "locationName": "..." } ],
  "nearbyFood": [ { "id": "...", "title": "...", "addr": "...", "image": "...", "distanceMeters": 308 } ]
}
```

`board`의 타입은 `src/features/journey-curator/types/exploration.types.ts`에 있고, handoff 문서 §12/§7과 필드명이 완전히 같다. 실패 시 `{ error: { code, message, retryable, traceId, details } }`를 반환한다 — `ErrorEnvelope`와 동일한 모양.

## 3. 공식 계약에 없는 것 3개를 추가로 구현함 (사용자 요청, 2026-09-16)

`hanokDogan`, `nearbyAudio`, `nearbyFood`는 `seven-day-mvp-fe-handoff.md`/`fe-experience-api-implementation-report.md` 어디에도 없다. 사용자가 이번 세션에서 직접 요청해서 화면(`/discover` = `/`)에 이미 붙어 있다.

- **한옥 도감**: 선택된 각 장소의 TourAPI `detailCommon2` 결과(overview, usetime, restdate, images). `HanokDetailService.getHanokDetail(contentId)` 재사용.
- **오디오 해설 미리듣기**: 첫 번째 선택 장소 좌표 기준 한국관광공사 오디(Odii) LBS API. `sorimaruApiAdapter.getNearbyStories(mapX, mapY, radius)` 재사용, `audioUrl`이 있는 것만 필터링.
- **근처 맛집**: 첫 번째 선택 장소 좌표 기준 TourAPI `locationBasedList2`(contentTypeId=39, radius=800m), Haversine으로 실제 거리 계산.

**Spring 연결 시 결정할 것**: 이 3개를 어디서 소유할지.
- (a) Spring이 대신 호출해서 board 응답에 얹는다 — "브라우저는 Spring만 호출" 원칙과 일치. 권장.
- (b) FE가 계속 직접 호출한다 — 브라우저가 TourAPI/오디 API 키를 알아야 하므로 비권장.

## 4. 이번에 고친 TourAPI/오디 API 함정 2개 (Spring도 그대로 겪을 수 있음)

둘 다 기존 코드(이 세션 이전부터 있던 코드)의 버그였고, 원인을 찾아 고쳤다. Spring에서 같은 오퍼레이션을 호출할 때 동일한 함정을 피하도록 남긴다.

1. **TourAPI `detailCommon2`**: `overviewYN`/`addrinfoYN`/`mapinfoYN` 같은 최적 필드 플래그를 붙이면 이 서비스키 등급에서 `INVALID_REQUEST_PARAMETER_ERROR`가 난다. **플래그 없이 `contentId`만 보내도 `overview`/`addr1`/`mapx`/`mapy`가 기본으로 포함된다.** (`src/features/hanok-archive/services/hanokDetail.service.ts`에서 수정 완료)
2. **한국관광공사 오디(Odii) `storyLocationBasedList`**: 공식 문서와 달리 좌표 파라미터명이 `xCoord`/`yCoord`가 아니라 **`mapX`/`mapY`**여야 한다. 틀린 이름으로 보내면 `NO_MANDATORY_REQUEST_PARAMETERS_ERROR1(mapX)`가 나며 조용히 빈 배열만 돌아온다(에러가 아니라 "결과 없음"처럼 보여서 발견하기 어려웠다). `numOfRows`/`pageNo`도 함께 보내는 게 안전하다. (`src/features/sorimaru-audio/api/sorimaruNetwork.ts`에서 수정 완료)

## 5. `distanceBand` 임계값 — 아직 가안

```
NEAR   < 300m
MEDIUM < 800m
FAR    >= 800m
```

`seven-day-mvp-fe-handoff.md` §7이 요구하는 "Day 1 파일럿 좌표로 동결"이 아직 안 된 상태다. 실제 서촌 좌표 분포를 보고 다시 정하거나, 이 값을 그대로 채택할지 결정 필요.

## 6. 저장(Saved Journeys) — FE가 의도적으로 보류 중

- 카카오 로그인 + `POST/GET /saved-journeys`는 `seven-day-mvp-fe-handoff.md` §7, §11 계약대로 필요하다.
- FE는 지금 새 `JourneyBoard`용 저장 버튼을 **만들지 않았다.** localStorage로 임시로 만들면 Spring 연결 시 그대로 버리고 다시 만들어야 해서, Spring의 인증·저장 계약이 나올 때까지 대기하기로 사용자와 합의했다(2026-09-16).
- 옛 `BentoJourneyPlan`용 저장(`useSavedJourneyStore`, localStorage, 로그인 여부와 무관하게 동작)은 마이페이지에 여전히 남아 있지만 새 board 타입과는 연결돼 있지 않다.

## 7. FE가 로컬로 갖고 있는 키 (Spring도 같은 것 필요)

- `TOUR_API_KEY` 계열 (한국관광공사 TourAPI)
- `NEXT_PUBLIC_ODII_API_KEY` / `NEXT_PUBLIC_ODII_API_URL` (한국관광공사 오디)
- `GEMINI_API_KEY`

실제 키 값은 이 문서에 적지 않는다. 배포 시 키 이관 방식(Spring이 직접 보관 vs. 별도 secret manager)은 따로 협의해야 한다.

## 8. 지금 화면 구조 (참고용 — Spring 계약과 무관하게 이미 반영됨)

`/`(= `/discover`, `/discover`는 `/`로 redirect)에서 검색하면 순서대로:

1. `JourneyFlowRailSection` — 후보 최대 3개 가로 rail (공식 계약)
2. `JourneyEnrichmentSections` — 한옥 도감 / 오디오 해설 미리듣기 / 근처 맛집 (이번에 추가한 3종)
3. `JourneyRefineBar` — 수정 요청 입력

옛 `BentoJourneyGrid`(Gemini가 온기·혼잡도까지 통째로 지어내던 4카드 컴포넌트)는 화면에서 뺐다. 파일은 지우지 않고 남겨뒀다.
