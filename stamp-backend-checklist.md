# 백엔드 확인 사항 — 수결첩 Issue #262

> 기준: Public REST API contract (schemaVersion 1.3) + FE 구현 완료 시점

---

## 체크리스트

- [ ] 1. placeId 체계 일치 확인
- [ ] 2. regionGroup 허용 값 확인
- [ ] 3. conditionType 허용 값 확인
- [ ] 4. triggerPlaceId = 지도 Item.id 확인
- [ ] 5. stamp API 배포 완료 후 알림

---

## 1. placeId 체계 일치 (최우선)

FE는 지도 API 응답의 `Item.id`를 체크인에 그대로 사용합니다.

```
지도 목록 API → Item.id
       ↓
POST /api/v1/places/{placeId}/check-ins
```

계약서에 명시된 조건: "서버는 active Catalog의 한옥 계열 장소에 대해서만 PostGIS 거리를 계산한다."

→ **지도에 노출되는 `Item.id`와 체크인 API의 `placeId`가 동일한 값인지 확인 부탁드립니다.**  
→ active Catalog에 없는 장소에서 체크인 시도 시 404 NOT_FOUND가 내려오는지도 확인해 주세요.

---

## 2. regionGroup 허용 값

FE 코드(`stampRules.ts`)가 인식하는 값은 아래 7개 + `null`뿐입니다.  
이 외의 값은 전부 `'all'`(전국 특수)로 처리되어 지역 필터가 동작하지 않습니다.

```
SEOUL · GYEONGGI · GANGWON · CHUNGCHEONG · JEOLLA · GYEONGSANG · JEJU
```

→ **`GET /api/v1/stamps` 응답의 `regionGroup` 필드가 위 목록 중 하나 또는 `null`인지 확인 부탁드립니다.**  
→ 새로운 값이 추가되면 FE와 사전 협의가 필요합니다.

---

## 3. conditionType 허용 값

FE의 카탈로그 응답 검증이 아래 3개 외의 값을 받으면 수결첩 화면 전체가 에러 상태로 떨어집니다.

```
REGION_VISIT · NIGHT_VISIT · REGION_COUNT
```

→ **현재 사용 중인 `conditionType` 값이 위 3개뿐인지 확인 부탁드립니다.**  
→ 향후 새 타입 추가 전 FE에 먼저 알려주세요. 검증 목록을 함께 업데이트해야 합니다.

---

## 4. triggerPlaceId = 지도 Item.id

FE는 `StampBookItem.triggerPlaceId`와 지도 `Item.id`를 비교해 "이미 방문한 장소" 여부를 판단합니다.  
두 값이 다르면 방문 후에도 장소 상세 화면의 체크인 버튼이 계속 "도장 찍기"로 표시됩니다.

→ **체크인 기록에 저장되는 `triggerPlaceId`가 지도 API의 `Item.id`와 동일한 값인지 확인 부탁드립니다.**

---

## 5. 배포 완료 알림

stamp API가 운영 환경에 배포되면 FE팀에 알려주세요.  
완료 확인 후 아래 6개 엔드포인트 smoke test를 진행하겠습니다.

```
GET  /api/v1/stamps
GET  /api/v1/me/stamp-book
POST /api/v1/places/{placeId}/check-ins
GET  /api/v1/stamps/leaderboard
GET  /api/v1/me/stamp-ranking
PUT  /api/v1/me/stamp-ranking
```
