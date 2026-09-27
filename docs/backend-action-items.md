# 백엔드 전달 사항

> 작성일: 2026-09-28 · 관련 PR #225 #226 #227 · Issue #218 #228

---

## 1. 한옥 목록 `limit` 상한 증가

**현상**

프론트엔드는 `/api/v1/hanoks?limit=50` 을 `hasMore === true` 인 동안 cursor 기반으로 반복 호출합니다.
한옥 데이터가 150건이면 최초 로드 시 3회 직렬 요청이 발생하여 초기 화면 지연이 큽니다.

**요청**

- `limit` 상한을 500 이상으로 올려주거나
- 전체 목록을 한 번에 반환하는 endpoint (`/api/v1/hanoks/all` 등) 추가

**관련 코드**

`src/features/hanok-archive/infrastructure/backendHanokSource.ts:23`

---

## 2. 한옥 응답에 좌표(`lat` / `lng`) 포함

**현상**

`/api/v1/hanoks` 응답 항목 중 `lat` / `lng` 가 `null` 인 경우가 있어, 프론트가 하드코딩된 fallback snapshot에서 좌표를 보완하고 있습니다.
fallback에 없는 신규 한옥은 지도에 표시되지 않습니다.

**요청**

`BackendHanokItem` 응답에 `lat`, `lng` 를 항상 포함해 주세요.

```jsonc
// 현재
{ "placeId": "...", "name": "...", "lat": null, "lng": null }

// 요청
{ "placeId": "...", "name": "...", "lat": 37.5826, "lng": 126.9848 }
```

**관련 코드**

`src/features/hanok-archive/infrastructure/backendHanokSource.ts:42-58`

---

## 3. Stamp endpoint 404 확인 요청

**현상**

PR #227 (v0.1.2 릴리즈) Known Risk 에 명시된 대로, 운영 환경에서 stamp 관련 endpoint가 404를 반환하고 있습니다.
프론트 코드는 준비되어 있으나 백엔드 배포가 선행되어야 합니다.

**요청**

stamp API 배포 완료 후 프론트팀에 알려주세요. 완료 확인 후 smoke test를 진행하겠습니다.

**관련 이슈**

Issue #218 · PR #227

---

## 우선순위

| 순서 | 항목 | 영향 |
|---|---|---|
| 1 | Stamp endpoint 404 확인 | 운영 기능 미동작 |
| 2 | 한옥 좌표 포함 | 신규 한옥 지도 미표시 |
| 3 | 한옥 limit 상한 증가 | 초기 로드 지연 |
