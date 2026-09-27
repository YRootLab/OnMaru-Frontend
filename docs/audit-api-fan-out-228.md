# API 호출 fan-out 및 상세 선조회 감사 보고서

> Issue #228 · 진단 전용 · 수정 제외

---

## 측정 결과 요약

| 화면 / 행동 | 목록 요청 | 상세 요청 | 집계 요청 | 중복 요청 | 오류 표시 | 비고 |
|---|---:|---:|---:|---:|---|---|
| 한옥 최초 진입 | N (cursor 루프) | 0 | 0 | 0 | ✅ 500 반환 | hasMore 루프, 50개씩 직렬 |
| 한옥 탭 재진입 (12h 내) | 0 | 0 | 0 | 0 | — | swrFetch 캐시 히트 |
| 한옥 카드 클릭 | 0 | 0 | 0 | 0 | — | 상세 API 없음 |
| 지도 최초 진입 | 2 | 0 | 0 | 0 | ⚠️ fallback 렌더 | places + heat 동시 |
| 지도 places 응답 후 | +6 | 0 | 0 | 0 | — | 소리마루 fan-out |
| 지도 pan/zoom | 2 (+6) | 0 | 0 | 0 | — | 캐시 미스 시 동일 패턴 |
| 지도 탭 재진입 (1분 내) | 0 | 0 | 0 | 0 | — | 모듈 캐시 히트 |
| 홈 최초 진입 | 4 | 0 | 0 | 0 | ✅ 섹션별 독립 | 섹션별 병렬 |
| 홈 탭 재진입 (TTL 내) | 0 | 0 | 0 | 0 | — | swrFetch 캐시 히트 |
| 홈 재진입 (stale) | 0 (캐시) | 0 | 0 | 0 | — | 백그라운드 갱신 |

---

## 화면별 상세 분석

### 한옥 아카이브

#### 호출 경로

```
useArchiveData
  └─ swrFetch('hanok:archive', fetchArchive, 12h)
       └─ fetch('/api/tourapi')                            [Next.js route]
            └─ fetchBackendHanoksAsArchive()
                 └─ fetchBackendHanoks()
                      └─ apiGet('/hanoks', { limit:50 })   [cursor loop × N]
```

#### 발견 사항

| # | 심각도 | 항목 | 위치 |
|---|---|---|---|
| H-1 | **HIGH** | cursor 루프 직렬 요청 | `backendHanokSource.ts:23` |
| H-2 | INFO | 상세 API 없음 — 클릭 선조회 없음 | — |
| H-3 | INFO | 12h SWR 캐시 — 탭 재진입 무요청 | `useArchiveData.ts` |

**H-1 상세**

`fetchBackendHanoks()`는 `hasMore === true` 인 동안 `/api/v1/hanoks?limit=50&cursor=...` 을
순차적으로 호출한다. 백엔드에 한옥 150건이 있으면 최초 진입 시 3회 직렬 요청이 발생한다.
12h TTL 덕분에 재진입 시 반복되지 않으나, 최초 로드 또는 캐시 만료 시 지연이 크다.

**수정 우선순위**: Medium — 백엔드가 `limit` 상한을 올려주거나 단일 요청으로 전체를 반환하면 해소. 프론트 단독 해결은 어렵다.

---

### 지도 온기 모드

#### 호출 경로

```
useMapData (effect)
  ├─ fetch('/api/map/heat?...')          [heat]
  └─ fetch('/api/map/places?...')        [places]
       └─ 응답 후 (콜백 내)
            └─ fetchRegionalSorimaruStories(lng, lat)
                 ├─ getNearbyStories(lng, lat, 25000)      [sorimaru 1]
                 └─ getStoryList(undefined, kw) × 5        [sorimaru ×5]
```

#### 발견 사항

| # | 심각도 | 항목 | 위치 |
|---|---|---|---|
| M-1 | **HIGH** | places 응답 후 소리마루 6 fan-out | `useMapData.ts:180` |
| M-2 | **HIGH** | places 오류 시 fallback seed 렌더 (사용자 미인지) | `places/route.ts:74-83`, `useMapData.ts:164` |
| M-3 | MEDIUM | heat 오류 시 seed 데이터 반환 — 실제 데이터 없음 감춤 | `heat/route.ts:247-272` |
| M-4 | MEDIUM | heat/places 캐시가 모듈 수준 Map — SSR/서버리스 재시작 시 초기화 | `useMapData.ts:13-14` |
| M-5 | LOW | `searchCenter.lat`·`lng` 개별 deps — 좌표 동시 변경 시 이중 effect 가능 | `useMapData.ts:197` |

**M-1 상세**

`useMapData.ts:180`에서 places 응답 콜백 내에서 `fetchRegionalSorimaruStories` 를 항상 호출한다.
사용자가 카드를 클릭하거나 소리 기능을 사용하지 않아도, 지도가 로드될 때마다 sorimaru 최대 6개 요청이 발생한다.
`sorimaruApi`에 TTL 캐시가 추가되어 재진입 시 중복은 없으나, 최초·캐시 만료 시 fan-out이 크다.

**M-2 상세**

`/api/map/places` 는 에러 시 `{ items: fallback, degraded: true, error: '...' }` 를 반환한다.
`useMapData.ts:164-174`는 `json.error` 가 있어도 `items.length > 0` 이면 해당 items 를 `setItems` 한다.
`setError`도 같이 호출되지만, UI에서 에러 메시지와 fallback 장소 목록이 동시에 보이는 상태가 된다.
`degraded: true` 필드를 클라이언트가 확인하지 않아 사용자는 실제 데이터인지 알 수 없다.

**M-3 상세**

`/api/map/heat/route.ts:247-272` — spots 빈 경우 viewport 중심 좌표로 seed spot 1개를 강제 추가한다.
결과적으로 heat response 는 항상 `spots.length >= 1` 을 반환, 빈 상태가 UI에 노출되지 않는다.

**수정 우선순위**: M-1 HIGH (소리마루 lazy-load 분리), M-2 MEDIUM (degraded 플래그 클라이언트 처리)

---

### 홈 화면

#### 호출 경로

```
useCuratedCourses  → swrFetch('home:curated-courses:...', ..., 1h)  → /home/curated-courses
useTrendingSounds  → swrFetch('home:trending-sounds:...',  ..., 10m) → /home/trending-sounds
usePopularSounds   → swrFetch('home:popular-sounds:...',   ..., 10m) → /home/popular-sounds
usePopularRegions  → swrFetch('home:popular-regions:...',  ..., 10m) → /home/popular-regions
```

#### 발견 사항

| # | 심각도 | 항목 |
|---|---|---|
| P-1 | INFO | 4개 섹션 독립 로드 — 한 섹션 실패가 다른 섹션에 영향 없음 |
| P-2 | INFO | 상세 API 없음 — 클릭 선조회 없음 |
| P-3 | INFO | SWR 캐시 재진입 시 네트워크 요청 0 |
| P-4 | INFO | revalidating 상태 추가로 백그라운드 갱신 표시 가능 |

홈 화면은 현재 구조상 큰 문제 없음.

---

## 조사 질문별 답변

| 질문 | 결과 |
|---|---|
| 동일 endpoint 병렬·중복 호출? | 없음 (swrFetch in-flight 공유) |
| 목록 후 item마다 상세 fan-out(N+1)? | 없음 |
| 클릭 전 상세 선조회? | 없음 |
| cursor 있는데 전체 대량 조회? | **있음** — 한옥 cursor 루프 (H-1) |
| 오류를 empty 대신 mock/seed로 대체? | **있음** — 지도 places fallback (M-2), heat seed (M-3) |
| 한 섹션 실패가 다른 섹션 영향? | 없음 (홈·한옥 독립), 지도는 places 실패 시 소리마루 fan-out 여전히 발생 (M-1) |
| pan/zoom 동일 query 과도 반복? | 캐시 히트 시 없음, 1분 캐시 만료 후 재요청 (정상) |

---

## 수정 우선순위

| 우선순위 | ID | 제목 | 영향 |
|---|---|---|---|
| P0 | M-1 | 지도 소리마루 fan-out lazy-load 분리 | 지도 로드마다 최대 6 요청 발생 |
| P1 | M-2 | places degraded 플래그 클라이언트 처리 | 오류 시 seed 데이터가 실제인 척 노출 |
| P2 | H-1 | 한옥 cursor 루프 → 백엔드 단일 요청 협의 | 최초 로드 직렬 N 요청 |
| P3 | M-3 | heat empty → seed 강제 삽입 제거 | 빈 상태 숨김 |
| P4 | M-5 | searchCenter lat/lng 개별 deps → useMemo 객체 참조 | 이중 effect 방어 |

---

## 회귀 테스트 제안

다음 시나리오는 자동 테스트로 고정 가능하다.

```ts
// 1. 홈 — 4개 섹션이 각각 fetch를 1회씩만 호출하는지
it('홈 최초 진입 시 섹션별 fetch 1회', ...)

// 2. 홈 재진입 — TTL 내에서 fetch 0회
it('홈 재진입(TTL 내) fetch 없음', ...)

// 3. 한옥 — tabCache 히트 시 /api/tourapi fetch 0회
it('한옥 탭 재진입 캐시 히트', ...)

// 4. 지도 — places 성공 후 sorimaru fan-out 횟수 상한 검증
it('지도 places 응답 후 sorimaru 6회 이하', ...)

// 5. 지도 — places 오류 시 degraded=true 상태 UI 표시 여부
it('places 오류 시 degraded 배너 노출', ...)
```

---

_진단 전용. 프로덕션 코드 수정 없음. 수정은 영역별 별도 Issue·PR로 진행._
