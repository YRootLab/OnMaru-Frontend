# 오디 섹션 2 초기 진입 시 좌우 그라데이션 뒤 그림자가 남는 문제를 해결했다

작성일: 2026-08-12

## 한 줄 요약

섹션 2가 아래에서 위로 처음 등장할 때 `leading`/`trailing` 탐색 버튼의 linear gradient 투명 영역 뒤로 이전 `VesselReveal` 프레임의 어두운 그림자가 비치던 문제를 확인하고, 카드 스테이지에 독립적인 흰색 배경과 stacking context를 적용해 해결했다.

## 문제 현상

처음 섹션 2로 스크롤하면 좌우 탐색 버튼의 gradient 끝부분 뒤에 검은색 또는 어두운 그림자처럼 보이는 영역이 남았다.

![수정 전 증상: 섹션 2 좌측 gradient 뒤에 어두운 그림자가 남아 있는 상태](/blog/odii-section2-gradient-shadow-before.png)

특징은 다음과 같았다.

- 첫 진입 시에만 발생했다.
- 중앙 카드를 좌우로 한 번 이동하면 어두운 영역이 사라졌다.
- 카드와 화살표 버튼 자체가 깨진 것이 아니라, 버튼 양옆 gradient의 투명한 끝부분 뒤에 배경이 비쳤다.
- 최신 develop의 Section 2 원본과 leading/trailing 버튼 구조는 정상적으로 반영되어 있었다.

## 재현 조건

1. `/odii` 페이지를 연다.
2. 페이지를 아래로 스크롤해 섹션 2가 화면 하단에서 위로 등장하게 한다.
3. 카드가 처음 나타나는 순간 좌우 탐색 영역을 확인한다.
4. 다음/이전 버튼을 한 번 누른 뒤 같은 위치를 다시 확인한다.

첫 진입 시에는 gradient 뒤에 부모 영역의 그림자가 보이고, 카드 이동 이후에는 정상적인 흰색 배경처럼 보이는 차이가 발생했다.

## 원인 분석

### 1. 부모 `VesselReveal`의 초기 shadow

섹션 2는 `VesselReveal` 안에서 렌더링된다. 초기 상태에서는 다음 스타일이 적용된다.

```ts
boxShadow: '0 16px 36px rgba(33, 30, 25, 0.08)'
```

스크롤 진입 전후의 모핑 과정에서 부모가 그림자를 가지고 있는 상태가 잠시 유지된다.

### 2. Section 2 stage가 투명함

기존 카드 stage는 다음처럼 배경색 없이 렌더링되고 있었다.

```tsx
<div className="relative mt-0 h-[325px] overflow-hidden ...">
```

좌우 버튼은 다음 형태의 gradient를 사용한다.

```text
왼쪽:  white → white/80 → transparent
오른쪽: transparent ← white/80 ← white
```

따라서 gradient의 투명한 끝부분에서는 카드 stage의 배경이 아니라, 부모 `VesselReveal`의 그림자와 합성된 배경이 노출될 수 있었다.

### 3. 카드 이동이 재페인트를 유발

카드 이동 시 track transform과 transition 상태가 갱신되면서 브라우저가 해당 레이어를 다시 합성했다. 그 결과 어두운 영역이 사라져 문제가 이동 동작으로 해결된 것처럼 보였다.

즉, 카드 이동 로직이 원인을 해결한 것이 아니라 레이어 재합성 타이밍이 증상을 숨긴 것이었다.

## 해결 방법

Section 2 본체의 카드와 이동 로직은 유지하고, 카드 stage에만 두 가지 스타일을 추가했다.

```tsx
<div className="relative isolate mt-0 h-[325px] overflow-hidden bg-white pt-2 pb-4 ...">
```

### `bg-white`

gradient의 투명 영역이 부모의 shadow를 통과하지 않고 흰색 stage 배경을 보도록 했다.

### `isolate`

카드 stage를 독립적인 stacking context로 분리해 부모 `VesselReveal`의 그림자와 내부 gradient/card 레이어가 불필요하게 섞이지 않도록 했다.

이번 수정에서는 다음 항목을 변경하지 않았다.

- Section 2 카드 크기
- 중앙 포커스 카드 애니메이션
- leading/trailing 버튼의 이동 동작
- linear gradient 방향
- 원형 레일과 active position 계산
- `VesselReveal` 공통 컴포넌트

## 적용 파일

- `src/features/odii-audio/components/OdiiEditorialRail.tsx`
  - 카드 stage에 `bg-white`와 `isolate` 추가
- `public/blog/odii-section2-gradient-shadow-before.png`
  - 사용자가 제공한 수정 전 증상 스냅샷

## 검증

실행한 검증 명령:

```bash
npx tsc --noEmit
git diff --check
```

결과:

- TypeScript 검사 종료 코드 `0`
- diff whitespace 검사 통과
- 변경 범위는 `OdiiEditorialRail.tsx`의 카드 stage 스타일 한 곳으로 제한

현재 실행 환경에서는 브라우저 연결이 제공되지 않아 수정 후 자동 스크린샷은 추가하지 못했다. 수정 후 캡처가 가능해지면 아래 위치에 추가하면 된다.

```text
public/blog/odii-section2-gradient-shadow-after.png
```

그리고 이 문서에 다음 링크를 추가한다.

```md
![수정 후 증상 제거 상태](/blog/odii-section2-gradient-shadow-after.png)
```

## 회고

이번 문제는 navigation button이나 carousel transform의 오류가 아니라, 투명 gradient가 어느 레이어를 비추고 있는지에 대한 배경 합성 문제였다. 특히 스크롤 reveal 애니메이션과 카드 레일을 함께 사용할 때는 다음 세 가지를 별도로 확인해야 한다.

1. 부모 reveal wrapper의 초기 shadow와 opacity
2. 자식 stage의 명시적인 배경색
3. gradient와 transform layer의 stacking context

카드 이동 후 문제가 사라지는 경우에도 이동 로직을 먼저 의심하기보다, 이동 전후의 레이어 합성과 repaint 차이를 확인하는 것이 더 정확한 접근이었다.
