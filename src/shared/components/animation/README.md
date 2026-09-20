# Shared Animation — VesselReveal

`VesselReveal`은 긴 페이지의 섹션이 viewport 하단 경계를 통과할 때 부드러운 스케일 및 페이드인 모핑(`scaleFrom` -> origin `1.0`)을 적용하는 스크롤 리빌 애니메이션 컴포넌트입니다.
UI 렌더링 및 모션 적용은 `VesselReveal.tsx`, 위치 및 스크롤 방향에 따른 상태 전이는 `vesselRevealState.ts`가 담당합니다.

---

## 📐 핵심 애니메이션 규칙 (Scroll Reveal Transition Rules)

### 1. 하향 스크롤 시 최초 1회 리빌 (Downscroll Discovery)
- 사용자가 아래로 스크롤하여 뷰포트 하단(Reveal Boundary: viewport 하단 33% 지점)을 통해 **새롭게 진입하는 미노출 섹션**만 `scaleFrom` (0.92) -> origin `1.0` 스케일 업, 약간 아래(`y: 6px`)에서 제자리로 올라오는 페이드인 애니메이션을 부드럽게 1회 실행하며 `bloomed` 상태로 안착합니다.

### 2. reveal boundary 기반 폴드와 재진입 (Boundary Transition)
- 아래로 스크롤해 reveal boundary에 새롭게 진입하는 섹션만 `vessel` -> `bloomed` scale-up 애니메이션을 실행합니다.
- 위로 스크롤해 기존 섹션이 reveal boundary 아래로 밀려나면 `bloomed` -> `vessel` scale-down 애니메이션을 실행합니다.
- 이미 `bloomed` 상태였던 섹션이 reveal boundary 위쪽으로 이동할 때는 최종 상태를 유지하므로, 위에서 새롭게 보이는 섹션에 scale-up 애니메이션이 재생되지 않습니다.
- 아래로 다시 스크롤해 접혀 있던 섹션이 reveal boundary로 재진입하면 scale-up 애니메이션을 다시 실행합니다. 섹션 내부 UI나 콘텐츠는 변경하지 않습니다.

### 3. 새로고침 시 스케일 변형 방지 (Reload / Refresh Protection)
- 페이지 새로고침 시 현재 스크롤 위치 및 그 위에 존재하는 모든 섹션은 축소 후 확대되는 모핑 없이 즉시 최종 규격(`bloomed`, `scale: 1.0`, `isReloadProtected: true`)으로 고정 렌더링됩니다.
- 비동기 데이터 패치 중에는 스켈레톤 UI가 1:1 크기 footprint를 선점하며, 데이터 로드 완료 후에도 스케일 애니메이션 없이 부드럽게 콘텐츠로 치환됩니다.
- 새로고침 이후 아직 뷰포트에 들어오지 않은 섹션은 `vessel`로 대기하고, 뷰포트에 진입할 때마다 스케일 리빌(`scaleFrom` -> `1.0`)이 동작합니다.

### 4. 성능 최적화 (Observer-based Viewport Tracking)
- reveal 경계 observer는 진입 시점을 감지하고, viewport observer는 위/아래 이탈 시점을 감지합니다. 두 observer 모두 `VesselReveal` 인스턴스 단위로 정리되어 전역 스크롤 리스너와 불필요한 페이지 리렌더링을 만들지 않습니다.

---

## 🛠️ 유지보수 및 아키텍처 경계

- **데이터 상태 독립성**: API loading, skeleton, 비동기 응답 완료 여부로 reveal 상태를 임의 조작하지 않습니다. 애니메이션 상태 전이는 오직 뷰포트의 기하학적 위치(`top`, `revealBoundary`)와 `isInitialObservation`에 의해서만 결정됩니다.
- **시각적 토큰 보존**: `scaleFrom`, `roundedFrom`, `duration`, `ease`는 `VesselReveal`의 기본 시각 디자인 계약입니다. 상태 로직 수정 시 이 값들을 임의로 훼손하지 않습니다.
- **접근성 준수 (`prefers-reduced-motion`)**: 사용자가 모션 감소 설정을 활성화한 경우 동일한 stage(`bloomed`)가 즉시 적용되며 transition duration은 0으로 처리됩니다.

---

## 🧪 상태 검증 테스트

`vesselRevealState.test.ts`를 통해 다음 동작들이 100% 자동 검증됩니다:
1. 새로고침 및 최초 마운트 시 뷰포트 내/상단 섹션의 즉각적인 `bloomed` 보호
2. 최초 마운트 시 하단 미노출 섹션의 `vessel` 대기 상태 유지
3. 하향 스크롤 진입 시 1회성 `bloomed` 전환 및 보호 플래그 활성화
4. reveal boundary 아래 이탈 시 scale-down 및 위쪽 이동 시 bloomed 유지
5. 접힌 섹션의 reveal boundary 재진입 시 scale-up 애니메이션 재생

```bash
npx vitest run src/shared/components/animation/vesselRevealState.test.ts
```
