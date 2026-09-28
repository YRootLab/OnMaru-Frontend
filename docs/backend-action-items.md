# 백엔드 전달 사항

> 최종 업데이트: 2026-09-28  
> 관련 이슈: #228 (API fan-out 감사), #230 (섹션 1 서버 목록 연동)

---

## 우선순위 요약

| 순서 | 항목 | 영향 |
|---|---|---|
| 1 | Stamp endpoint 404 확인 | 운영 기능 미동작 |
| 2 | 섹션 1 목록 계약 확인 | 한옥 페이지 첫 섹션 데이터 보장 |
| 3 | 한옥 좌표(`lat`/`lng`) 포함 | 신규 한옥 지도 미표시 |
| 4 | 한옥 목록 `limit` 상한 증가 | 초기 로드 직렬 N 요청 |
| 5 | category 공식 enum 공유 | 프론트 분기 처리 정확성 |

---

## 1. Stamp endpoint 404 확인

**현상**  
운영 환경에서 stamp 관련 endpoint가 404를 반환하고 있습니다.  
프론트 코드는 준비되어 있으나 백엔드 배포가 선행되어야 합니다.

**요청**  
stamp API 배포 완료 후 프론트팀에 알려주세요. 완료 확인 후 smoke test를 진행하겠습니다.

**관련 이슈**: #218

---

## 2. 섹션 1 목록 계약 확인 (Issue #230)

프론트는 한옥 페이지 첫 섹션에서 다음 요청을 1회 호출합니다.

```
GET /api/v1/hanoks?hasImage=true&limit=13
```

아래 사항을 확인해 주세요.

### 2-1. 대표 목록 사용 가능 여부
- `hasImage=true&limit=13` 결과를 섹션 대표 카드로 사용해도 되는지
- 정렬 기준(최신순? 추천순?)이 무엇인지, 호출 시마다 동일한 13건이 보장되는지

### 2-2. placeId ↔ 상세 endpoint 연결 계약
목록 응답의 `placeId`로 상세를 조회할 때 어떤 endpoint가 canonical인지 확인이 필요합니다.

```
# 현재 프론트가 사용하는 경로
GET /api/v1/hanoks/{placeId}   ← 현재 사용 중

# 또는
GET /api/v1/places/{placeId}   ← 어느 쪽이 맞나요?
```

일부 `p-tourapi-*` 형식의 `placeId`가 상세 endpoint에서 404를 반환하는 사례가 있었습니다.  
목록에서 반환된 `placeId`는 반드시 상세 endpoint와 1:1로 연결되어야 합니다.

### 2-3. `p-tourapi-*` placeId 404 원인
목록에서 받은 `placeId`로 상세 조회 시 404가 발생하는 건이 있습니다.  
목록 응답에 상세가 없는 항목이 포함되지 않도록 필터링해 주시거나, 404 발생 조건을 알려주세요.

---

## 3. 한옥 응답에 좌표(`lat`/`lng`) 포함

**현상**  
`/api/v1/hanoks` 응답의 일부 항목에서 `lat`/`lng`가 `null`입니다.  
프론트가 하드코딩된 fallback snapshot에서 좌표를 보완하고 있어, fallback에 없는 신규 한옥은 지도에 표시되지 않습니다.

**요청**  
목록 응답에 `lat`, `lng`를 항상 포함해 주세요.

```jsonc
// 현재
{ "placeId": "...", "name": "...", "thumbnailUrl": "...", "lat": null, "lng": null }

// 요청
{ "placeId": "...", "name": "...", "thumbnailUrl": "...", "lat": 37.5826, "lng": 126.9848 }
```

**관련 코드**: `src/features/hanok-archive/infrastructure/backendHanokSource.ts`

---

## 4. 한옥 목록 `limit` 상한 증가

**현상**  
프론트는 `/api/v1/hanoks?limit=50`을 `hasMore === true`인 동안 cursor 기반으로 반복 호출합니다.  
한옥 데이터가 150건이면 최초 로드 시 3회 직렬 요청이 발생하여 초기 화면 지연이 큽니다.  
12시간 SWR 캐시 덕에 재진입 시 반복되지 않으나, 최초 로드 또는 캐시 만료 시 지연이 큽니다.

**요청**  
아래 중 하나를 검토해 주세요.

- `limit` 상한을 500 이상으로 올리거나
- 전체 목록을 한 번에 반환하는 endpoint(`/api/v1/hanoks/all` 등) 추가

**관련 코드**: `src/features/hanok-archive/infrastructure/backendHanokSource.ts`

---

## 5. category 공식 enum 공유

**현상**  
`/api/v1/hanoks` 응답의 `category` 필드 값이 `HANOK`, `한옥스테이`, `고택` 등 혼재되어 있습니다.  
프론트가 `type === '한옥스테이'`로 분기하는 곳이 있어 enum 값이 바뀌면 버그가 생길 수 있습니다.

**요청**  
`category` 필드의 공식 enum 목록과 각 값의 의미를 공유해 주세요.

```ts
// 예시 — 실제 값 확인 후 프론트 상수로 고정 예정
type HanokCategory = 'HANOK' | 'HANOK_STAY' | 'HISTORIC_HOUSE' | ...
```

---

_이 문서는 프론트엔드 팀이 백엔드 팀에 전달하는 확인·요청 사항입니다. 수정이 완료되면 각 항목을 체크해 주세요._
