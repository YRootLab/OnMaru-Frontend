# Shared Animation

## VesselReveal

`VesselReveal`은 긴 페이지의 섹션이 viewport 하단 25% 경계를 통과할 때 기존 vessel morph를 적용한다. UI 렌더링은 `VesselReveal.tsx`, 위치에 따른 상태 결정은 `vesselRevealState.ts`가 담당한다.

### 상태 규칙

- 최초 렌더 기본값은 `bloomed`다. SSR 또는 hydration 중 현재 화면이 먼저 축소되어 보였다가 커지는 flash를 막기 위한 값이다.
- `useLayoutEffect`가 paint 전에 각 섹션 위치를 측정한다. 실제 viewport 하단보다 아래의 아직 보이지 않는 섹션만 animation 없이 `vessel`로 준비한다.
- 현재 viewport 또는 그 위에 있는 섹션은 최초 측정에서 `isReloadProtected`가 된다. 초기 보호에는 75% reveal 경계가 아니라 `window.innerHeight`를 사용하므로 화면 아래쪽 25%에 걸린 섹션도 새로고침 직후 움직이지 않는다.
- 보호되지 않은 아래 섹션은 reveal 경계에 들어오면 `vessel -> bloomed`로 전환한다.
- 위로 스크롤해 보호되지 않은 섹션이 viewport 하단 경계 밖으로 사라지면 `bloomed -> vessel`로 전환한다.
- 아래로 스크롤해 viewport 위로 지나간 섹션은 현재 상태를 유지한다. 보이지 않는 위쪽에서 불필요한 fold를 실행하지 않는다.

### 유지보수 경계

- API loading, skeleton, 응답 완료 여부로 reveal 상태를 변경하지 않는다. 애니메이션 상태는 viewport geometry만 사용한다.
- `scaleFrom`, `roundedFrom`, `duration`과 기존 opacity/y/easing은 `VesselReveal`의 visual contract다. 상태 버그를 수정할 때 이 값들을 함께 변경하지 않는다.
- `isReloadProtected`는 storage에 저장하지 않는 mount-local snapshot이다. 경로를 다시 방문하면 그 시점의 scroll restoration 위치로 새로 계산한다.
- `prefers-reduced-motion`에서는 동일한 stage를 적용하되 transition duration만 0으로 만든다.

### 상태 모듈 변경 시 확인할 테스트

`vesselRevealState.test.ts`는 초기 viewport 전체 보호, 초기 하단 fold, 하향 reveal, 상향 fold, viewport 위쪽 상태 유지 동작을 검증한다.

```bash
npx vitest run src/shared/components/animation/vesselRevealState.test.ts
```
