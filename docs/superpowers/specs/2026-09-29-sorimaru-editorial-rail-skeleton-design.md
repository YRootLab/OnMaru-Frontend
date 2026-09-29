# 소리마루 Editorial Rail 스켈레톤 UI 설계

## 목표

소리마루 장면 카드 레일의 초기 데이터 로딩과 새로고침(revalidating) 동안 카드 외곽 레이아웃은 유지하고, 이미지와 카드 내부 데이터 자리만 중성 회색 스켈레톤으로 표시한다.

## 설계

- `SorimaruAudioFeature`가 `initialLoading` 또는 catalog의 `loading` 상태를 `SorimaruEditorialRail`의 `isLoading`으로 전달한다.
- `SorimaruEditorialRail`은 로딩 중에도 기존 카드 트랙, `activePosition`, 카드 간격, 반응형 카드 크기, transform을 유지한다.
- 기존 데이터가 있는 새로고침 중에는 현재 visible virtual position을 사용하고, 초기 데이터가 없어 `featured`가 비어 있으면 active position 기준 5개의 placeholder position을 사용한다.
- 카드 내부는 이미지 전체 영역, 하단 패널의 badge/title/subtitle/duration 자리를 skeleton block으로 바꾼다. 카드 외곽의 회전·확대·opacity 애니메이션은 유지한다.
- 로딩 중에는 자동 이동과 카드 선택을 막아 skeleton이 데이터 도착 전 위치를 바꾸지 않도록 한다. 로딩이 끝나면 기존 인터랙션을 복원한다.
- shimmer 색상은 `AGENTS.md` 규칙에 따라 중성 회색을 사용하고, `prefers-reduced-motion`에서는 shimmer 애니메이션을 끈다.

## 검증 기준

- 초기 로딩에도 category navigation, carousel stage, indicator 영역의 footprint가 유지된다.
- 새로고침 중 기존 active position과 visible 카드 수가 유지되며, skeleton 카드의 반응형 width/height가 실제 카드와 동일하다.
- 로딩이 끝나면 실제 카드 내용이 같은 위치에서 렌더링된다.
- 기존 카드 선택/카테고리 전환 테스트가 계속 통과하고, 로딩 상태의 `aria-busy`가 유지된다.
