# 소리마루 목록·상세 분리와 커서 페이징 설계

## 목표

소리마루 카드 12개를 표시하기 위해 목록 API 한 번만 호출한다. 목록 응답의 summary만으로 모든 카드를 렌더링하고, `audioUrl`과 transcript가 필요한 상세 API는 사용자가 특정 카드를 선택하거나 재생을 요청할 때 그 story 한 건에 대해서만 호출한다.

목록의 다음 페이지는 백엔드가 반환한 `nextCursor`와 `hasMore`를 그대로 사용한다. 프론트에서 page number를 API 파라미터로 변환하거나 다음 cursor를 추측하지 않는다.

기존 UI, 레이아웃, 애니메이션과 사용자 문구는 변경하지 않는다. mock, public ODII fallback 또는 seed 데이터로 백엔드 장애를 정상 데이터처럼 보이게 하지 않는다.

## 확인한 백엔드 계약

2026-09-27 배포 OpenAPI와 실응답에서 다음 계약을 확인했다.

- 목록: `GET /api/v1/odii/stories`
  - 지원 query: `language`, `category`, `regionCode`, `limit`, `cursor`
  - 응답: `items`, `nextCursor`, `hasMore`와 coverage·language metadata
- 상세: `GET /api/v1/odii/stories/{storyId}`
  - 지원 query: `language`
- 지역 집계: `GET /api/v1/odii/regions`
  - 지원 query: `language`
  - 응답 group: `label`, `regionCodes`, `storyCount`

`keyword`, `pageNo`, `numOfRows`와 `/api/stories/nearby`, `/api/stories/themes`는 위 백엔드 목록 계약에 포함되지 않으므로 요청하지 않는다. 기존 UI의 검색어나 테마 이름을 검증되지 않은 category 값으로 전송하지 않는다. 서버가 반환한 category와 region code만 서버 query에 사용하며, 지원되지 않는 화면 검색은 이미 받아 온 summary 범위에서만 수행한다.

## 모델 분리

### `SorimaruStorySummary`

목록 응답과 카드 표현에 필요한 필드만 가진다.

- `storyId`
- `title`
- `audioTitle`
- `category`
- `region`
- `coordinates`
- `durationSeconds`
- `imageUrl`
- `linkedPlaceId`
- `contentTags`
- `savedByMe`

summary에는 `audioUrl`, transcript, script를 넣지 않는다. 목록 노출 가능 여부는 유효한 `storyId`와 카드에 필요한 최소 metadata로 판단하며 `audioUrl` 존재 여부로 필터링하지 않는다.

### `SorimaruStoryDetail`

summary 필드를 포함하고 다음 상세 전용 필드를 추가한다.

- `audioUrl`
- transcript 또는 script
- 백엔드가 실제 상세 응답으로 제공하는 추가 필드

플레이어와 자막 파서는 detail만 받는다. 카드, 캐러셀, 아카이브 목록과 지도 우측 목록은 summary만 받는다.

## repository와 application 경계

소리마루 repository는 세 가지 read operation만 외부에 제공한다.

1. `listStories(query): Promise<SorimaruStoryPage>`
2. `getStoryDetail(storyId, language): Promise<SorimaruStoryDetail>`
3. `listRegionGroups(language): Promise<SorimaruRegionGroups>`

`SorimaruStoryPage`는 `items`, `nextCursor`, `hasMore`를 가진다. 기존 `pageNo`, 추정 `totalCount`와 public API source 구분은 제거한다.

repository는 공통 `apiRequest`를 사용해 OnMaru backend만 호출한다. 오류를 `{ items: [], totalCount: 0 }`으로 바꾸지 않고 호출자에게 전달한다. transport payload 검증 실패도 error로 처리한다.

## 목록 요청과 커서 페이징

최초 진입 요청은 다음 한 번이다.

```text
GET /api/v1/odii/stories?language=ko-KR&limit=12
```

응답의 12개 summary는 다음 소비자가 공유한다.

- 첫 화면 archive 카드
- hero 카드 7개
- 좌표가 없는 주변 이야기 fallback
- 동일 조건을 사용하는 다른 섹션

다음 페이지는 마지막 성공 응답의 `nextCursor`가 있고 `hasMore=true`일 때만 요청한다.

```text
GET /api/v1/odii/stories?language=ko-KR&limit=12&cursor={nextCursor}
```

cursor별 응답은 중복 storyId를 제거해 기존 목록 뒤에 추가한다. 다음 페이지 요청 한 번당 목록 HTTP 요청도 정확히 한 번이며, 추가된 item 수와 관계없이 상세 요청을 실행하지 않는다.

현재 UI가 page number를 표시해야 한다면 presentation 상태에 `cursorByPage`를 유지한다. 이미 방문한 페이지는 메모리 결과를 재사용하고, 아직 cursor가 없는 임의의 미래 페이지로 건너뛰지 않는다. API에는 page number를 보내지 않는다.

### 무한 캐러셀과 API 페이징 분리

무한 캐러셀은 현재 메모리에 로드된 summary 집합만 원형으로 반복한다. 예를 들어 현재 17개가 로드되어 있다면 그 17개 안에서만 앞뒤로 순환한다. 캐러셀의 마지막 카드 도달, 자동 재생, drag 또는 wrap 동작은 다음 cursor 요청을 발생시키지 않는다.

다음 cursor 조회는 기존 페이지 이동이나 명시적인 더 보기 동작에서만 수행한다. 새 페이지가 성공적으로 추가되면 그때 캐러셀의 순환 대상에 새 summary를 포함한다. 캐러셀 순환 때문에 목록 API나 상세 API가 반복 호출되어서는 안 된다.

## 최초 화면과 nearby 처리

`loadSorimaruInitialData`는 목록과 nearby를 병렬로 별도 호출하지 않는다. 먼저 목록 한 번을 조회하고 다음처럼 분기한다.

- 좌표 없음: 최초 목록 `items`를 nearby fallback으로 그대로 재사용
- 좌표 있음: 실제 지원 API로 좌표를 region code로 해석한 뒤 해당 `regionCode` 목록 한 번을 조회
- 동일한 query key의 결과가 이미 있으면 공유 cache를 재사용

백엔드 OpenAPI에 없는 nearby endpoint나 프론트 origin의 상대 `/api/stories/nearby`를 호출하지 않는다. 위치 조회 실패는 최초 목록을 지우지 않고 nearby 섹션에만 error 상태로 전달한다.

## 선택 시 상세 조회와 재생

store 또는 전용 orchestration hook에 `selectAndLoadStory(summary)` action을 둔다.

1. 선택된 summary를 유지하고 해당 storyId의 detail loading 상태를 시작한다.
2. 성공 detail cache에 storyId가 있으면 네트워크 요청 없이 재사용한다.
3. 같은 storyId의 요청이 진행 중이면 기존 Promise를 공유한다.
4. cache와 in-flight 요청이 없을 때만 상세 API를 한 번 호출한다.
5. 성공하면 summary와 detail을 결합한 player model을 만들고 `audioUrl`을 플레이어에 전달한다.
6. 사용자가 재생을 요청한 경우 detail 성공 후 재생하고, 단순 선택이면 기존 UI 동작에 맞춰 선택 상태만 갱신한다.
7. 실패하면 해당 storyId의 detail error만 기록한다. 목록, 다른 섹션과 이전에 재생하던 detail은 유지한다.

성공 detail cache와 in-flight map은 탭 수명 메모리에만 둔다. 새로고침하면 초기화되어 다음 선택에서 다시 조회한다. 실패한 Promise는 `finally`에서 제거하며 cache에 저장하지 않는다.

## 지역 집계와 지역 선택

`지도로 듣는 이야기`의 지역 집계는 최초 활성화 시 다음 요청 한 번만 수행한다.

```text
GET /api/v1/odii/regions?language=ko-KR
```

지도 숫자는 성공 응답의 `storyCount`만 사용한다. regions 상태는 `loading`, `error`, `empty`, `success`로 분리하며 실패를 모든 숫자 0으로 바꾸지 않는다.

사용자가 지역을 클릭하면 regions 응답에 포함된 실제 `regionCodes`로 목록 API를 한 번 호출한다. 해당 지도 지역과 정확히 대응하는 backend group이 없는 경우 임의 regionCode를 만들지 않고 empty 상태로 처리한다. 카드별 상세는 호출하지 않는다.

지역별 다음 페이지도 해당 목록 응답의 `nextCursor`를 사용한다. 기존처럼 페이지마다 다른 keyword를 골라 새 목록을 호출하지 않는다.

## query key와 요청 공유

프로젝트에 SWR 또는 React Query가 없으므로 신규 의존성을 추가하지 않고 repository/application 경계에 탭 수명 query cache를 둔다.

```text
odii:list:{language}:{category}:{regionCode}:{cursor}:{limit}
odii:detail:{language}:{storyId}
odii:regions:{language}
```

- 동일 key의 in-flight Promise를 공유한다.
- 성공 결과는 같은 탭 안에서 재사용한다.
- 오류 결과는 cache하지 않는다.
- consumer unmount는 그 consumer의 상태 반영만 중단한다. 다른 consumer가 공유 중인 요청을 취소하지 않는다.
- filter 또는 region이 바뀌어 이전 응답이 늦게 도착하면 request generation을 비교해 stale 응답을 무시한다.
- 명시적 재시도는 해당 key의 성공 cache를 우회한다.

## 상태와 UI 책임

각 독립 섹션은 다음 상태를 구분한다.

- `loading`: 아직 성공 데이터가 없고 요청 중
- `error`: 요청 또는 payload 검증 실패
- `empty`: 성공 응답의 items가 0개
- `success`: 한 개 이상의 summary 보유

상세 loading/error는 storyId별 상태로 분리한다. 하나의 상세 실패가 목록 상태를 error 또는 empty로 바꾸지 않는다.

`StoryCarousel`, `SoundConstellationSection`, archive list와 카드 컴포넌트는 repository를 import하거나 API를 직접 호출하지 않는다. 이 컴포넌트는 summary, 상태, `onLoadMore`, `onSelectStory`, `onRetry`를 props로 받는다. 데이터 조회와 cache orchestration은 feature hook/store/container가 담당한다.

기존 skeleton, 카드 크기, 지도, 버튼, 애니메이션과 문구는 그대로 유지한다. 상세 loading은 이미 존재하는 카드 또는 플레이어 footprint 안에서 표현해 layout shift를 만들지 않는다.

## timeout과 오류 처리

공통 timeout을 늘려 N+1 문제를 가리지 않는다. 먼저 목록 fan-out을 제거한다.

- list, regions, detail은 공통 API client의 typed error를 유지한다.
- timeout과 명시적 abort, HTTP 오류, payload 오류를 구분한다.
- 상세 timeout은 해당 story의 오류로만 처리한다.
- 목록이나 regions 실패를 빈 성공 응답으로 변환하지 않는다.
- 백엔드 `coverageStatus=MISSING` 또는 정상 `items=[]`는 HTTP 성공이므로 empty 상태로 처리한다.

## 후속 영역

같은 Issue `#224`에서 ODII 완료 뒤 다음 순서로 적용한다.

1. 한옥 이야기: `/api/v1/hanoks`의 `items`, `nextCursor`, `hasMore`를 `{ villages, meta }`로 정확히 변환하고 cursor 페이지를 한 번씩 조회한다. 상세 fan-out과 오류 시 fallback 위장을 허용하지 않는다.
2. 지도 온기: seed와 공공데이터 직접 조합을 제거한다. 배포 OpenAPI상 heat는 `regionCode`, `date`, `metric`만 지원하므로 `lat/lng`는 `/api/v1/regions/resolve`에서 regionCode로 변환한 뒤 `/api/map/heat`를 호출한다. 같은 viewport를 dedupe하고 pan/zoom을 debounce한다.
3. 홈과 기타 목록: 목록 후 item별 상세 호출, 동일 query 중복, 오류를 빈 배열로 바꾸는 코드가 있는지 검사하고 발견된 경로만 같은 원칙으로 수정한다.

## 테스트와 완료 조건

### repository와 application 테스트

- summary가 0개, 1개, 12개여도 목록 HTTP 요청은 한 번이다.
- 12개 summary 응답 뒤 상세 HTTP 요청은 0회다.
- `nextCursor`로 다음 페이지를 요청할 때 목록 HTTP 요청은 한 번이고 상세 요청은 0회다.
- 무한 캐러셀이 마지막 카드에서 첫 카드로 순환해도 목록·상세 HTTP 요청은 0회다.
- 17개 summary가 로드된 캐러셀은 추가 조회 전까지 해당 17개만 반복한다.
- cursor, category, regionCode와 language가 query key에 포함된다.
- 동일 목록 query를 여러 소비자가 요청해도 HTTP 요청은 한 번이다.
- 카드 첫 선택은 해당 상세 요청 한 번을 수행한다.
- 같은 카드 재선택과 동시 선택은 상세 요청을 추가하지 않는다.
- 다른 카드 상세는 미리 요청하지 않는다.
- 목록 실패는 error이고 empty가 아니다.
- 상세 실패 뒤 기존 목록과 다른 detail은 유지된다.
- regions 실패는 error이고 storyCount 0 성공으로 변환되지 않는다.

### 브라우저 Network 검증

| 동작 | 목록 | regions | 상세 |
| --- | ---: | ---: | ---: |
| 소리마루 최초 진입 | 1 | 필요 시 1 | 0 |
| 카드 하나 첫 클릭 | 0 | 0 | 1 |
| 같은 카드 재클릭 | 0 | 0 | 0 |
| 다음 페이지 | 1 | 0 | 0 |
| 지역 첫 클릭 | 1 | 0 | 0 |
| 같은 지역 재선택 | 0 | 0 | 0 |

전체 초기 HTTP 요청이 기존 42회 또는 44회 패턴으로 발생하면 실패다. 관련 Vitest, TypeScript type check, ESLint, production build와 Network 탭 검증을 모두 통과해야 한다.

## 변경하지 않는 것

- 기존 UI, 레이아웃, 디자인, 애니메이션과 사용자 문구
- 백엔드 API 계약
- Service Worker 또는 영속 browser cache
- mock, public ODII API 또는 seed fallback
- timeout을 늘리는 임시 해결
