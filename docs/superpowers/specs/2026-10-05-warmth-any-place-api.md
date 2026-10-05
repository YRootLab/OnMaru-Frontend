# 온기 한 줄 남기기 — 모든 장소 지원 API 요청

## 배경

현재 온기(방문 리뷰) 생성 엔드포인트는 `POST /places/{placeId}/visit-reviews` 형태로,
**백엔드 places 테이블에 이미 등록된 placeId만** 수락합니다.

온기 지도는 한옥뿐만 아니라 사용자가 방문한 **모든 한국 장소**(대청댐, 카페, 공원 등)에
대한 기억을 남길 수 있어야 합니다. 프론트는 카카오 장소 검색 API를 통해 전국 모든 장소를
검색하고 선택할 수 있지만, 현재 백엔드에서 카카오 place ID를 처리할 방법이 없습니다.

---

## 요청: 새 엔드포인트 또는 기존 엔드포인트 확장

### 방안 A (권장) — 새 엔드포인트

```
POST /api/v1/visit-reviews
```

요청 body:

```json
{
  "kakaoPlaceId": "123456789",
  "placeName": "대청댐",
  "lat": 36.4952,
  "lng": 127.4981,
  "text": "조용하고 경치가 좋았어요.",
  "mood": "한적",
  "score": 4,
  "tags": ["#힐링", "#야경"]
}
```

백엔드 동작:
1. `kakaoPlaceId`로 places 테이블 조회
2. 없으면 `placeName` / `lat` / `lng` 으로 신규 place 레코드 생성 후 내부 `placeId` 발급
3. 발급된 `placeId`로 visit_review 레코드 생성
4. 응답은 기존 VisitReview 형태와 동일

### 방안 B — 기존 엔드포인트에 place 메타 추가

```
POST /api/v1/places/{placeId}/visit-reviews
```

- `placeId` = 카카오 place ID (숫자 문자열)
- body에 `placeName`, `lat`, `lng` 추가
- 백엔드가 해당 placeId의 place 레코드를 upsert

```json
{
  "placeName": "대청댐",
  "lat": 36.4952,
  "lng": 127.4981,
  "text": "조용하고 경치가 좋았어요.",
  "mood": "한적",
  "score": 4,
  "tags": ["#힐링"]
}
```

---

## 응답 (공통)

기존 `VisitReview` 타입과 동일:

```json
{
  "id": "review-abc123",
  "placeId": "내부-place-id",
  "placeName": "대청댐",
  "lat": 36.4952,
  "lng": 127.4981,
  "text": "조용하고 경치가 좋았어요.",
  "mood": "한적",
  "score": 4,
  "tags": ["#힐링"],
  "likeCount": 0,
  "likedByMe": false,
  "mine": true,
  "createdAt": "2026-10-05T12:00:00.000Z",
  "author": { "displayName": "온마루 사용자" }
}
```

---

## 에러

| 상태 코드 | 설명 |
|-----------|------|
| `400` | `kakaoPlaceId` 또는 `placeName` 누락 |
| `401` | 인증 필요 |
| `422` | `text` 유효성 오류 (빈 문자열, 300자 초과, 5줄 초과) |

---

## 프론트 현황

- `src/private/core-ui/map-warmth/WriteWarmthModal.tsx`
  - 카카오 키워드 검색(`window.kakao.maps.services.Places`)으로 교체 완료
  - 선택 시 `{ id: kakaoPlaceId, name, lat, lng }` 저장
- `src/features/visit-review/application/visitReviewUseCases.ts`
  - `placeId.startsWith('custom-')` 검사 → 카카오 ID 통과되도록 제거 또는 완화 필요
- `src/features/visit-review/api/visitReviewApi.ts`
  - `createReview` 시그니처에 `placeName`, `lat`, `lng` 옵셔널 추가 예정

---

## 참고 파일

- `src/features/visit-review/application/visitReviewUseCases.ts` — placeId 검증 로직
- `src/features/visit-review/api/visitReviewApi.ts` — `createReview` 구현
- `src/features/visit-review/api/visitReviewContract.ts` — `VisitReview` 타입
