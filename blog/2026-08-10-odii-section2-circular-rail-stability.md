# 오디 섹션 2를 원형 재사용 레일로 바꾸고 카드 깜빡임과 이미지 교체 문제를 해결했다

작성일: 2026-08-10

## 한 줄 요약

오디 섹션 2의 전체 트랙 재구성과 물리 슬롯별 이미지 교체가 흰색 플래시를 만들고 있었고, 원형 복사본·고정 슬롯·이미지 preload로 필요한 카드만 갱신하도록 개선했다.

## 문제 현상

오디 섹션 2에서 다음 문제가 반복됐다.

- `index + 1`, `index + 2`를 연속으로 이동하면 화면이 흰색으로 깜빡였다.
- 자동 다음 카드 이동이 끝난 뒤에도 한 번 리로드되는 것처럼 보였다.
- API 응답은 정상인데 스켈레톤이 카드 위를 덮거나, 카드 이미지가 빈 이미지로 보였다.
- 이미지 URL이 없는 이야기는 기본 이미지를 사용했지만, 원형 이동 후 같은 이야기에 다른 기본 이미지가 나타났다.
- 카드가 많아질수록 Framer Motion과 이미지 decode가 동시에 발생했다.

## 원인 분석

### 1. 120개 반복 트랙과 무한 보정

초기 구현은 최대 120개의 카드 요소를 만들고 `activePosition`을 증가시키다가 트랙 끝에서 위치를 되돌렸다. 논리적인 이야기 index와 물리적인 카드 DOM 위치가 멀어지면, 보정 순간 여러 카드의 `opacity`, `scale`, `transform`, 이미지가 동시에 바뀌었다.

### 2. 재사용 슬롯의 이미지 교체

재사용되는 카드가 새 이야기를 받는 순간 `<img src>`가 즉시 바뀌었다. 새 이미지가 decode되기 전 기존 이미지가 사라지면서 카드가 빈 흰색 영역으로 보였다.

### 3. fallback 이미지 seed에 물리 슬롯이 포함됨

기존 기본 이미지 선택은 이야기와 카드 위치를 함께 seed로 사용했다.

```ts
fallbackImageFor(story, position)
```

같은 이야기가 다른 원형 복사본의 position으로 이동하면 기본 이미지도 달라졌다. 기본 이미지는 물리 DOM 위치가 아니라 이야기 자체에 종속되어야 한다.

### 4. 로딩 상태가 실제 카드보다 우선됨

카드가 이미 있어도 `isCategoryLoading`이 true이면 스켈레톤을 렌더링하는 구조가 있었다. 부모 아카이브 로딩과 섹션 2 카테고리 로딩이 섞여 API 응답이 완료된 뒤에도 카드가 가려질 수 있었다.

## 최종 해결 전략

### 원형 복사본 3개

현재 playable 데이터 최대 10개를 세 묶음으로 구성한다.

```text
[1 ... 10] [1 ... 10] [1 ... 10]
                 ↑ 현재 영역
```

가운데 복사본에서 이동하다가 좌우 경계에 가까워지면, 트랜지션이 끝난 뒤 동일한 논리 카드가 있는 복사본으로 위치만 보정한다. 일반적인 `index++`, `index+2` 이동에서는 전체 트랙을 재생성하지 않는다.

따라서 카드 DOM은 기존 120개에서 최대 30개 슬롯으로 줄어든다. 이것은 전체 페이지 DOM이 30개라는 뜻이 아니라, 섹션 2의 카드 컨테이너 슬롯 수가 최대 30개라는 의미다.

### 카드 컴포넌트 memoization

`EditorialRailCard`를 별도 컴포넌트로 분리하고 `React.memo`를 적용했다. 화면 밖 카드와 변화가 없는 카드는 부모 레일이 갱신되어도 다시 렌더링하지 않는다. 이동에 필요한 주변 카드만 `offset`, `opacity`, `scale`, `rotate`를 갱신한다.

### 이미지 preload 후 교체

재사용 카드가 새 이야기를 받으면 기존 이미지를 즉시 제거하지 않는다.

1. 새 이미지 URL을 preload한다.
2. `onload`가 완료되면 해당 슬롯의 표시 이미지 URL을 교체한다.
3. 로딩 중에는 이전 이미지를 유지한다.
4. 실패하면 결정적인 fallback 이미지를 유지한다.

이 방식으로 카드 데이터는 새로 주입하면서도 이미지 레이어가 빈 상태가 되는 것을 방지한다.

### 결정적인 fallback 이미지

fallback은 이제 이야기 ID 또는 제목만으로 계산한다.

```ts
const fallbackImageFor = (story: OdiiStoryItem) => {
  const seed = Array.from(story.stid || story.title)
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return imageSet[seed % imageSet.length];
};
```

같은 이야기는 어느 원형 복사본이나 어느 물리 슬롯에 있어도 같은 기본 이미지를 사용한다.

## API와 캐시 안정화

`odiiApi.ts`에는 다음 정책을 적용했다.

- 같은 날짜의 동일 요청은 메모리 캐시와 `localStorage` 캐시를 사용한다.
- 캐시 키에 날짜, 카테고리, 키워드, 페이지, 페이지 크기를 포함한다.
- 같은 요청이 진행 중이면 in-flight Promise를 공유한다.
- 빈 응답은 캐시하지 않는다.
- API 실패를 목업 데이터로 대체하지 않고 오류 상태로 전달한다.
- 장시간 응답이 없으면 재시도 UI를 보여준다.

API가 정상이어도 부모 아카이브 요청이 늦다는 이유로 섹션 2를 스켈레톤으로 덮지 않도록 로딩 상태도 분리했다.

## 적용 파일

- `src/features/odii-audio/components/OdiiEditorialRail.tsx`
  - 원형 3-copy 레일
  - 고정 물리 슬롯
  - `EditorialRailCard` memoization
  - 이미지 preload 및 기존 이미지 유지
  - 결정적인 fallback 이미지
  - 전환 중 입력 잠금과 위치 보정
- `src/features/odii-audio/components/OdiiAudioFeature.tsx`
  - 섹션 2와 부모 아카이브 로딩 분리
  - 섹션 등장 애니메이션 복구
- `src/features/odii-audio/context/OdiiDependencyContext.tsx`
  - Provider value memoization
- `src/features/odii-audio/api/odiiApi.ts`
  - 날짜 단위 캐시와 in-flight deduplication
- `src/features/odii-audio/api/odiiNetwork.ts`
  - 네트워크 요청/응답 로그와 timeout

## 검증

- `npx tsc --noEmit`: 통과
- `npm run test:odii`: 4개 테스트 통과
- `npm run build`: 통과
- 실 API stories/nearby 요청: HTTP 200 확인

## 회고

이번 문제의 핵심은 카드 데이터를 줄이는 것만으로 해결되지 않는다는 점이었다. 재사용할 DOM 슬롯, 논리적인 이야기 index, 이미지 decode 시점, Framer Motion 상태를 함께 관리해야 했다. 특히 같은 이야기를 다른 물리 슬롯에 주입할 때 이미지가 비어 있지 않도록 기존 이미지를 유지한 뒤 새 이미지가 준비되었을 때 교체하는 것이 중요했다.

최종 구조는 가로 프레젠테이션 레일의 시각적 애니메이션을 유지하면서, 전체 트랙 재구성 대신 원형 복사본과 고정 슬롯에 데이터만 주입하는 방식이다.
