# Vessel Reveal 스크롤 복귀 및 새로고침 상태 설계

## 목표

Odii 섹션의 기존 scale, y, opacity, border radius, duration, easing은 유지하면서 다음 상태 전이를 보장한다.

- 현재 페이지에서 아래로 이동할 때 아직 보지 않은 섹션만 `vessel -> bloomed`로 나타난다.
- 위로 이동할 때 viewport 하단 경계를 지나 아래로 사라지는 섹션만 `bloomed -> vessel`로 접힌다.
- 화면 위쪽으로 지나간 섹션은 offscreen에서 임의로 접히지 않는다.
- 새로고침 시 현재 viewport와 그 위에 있는 섹션은 첫 paint부터 `bloomed`이며 축소 후 확대되는 animation을 재생하지 않는다.
- `prefers-reduced-motion`에서는 같은 최종 상태를 duration 0으로 적용한다.

## 원인

현재 `VesselReveal`은 `hasRevealedRef`가 한 번 `true`가 되면 `getVesselRevealStage()`가 항상 `bloomed`를 반환한다. 그 결과 아래에서 위로 되돌아가도 하단으로 사라지는 섹션이 다시 `vessel`이 되지 않는다. 반대로 초기 상태는 항상 `vessel`로 생성되므로, scroll restoration과 IntersectionObserver 첫 callback 사이에 축소 상태가 노출될 여지도 있다.

## 상태 모델

상태 계산 입력을 다음처럼 분리한다.

- `isInitialObservation`: 해당 섹션의 첫 IntersectionObserver callback인지 여부.
- `isReloadProtected`: 첫 관찰 당시 섹션 상단이 reveal 경계보다 위에 있었는지 여부. 마운트 중에는 유지한다.
- `isIntersecting`: 축소된 observer root 안에 섹션이 들어왔는지 여부.
- `top`과 `revealBoundary`: 섹션이 observer 하단으로 사라지는지, 화면 위로 지나간 것인지 구분한다.

전이 규칙:

1. `useLayoutEffect`의 최초 동기 측정에서 `top < revealBoundary`이면 `bloomed`, `shouldAnimate: false`, `isReloadProtected: true`다.
2. 최초 동기 측정에서 아직 아래에 있으면 `vessel`, `shouldAnimate: false`다.
3. 보호되지 않은 섹션이 observer root에 진입하면 `bloomed`로 전환한다.
4. 보호되지 않은 섹션이 `top >= revealBoundary`로 하단을 벗어나면 `vessel`로 전환한다.
5. `top < revealBoundary`인데 intersect하지 않는 경우는 화면 위로 지나간 상태이므로 현재 stage를 유지한다.
6. SSR과 hydration 기본 stage는 `bloomed`로 둔다. 현재 화면을 축소한 HTML로 먼저 그리지 않으며, 보이지 않는 아래 섹션은 layout effect에서 paint 전에 `vessel`로 맞춘다.
7. 최초 동기 측정은 항상 duration 0이며, 이후 observer callback에서 stage가 바뀔 때만 기존 duration을 사용한다.

`isReloadProtected`는 영구 저장소가 아니라 현재 mount의 초기 위치 snapshot이다. 따라서 route를 새로 방문했을 때는 새 scroll 위치를 기준으로 다시 계산하며, API data loading과 독립적으로 visual state를 결정한다.

## 코드 경계

- `vesselRevealState.ts`: DOM과 무관한 순수 전이 함수 및 타입을 담당한다.
- `VesselReveal.tsx`: paint 전 최초 위치를 측정하고 초기 보호 flag를 ref로 보관한 뒤 IntersectionObserver 결과를 순수 함수에 전달한다.
- Odii 개별 섹션: 변경하지 않는다.

## 검증

순수 상태 테스트로 다음을 고정한다.

- 초기 viewport/상단 섹션은 animation 없이 bloom된다.
- 초기 하단 섹션은 animation 없이 vessel로 남는다.
- 새 섹션은 하단 경계 진입 시 bloom된다.
- 본 섹션이 위로 스크롤하는 과정에서 하단 경계를 벗어나면 vessel로 돌아간다.
- 화면 위로 지나간 섹션은 stage를 변경하지 않는다.
- reload-protected 섹션은 observer 하단에 있더라도 bloom 상태를 유지한다.
- reduced motion은 상태는 같고 transition duration만 0이다.

전체 Vitest, TypeScript, build를 실행한다. 자동화 브라우저를 사용할 수 없으면 실제 scroll restoration visual 검증은 명시적인 잔여 항목으로 남긴다.
