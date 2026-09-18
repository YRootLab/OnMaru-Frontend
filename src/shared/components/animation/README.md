# Shared Animation — VesselReveal

`VesselReveal`은 긴 페이지의 섹션이 viewport 하단 경계를 통과할 때 부드러운 스케일 및 페이드인 모핑(`scaleFrom` -> origin `1.0`)을 적용하는 스크롤 리빌 애니메이션 컴포넌트입니다.
UI 렌더링 및 모션 적용은 `VesselReveal.tsx`, 위치 및 스크롤 방향에 따른 상태 전이는 `vesselRevealState.ts`가 담당합니다.

---

## 📐 핵심 애니메이션 규칙 (Scroll Reveal Transition Rules)

### 1. 하향 스크롤 시 최초 1회 리빌 (Downscroll Discovery)
- 사용자가 아래로 스크롤하여 뷰포트 하단(Reveal Boundary: viewport 하단 33% 지점)을 통해 **새롭게 진입하는 미노출 섹션**만 `scaleFrom` (0.96) -> origin `1.0` 스케일 업, `blurFrom`(8px) -> `0px` 블러 해제, 약간 아래(`y: 6px`)에서 제자리로 올라오는 페이드인 애니메이션을 부드럽게 1회 실행하며 `bloomed` 상태로 안착합니다.

### 2. 상향 스크롤 및 화면 밖 이탈 시 상태 고정 (Upward Exit & Re-entry Persistence)
- **상단 이탈 시**: 스크롤을 내려 섹션이 뷰포트 위쪽으로 지나갈 때 어떠한 축소나 되감기 애니메이션도 실행하지 않습니다.
- **역방향 재진입 시**: 사용자가 다시 위로 스크롤하여 섹션이 뷰포트 상단에서 내려오거나 하단으로 밀려나더라도, 이미 노출된 섹션은 영구적으로 `bloomed` (`scale: 1.0`) 상태를 고정 유지합니다. **축소되었다가 다시 커지는(Fold & Replay) 불필요한 반복 모션은 절대 발생하지 않습니다.**

### 3. 새로고침 시 스케일 변형 방지 (Reload / Refresh Protection)
- 페이지 새로고침 시 현재 스크롤 위치 및 그 위에 존재하는 모든 섹션은 축소 후 확대되는 모핑 없이 즉시 최종 규격(`bloomed`, `scale: 1.0`, `isReloadProtected: true`)으로 고정 렌더링됩니다.
- 비동기 데이터 패치 중에는 스켈레톤 UI가 1:1 크기 footprint를 선점하며, 데이터 로드 완료 후에도 스케일 애니메이션 없이 부드럽게 콘텐츠로 치환됩니다.
- 새로고침 이후 사용자가 아직 보지 않은 하단 섹션으로 스크롤을 내릴 때만 정상적으로 1회성 스케일 리빌(`scaleFrom` -> `1.0`)이 동작합니다.

### 4. 성능 최적화 (Zero Observer Overhead)
- 한 번 `bloomed`로 전환되거나 새로고침으로 보호된 섹션은 `IntersectionObserver` 관찰을 즉시 해제(`unobserve`)하여 스크롤 중 불필요한 연산 및 리렌더링 부하를 완전히 차단합니다.

---

## 🛠️ 유지보수 및 아키텍처 경계

- **데이터 상태 독립성**: API loading, skeleton, 비동기 응답 완료 여부로 reveal 상태를 임의 조작하지 않습니다. 애니메이션 상태 전이는 오직 뷰포트의 기하학적 위치(`top`, `revealBoundary`)와 `isInitialObservation`에 의해서만 결정됩니다.
- **시각적 토큰 보존**: `scaleFrom`, `roundedFrom`, `blurFrom`, `duration`, `ease`는 `VesselReveal`의 기본 시각 디자인 계약입니다. 상태 로직 수정 시 이 값들을 임의로 훼손하지 않습니다.
- **접근성 준수 (`prefers-reduced-motion`)**: 사용자가 모션 감소 설정을 활성화한 경우 동일한 stage(`bloomed`)가 즉시 적용되며 transition duration은 0으로 처리됩니다.

---

## 🧪 상태 검증 테스트

`vesselRevealState.test.ts`를 통해 다음 동작들이 100% 자동 검증됩니다:
1. 새로고침 및 최초 마운트 시 뷰포트 내/상단 섹션의 즉각적인 `bloomed` 보호
2. 최초 마운트 시 하단 미노출 섹션의 `vessel` 대기 상태 유지
3. 하향 스크롤 진입 시 1회성 `bloomed` 전환 및 보호 플래그 활성화
4. 역방향(상향) 스크롤 시 `bloomed` 상태 영구 유지 (Fold 방지)
5. 뷰포트 상단 밖으로 벗어났을 때의 상태 유지

```bash
npx vitest run src/shared/components/animation/vesselRevealState.test.ts
```
