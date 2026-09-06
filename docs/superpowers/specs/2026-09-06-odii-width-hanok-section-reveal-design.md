# Odii 섹션 폭 통일과 Hanok 섹션 Reveal 설계

## 목표

- Odii의 `장면을 따라 걷는 소리` 제목, 카테고리, 카드 레일의 좌우 경계를 다른 주요 콘텐츠 섹션과 동일하게 맞춘다.
- Hanok의 주요 섹션에 Odii가 사용하는 공용 `VesselReveal` 동작을 적용한다.
- 기존 UI 색상, typography, 콘텐츠 순서, 내부 컴포넌트 animation과 interaction은 변경하지 않는다.

## Odii 폭 계약

기준 폭은 현재 주요 섹션이 사용하는 `mx-auto w-full max-w-6xl`이다. `장면을 따라 걷는 소리`의 제목과 `OdiiEditorialRail`을 이 공통 콘텐츠 wrapper 안에 함께 배치한다.

- desktop 최대 폭은 `max-w-6xl`로 유지한다.
- 제목과 rail이 별도 중앙 정렬 wrapper를 가져 경계가 달라질 가능성을 제거한다.
- carousel 카드 크기, track 계산, overflow, 이동 animation은 변경하지 않는다.
- 다른 Odii 섹션의 폭이나 full-bleed 배경은 이번 변경에서 수정하지 않는다.

## Hanok Reveal 경계

`HanokArchive`에서 다음 콘텐츠 단위를 각각 공용 `VesselReveal`로 감싼다.

1. 페이지 인트로
2. 이달의 한옥
3. 한옥 도감
4. 한옥 스테이
5. 전국 지도
6. 한옥 매니페스토

각 단위는 독립적으로 처음 viewport reveal 경계에 진입할 때 축소 상태에서 최종 크기로 전환된다. 페이지 로드 시 이미 viewport에 보이거나 현재 scroll position보다 위에 있는 단위는 공용 모듈의 보호 규칙에 따라 최종 상태로 바로 렌더한다.

## 상태와 애니메이션

- 새로운 animation state나 observer를 Hanok에 만들지 않는다.
- `VesselReveal`의 scale, opacity, y, radius, duration, easing 기본값을 그대로 사용한다.
- `prefers-reduced-motion`에서는 동일한 최종 상태를 duration 0으로 적용한다.
- Hanok 내부 carousel, accordion, map, modal animation은 그대로 유지한다.
- snapshot-first API 갱신은 reveal state와 분리하며 데이터 갱신 때문에 섹션 reveal을 재시작하지 않는다.

## 레이아웃 안전성

- 기존 spacing wrapper인 `EditorialSection`, `ArchiveGroup`, `ArchiveSection`은 유지한다.
- reveal wrapper는 섹션의 기존 순서와 높이 계산을 바꾸지 않는다.
- 지도 lazy mount용 viewport observer와 reveal observer는 책임이 다르므로 결합하지 않는다.
- 상세 modal은 `HanokArchive` 최상위에 유지해 reveal clipping 영향을 받지 않게 한다.

## 검증

- Odii의 제목과 rail이 하나의 `max-w-6xl` 경계를 공유하는지 source-level layout test로 확인한다.
- Hanok의 여섯 콘텐츠 단위가 `VesselReveal` 경계를 갖는지 component structure test로 확인한다.
- 기존 vessel state unit tests로 reload/current viewport/reduced-motion 계약의 회귀가 없는지 확인한다.
- 전체 Vitest, TypeScript, 변경 파일 ESLint, Next production build를 실행한다.
- 가능한 경우 desktop/mobile에서 Odii 좌우 경계와 Hanok 최초 reveal을 브라우저로 확인한다.

## 제외 범위

- 색상, typography, 카드 크기, 섹션 문구 변경
- `VesselReveal`의 motion parameter 변경
- Hanok API 및 Kakao 지도 loading 전략 변경
- Odii의 다른 섹션 구조를 공통 layout component로 전면 리팩터링
