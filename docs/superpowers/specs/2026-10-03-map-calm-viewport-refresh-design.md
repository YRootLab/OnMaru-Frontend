# 지도마루 편안한 viewport 갱신 설계

## 배경

지도마루는 카카오 지도 `idle` 이벤트에서 중심과 줌 레벨을 갱신한다. 기존 구조는 각 줌 단계의 transient `level` 변경이 데이터 요청을 즉시 실행하고, debounce 종료 후 `reloadNonce`가 다시 요청을 실행할 수 있었다. 1차 수정으로 즉시 요청을 제거하고 정보/온기 모드의 데이터 요청을 분리했지만, 사용자가 휠을 한 단계씩 멈추거나 지도를 조금씩 이동할 때마다 결과와 마커가 다시 구성되면 여전히 화면이 부산스럽게 느껴진다.

실서비스 `GET /api/map/places` 측정값은 콜드 요청 약 1.07초, 이후 약 0.25~0.35초였다. 서버 응답 속도만의 문제라기보다 FE가 사용자 조작을 요청 단위로 너무 세밀하게 해석하는 것이 핵심이다.

## 목표

- 휠 줌과 지도 드래그가 끝난 뒤 900ms 동안 추가 조작이 없을 때만 갱신 판단을 한다.
- 작은 움직임과 한 단계 줌은 기존 결과를 재사용한다.
- 데이터 갱신 중에도 기존 목록과 마커를 유지한다.
- 동일한 결과가 다시 오면 React 상태와 Kakao overlay를 교체하지 않는다.
- 마커 등장 효과는 최초 표시와 명시적 카테고리 전환에서만 실행한다.
- 검색, 카테고리 선택, 현재 위치 이동, 사용자의 재시도는 즉시 반영한다.
- `prefers-reduced-motion` 환경에서는 같은 기능을 애니메이션 없이 제공한다.

## 제외 범위

- 백엔드 API 계약과 응답 형식 변경
- 카카오 지도 SDK 교체
- SWR 또는 TanStack Query 신규 도입
- 지도 디자인, 마커 그래픽, 클러스터 알고리즘 자체의 재설계
- 수동 `이 지역 재검색` 전용 흐름으로의 전환

## 선택한 접근

고정 지연만 늘리는 방식은 사용자가 매 줌 단계에서 잠시 멈추면 여전히 매번 요청한다. 완전 수동 재검색은 호출을 가장 많이 줄이지만 탐색 흐름을 끊는다. 따라서 **900ms trailing settle + 의미 있는 viewport 변화 + 조용한 background refresh**를 사용한다.

의미 있는 변화는 마지막으로 서버 결과를 확정한 viewport를 기준으로 판단한다.

- 줌: 누적 2단계 이상 달라졌을 때 갱신한다.
- 이동: `max(1.2km, 현재 viewport 반경의 20%)` 이상 중심이 이동했을 때 갱신한다.
- 두 조건 중 하나만 충족해도 한 번 갱신한다.
- 임계값 미만 변화는 마지막 확정 viewport와 비교해 누적한다. 따라서 작은 조작을 여러 번 하면 결국 필요한 시점에 갱신된다.

900ms는 700ms보다 휠 조작 사이의 짧은 정지를 잘 흡수하면서도 1초보다 의도적인 지연으로 느껴질 가능성이 낮은 절충값이다.

## 상태와 데이터 흐름

### Transient viewport

`center`와 `level`은 카카오 지도의 현재 화면 상태다. 지도 이동 중 UI와 overlay 위치 계산에는 즉시 반영하지만 데이터 요청 의존성으로 사용하지 않는다.

### Committed viewport

스토어에 마지막 확정 viewport를 한 단위로 보관한다.

```ts
type CommittedViewport = {
  center: LatLng;
  level: number;
  radius: number;
};
```

`commitViewportSearch`는 다음 상태를 하나의 Zustand `set`으로 갱신한다.

- `searchCenter`
- committed level/radius
- `isSearchDirty: false`
- 요청 revision 1회 증가

원자적 갱신으로 `searchCenter` 변경과 별도 `reload()`가 연속 실행되어 effect가 두 번 반응할 여지를 제거한다.

### 지도 조작

`useKakaoMap`은 매 `idle`에서 transient viewport만 갱신하고 이전 timer를 취소한다. 900ms 후 현재 viewport와 committed viewport를 비교한다. 임계값을 넘었을 때만 `commitViewportSearch`를 한 번 호출한다.

검색, 카테고리, 현재 위치, 재시도처럼 사용자가 결과 갱신을 명시한 동작은 settle timer를 기다리지 않고 force commit한다.

### 데이터 요청

`useMapData`는 transient `level`을 구독하지 않는다. committed revision, 검색 중심, 모드, 카테고리 변화만 요청을 시작한다.

- 정보 모드: 장소 API만 호출한다.
- 온기 모드: 온기 API만 호출한다.
- 새 요청이 시작되면 이전 요청을 abort한다.
- 초기 데이터가 없을 때만 skeleton을 사용한다.
- background refresh 중에는 현재 목록과 마커를 유지한다.
- background refresh가 실패하면 기존 결과를 유지하고 다음 명시적 재시도 또는 viewport commit에서 다시 시도한다.

## 결과 및 마커 안정성

장소 응답의 렌더링 필드 전체가 현재 결과와 같으면 `setItems`를 호출하지 않아 목록 정렬, 페이지, Kakao overlay가 불필요하게 재구성되지 않게 한다. `id`, 좌표, 카테고리 기반 marker signature는 별도로 계산해 구조적 동일성을 표현하되, 이름·이미지·주소 같은 최신 표시 데이터가 누락되지 않도록 items 동등성 판단과 분리한다.

결과가 실제로 달라진 경우에만 목록과 마커를 교체한다. 기존 데이터는 응답이 성공할 때까지 유지하므로 빈 화면이나 중간 skeleton으로 돌아가지 않는다.

`PlaceMarkers`의 `burstIn`은 다음에만 실행한다.

- 페이지 최초의 비어 있지 않은 결과 표시
- 사용자가 카테고리를 명시적으로 바꾼 뒤 첫 결과 표시

viewport background refresh와 동일 결과 재사용에서는 등장 애니메이션을 실행하지 않는다. 줌 중에는 카카오 SDK가 기존 overlay를 자연스럽게 이동시키며, 새 결과가 확정될 때만 조용히 내용이 바뀐다.

## 오류 처리

- AbortError는 사용자에게 오류로 표시하지 않는다.
- 첫 요청 실패로 표시할 데이터가 없을 때만 기존 전체 오류 상태와 재시도 버튼을 사용한다.
- background refresh 실패 시 기존 결과를 유지한다. 화면 전체를 오류 상태로 바꾸지 않는다.
- 연속 실패를 자동 고빈도 retry로 바꾸지 않는다. 다음 viewport commit 또는 사용자의 재시도에서 다시 요청한다.

## 테스트 및 검증

### 단위 테스트

- 900ms 이전에는 committed revision이 변하지 않는다.
- 연속된 여러 `idle`은 마지막 이벤트로부터 900ms 뒤 한 번만 commit한다.
- 누적 줌 1단계는 요청하지 않고 2단계는 한 번 요청한다.
- 이동 임계값은 최소 1.2km이며 넓은 viewport에서는 반경의 20%로 증가한다.
- transient `level` 변경만으로 `useMapData`가 실행되지 않는다.
- 정보 모드는 장소 API만, 온기 모드는 온기 API만 호출한다.
- 렌더링 필드 전체가 동일한 응답은 `items` reference를 교체하지 않는다.
- background refresh 실패 시 기존 items를 유지한다.
- 마커 entrance 효과는 최초 표시 또는 카테고리 변경에만 실행한다.

### 저장소 검증

- 지도 관련 Vitest
- 전체 TypeScript 검사
- 변경 파일 ESLint
- Next.js production build
- 가능한 브라우저 환경에서 빠른 연속 휠, 단일 줌, 2단계 줌, 짧은 드래그, 큰 드래그, 카테고리 선택을 확인한다.

## 완료 기준

- 빠른 연속 휠 조작 한 묶음당 장소 또는 온기 요청이 최대 1회 발생한다.
- 한 단계 줌과 임계값 미만 이동은 네트워크 요청을 만들지 않는다.
- background refresh 동안 기존 목록과 마커가 사라지거나 skeleton으로 되돌아가지 않는다.
- 동일 결과 응답에서 마커 등장 애니메이션과 overlay 재생성이 발생하지 않는다.
- 검색·카테고리·현재 위치·재시도는 기존처럼 즉시 동작한다.
