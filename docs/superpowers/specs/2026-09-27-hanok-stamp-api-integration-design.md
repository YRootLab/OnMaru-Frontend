# 한옥 수결첩 API 연동 설계

## 목표

`/stamps`와 지도 장소 상세의 수결 기능을 브라우저 `localStorage` 데모에서 API 계약 `1.3` 기반 서버 상태로 전환한다. 수결 카탈로그는 누구나 볼 수 있고, 개인 획득 상태와 체크인은 로그인 회원만 사용한다. 탐방 랭킹은 서버가 생성한 익명 별명을 사용하는 명시적 참여 방식으로 제공하며 기존 하드코딩 랭킹은 제거한다.

서버가 수결, 진행률, 랭킹과 체크인의 유일한 원본이다. 브라우저에는 화면 반응성을 위한 메모리 상태만 둘 수 있으며 수결과 랭킹 데이터를 영속 저장하지 않는다.

## 범위

다음 API 여섯 개를 연결한다.

- `GET /api/v1/stamps`
- `GET /api/v1/me/stamp-book`
- `POST /api/v1/places/{placeId}/check-ins`
- `GET /api/v1/stamps/leaderboard?limit=20`
- `GET /api/v1/me/stamp-ranking`
- `PUT /api/v1/me/stamp-ranking`

사용자 지정 랭킹 닉네임, 칭호, 랭킹 데이터의 로컬 캐시와 체크인 위치의 기록·분석은 범위에 포함하지 않는다.

## 계층과 책임

`src/features/stamp`를 점진적으로 다음 경계로 나눈다.

- `domain`: API 계약과 화면에서 공유하는 수결, 요약, 체크인, 랭킹 타입 및 결정적 변환 규칙
- `application`: 카탈로그·개인 수결첩·체크인·랭킹 조회 및 참여 변경 use case와 port
- `infrastructure`: HTTP repository, browser geolocation, legacy storage 정리 구현
- `presentation`: React hook과 화면 컴포넌트

페이지와 지도 진입점은 실제 infrastructure 구현을 선택하는 조합 경계다. 표현 컴포넌트는 `fetch`, `navigator.geolocation` 또는 `localStorage`에 직접 접근하지 않는다.

기존 Zustand store의 영속 middleware와 클라이언트 수결 판정 로직은 제거한다. store에는 서버에서 마지막으로 확인한 개인 수결첩의 메모리 snapshot, 현재 세션에 성공한 체크인 장소 ID와 수결 애니메이션 queue 같은 일시적 UI 상태만 둔다.

## 수결첩 데이터 흐름

1. 화면 진입 시 공개 수결 카탈로그를 조회한다.
2. 인증 상태가 확정되고 로그인 회원이면 개인 수결첩을 `cache: 'no-store'`로 조회한다.
3. 개인 응답의 항목을 code로 공개 카탈로그에 덮어써 획득 상태를 구성한다.
4. 개인 조회 성공 뒤에만 `onmaru_hanok_stamps_v1`을 삭제한다.
5. 비로그인 또는 개인 조회 실패 시 legacy 값을 획득 상태로 사용하지 않는다.
6. `summary.completionRate`를 포함한 모든 진행 수치는 서버 값을 그대로 표시한다.

비로그인 사용자는 12개 수결 디자인을 잠금 상태로 본다. 개인 조회 중에는 최종 카드와 같은 크기의 neutral gray skeleton을 표시하여 layout shift를 만들지 않는다. 실패 시 기존 화면 크기를 유지하는 오류와 재시도 동작을 제공한다.

## 체크인 흐름

지도 장소 상세의 도장 찍기 동작은 다음 순서를 따른다.

1. 비로그인이면 위치 권한을 요청하지 않고 로그인 안내를 표시한다.
2. 로그인 회원의 클릭 한 번마다 새 UUID 멱등성 키를 만든다.
3. browser geolocation과 `/auth/csrf` token을 병렬로 얻는다.
4. 좌표 payload는 함수의 지역 변수에만 두고 상태, log 또는 analytics에 기록하지 않는다.
5. `POST /api/v1/places/{placeId}/check-ins`를 `credentials: 'include'`, `cache: 'no-store'`, CSRF header와 멱등성 header로 호출한다.
6. 5xx 응답은 같은 UUID와 같은 body로 한 번만 재시도한다.
7. `CSRF_INVALID`은 token을 새로 받은 뒤 같은 UUID와 body로 한 번만 재시도한다.
8. 201이면 `newAwards` 전체를 응답 순서대로 animation queue에 넣고 summary를 즉시 반영한다.
9. 200 또는 `alreadyCheckedIn=true`이면 오류 대신 이미 기록된 방문이라는 성공 안내를 표시한다.
10. 성공 뒤 개인 수결첩을 재조회하여 메모리 snapshot을 서버와 재동기화한다.

API 1.3은 전체 방문 장소 목록을 제공하지 않는다. 따라서 새로고침 뒤에는 각 수결의 `triggerPlaceId`만 서버에서 복원할 수 있으며, 새 수결을 만들지 않은 성공 체크인 장소 전체를 정확히 복원할 수 없다. 현재 세션의 성공 체크인은 메모리에서 표시하되, 이 제약은 후속 서버 계약으로 기록한다. localStorage를 방문 여부의 fallback으로 사용하지 않는다.

## 익명 랭킹 흐름

랭킹 탭은 공개 API 응답만 표시한다. 기존 `LEADERBOARD_MOCK`, OAuth 이름과 하드코딩 칭호를 제거한다.

- 비로그인: 공개 목록을 표시하고 참여 CTA는 로그인 안내로 연결한다.
- 로그인 미참여: 공개 목록과 개인 진행률, 익명 참여 설명과 참여 버튼을 표시한다.
- 로그인 참여: 서버 생성 `publicNickname`, `nicknameType: GENERATED`, 개인 `rank`, `participantCount`와 철회 버튼을 표시한다.
- 목록 상위 20명 밖이어도 개인 상태 API의 rank를 별도로 표시한다.
- 참여 요청 body는 `{ participating: true }`만 보낸다. 닉네임 입력 UI를 만들지 않는다.
- 철회 요청 body는 `{ participating: false }`이며 rate limit과 관계없이 사용할 수 있게 유지한다.
- 참여 또는 철회 성공 뒤 공개 목록과 개인 상태를 함께 다시 조회한다.
- 철회 성공 시 진행 중이던 이전 공개 요청이 늦게 도착해 상태를 되돌리지 않도록 request generation을 비교하거나 이전 요청을 취소한다.

공개·개인 랭킹 응답은 모두 `no-store`이며 service worker, CDN 또는 localStorage에 저장하지 않는다. `publicId`와 익명 별명을 analytics 또는 client log에 기록하지 않는다.

## 오류 처리

문구는 서버의 영문 `message`가 아니라 안정적인 `code`로 선택한다. 추적이 필요한 실패 UI에는 `requestId`를 함께 표시한다.

- `AUTH_REQUIRED`: 로그인 안내. 체크인은 로그인 후 자동 실행하지 않고 사용자가 다시 확인한다.
- `VALIDATION_ERROR`: 요청을 자동 반복하지 않고 재시도를 안내한다.
- `CSRF_INVALID`: token을 한 번 갱신해 동일 요청을 한 번 재시도한다.
- `IDEMPOTENCY_KEY_MISSING`, `IDEMPOTENCY_KEY_INVALID`, `IDEMPOTENCY_CONFLICT`: 자동으로 새 키를 만들어 성공처럼 처리하지 않고 client 오류로 표시한다.
- `LOCATION_ACCURACY_TOO_LOW`: 위치 정확도가 좋아진 뒤 새 위치로 재시도하게 안내한다.
- `OUTSIDE_CHECK_IN_RADIUS`: 장소 가까이 이동하도록 안내한다.
- `CHECK_IN_RATE_LIMITED`: 서버 초 단위 값을 사용해 재시도 가능 시각을 표시한다.
- 랭킹 `RATE_LIMITED`: 참여 버튼만 대기시키며 철회 동작은 계속 허용한다.
- `SERVICE_UNAVAILABLE`: 현재 성공 화면을 유지하고 사용자가 다시 시도할 수 있게 한다.

브라우저 geolocation의 `PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, `TIMEOUT`을 각각 다른 안내로 변환한다. 위치 API 미지원도 별도 안내한다.

## UI 보존과 변경

수결 카드, 지도, 진행률과 기존 seal animation의 시각 스타일은 유지한다. 메인 제목은 페이지 최상단에 둔다. 로딩 표면은 neutral gray를 사용하고 실제 카드, 제목, 요약과 탭의 최종 footprint를 그대로 예약한다.

랭킹에는 서버가 제공하지 않는 `title`을 표시하지 않는다. 참여 설명에 서버 생성 익명 별명이며 철회 후 재참여하면 새 공개 ID와 새 별명이 생긴다는 정책을 명확히 표시한다.

모든 새 motion은 `prefers-reduced-motion`을 존중한다. 이미 공개된 수결 카드에 대한 기존 진입 animation을 데이터 재조회 때마다 재생하지 않는다.

## 테스트 전략

각 production 동작은 Vitest 실패 test를 먼저 확인한 뒤 최소 구현으로 통과시킨다.

- repository contract: 정확한 path, credentials, no-store, body, CSRF와 멱등성 header
- check-in retry: 5xx와 CSRF 갱신 시 동일 UUID와 payload 유지
- geolocation: 미지원, 권한 거부, 위치 불가와 timeout mapping
- stamp book mapping: 공개 카탈로그와 개인 획득 상태 병합, 서버 summary 보존
- migration: 개인 조회 성공 뒤에만 legacy key 삭제
- ranking: 공개 목록, 미참여, 참여, 철회, 429 retry time, 늦은 응답 무시
- privacy: 좌표와 익명 ranking ID·nickname을 log 또는 영속 상태에 전달하지 않음
- presentation: 비로그인 CTA, 200 중복 성공, 모든 newAwards queue, 오류 code 문구

마지막에 관련 Vitest, 전체 type check, ESLint와 production build를 실행한다. 브라우저 실행이 가능하면 `/stamps`와 지도 장소 상세에서 loading, guest, member, ranking 상태를 확인하고 주요 뷰포트 screenshot을 비교한다.

## 운영 기록

현재 작업을 `handoff.md`, 사용자에게 의미 있는 변경을 `changelog.md`에 기록한다. 전체 방문 장소 복원 API 부재는 `improvements.md`에 후속 작업으로 남긴다. PR 생성 또는 merge는 사용자의 최종 승인 전에는 수행하지 않는다.
