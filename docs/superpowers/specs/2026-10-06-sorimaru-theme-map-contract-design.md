# 소리마루 테마·정보지도 API 계약 설계

## 목표

소리마루 `소리로 만나는 한국`을 BE가 제공하는 고정 테마 코드와 cursor 페이지네이션에 연결하고, 정보지도 요청은 최초 진입부터 항상 유효한 카테고리 `HANOK`을 보내도록 한다.

## 선택한 접근

기존 repository와 catalog controller 경계를 유지한다. 화면 라벨과 API 코드를 `sorimaruCategoryData.ts`의 단일 정의에서 관리하고, 선택 상태에는 API 코드를 저장한다. 이 방식은 한국어 키워드를 계속 API 값으로 사용하는 방식보다 계약이 명확하고, 별도 변환 레이어를 중복 추가하는 방식보다 변경 범위가 작다.

## 소리마루 데이터 흐름

- `전체 보기`는 `category`와 `regionCode`를 모두 생략하고 `language=ko-KR&limit=20`만 요청한다.
- 나머지 탭은 `HANOK_HERITAGE`, `TRADITIONAL_MARKET`, `VILLAGE_STREETS`, `PALACE_HISTORY`, `SOUND_CULTURE`, `NATURE_TRAILS` 중 하나를 `category`로 보낸다.
- 다음 페이지는 현재 테마 요청에 응답의 `nextCursor`만 추가한다.
- 메타바는 응답의 `totalCount`를 표시한다.
- `소리로 만나는 한국`에는 테마 탭만 표시하고 지역 칩은 표시하지 않는다.
- 초기 전체 페이지는 기존 hero·nearby·archive 공유 흐름을 유지한다.

## 정보지도 데이터 흐름

- 정보지도 상태의 기본 카테고리는 `hanok`이며 API 경계에서 `HANOK`으로 정규화한다.
- URL에 유효한 정보지도 카테고리가 없거나 `all`이 들어오면 `hanok`을 유지한다.
- 정보지도 UI에서 `전체` 선택지를 제거하고 카테고리 재클릭도 `all`로 되돌리지 않는다.
- `/map/info/viewport`와 `/map/info/places`는 모든 요청에 카테고리를 포함한다.
- 온기지도용 `all` 상태와 동작은 변경하지 않는다.

## 문서와 검증

BE의 `docs/toFE/sorimaru-api.md`를 FE의 같은 경로에 복사한다. 소리마루 controller/component 테스트와 정보지도 store/chip/service 테스트를 먼저 실패시키고 구현한 뒤, 관련 Vitest·TypeScript·ESLint를 실행한다.

