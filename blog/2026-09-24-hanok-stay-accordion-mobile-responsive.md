# 지역별 한옥 스테이 아코디언의 모바일 레이아웃이 세 가지 이유로 깨지고 있었다

작성일: 2026-09-24
브랜치: `fix/hanok-stay-mobile-responsive`
파일: `src/features/hanok-archive/sections/HanokStayAccordion.tsx`

---

## 한 줄 요약

framer-motion의 `flex` 인라인 스타일이 CSS `width`를 덮어쓰고, 버튼 총 폭이 모바일 카드 폭을 초과하고, 높이 줄어들 때 overflow:hidden 클리핑이 아이콘과 버튼을 잘라냈다. 세 문제를 각각 수직 레이아웃 전환·버튼 레이아웃 재설계·exit 애니메이션 단축으로 해결했다.

---

## 문제 현상

모바일(375px, 320px 기기)에서 지역별 한옥 스테이 섹션을 열면 다음 증상이 동시에 나타났다.

1. 수평 아코디언 필 너비가 의도와 달리 모두 비슷하게 작아져 버렸다. 활성 카드가 거의 화면 너비를 차지해야 하는데 좁게 표시됐고, 비활성 카드도 지정한 60px보다 작아졌다.
2. 활성 카드(확장 상태)에서 Home 아이콘 버튼·"예약 정보 확인하기" 버튼·"숙소 상세" 버튼이 카드 경계 밖으로 밀려나거나 겹쳐 보였다.
3. 다른 카드를 눌러 현재 활성 카드를 접을 때, 카드가 줄어드는 동안 아이콘과 버튼 텍스트가 잘려나가는 형태로 깨져 보였다.

---

## 원인 분석

### 원인 1: framer-motion `flex` 인라인 스타일이 CSS `width`를 덮어씀

데스크톱에서 아코디언은 framer-motion이 `animate={{ flex: isActive ? 3.5 : 0.6 }}`을 구동한다. `flex` 단축 속성은 내부적으로 `flex-grow flex-shrink flex-basis`로 풀리는데, `flex: 0.6`은 `flex-basis: 0%`를 포함한다. CSS `flex-basis`는 `width` 속성보다 우선순위가 높아서 인라인 스타일로 설정된 `flex-basis: 0%`가 CSS 클래스의 `width: 60px`을 완전히 무시하게 된다.

```css
/* CSS 클래스 — 모바일에서 적용되길 기대한 스타일 */
@media (max-width: 768px) {
  width: calc(100vw - 80px); /* 활성 */
  width: 60px;               /* 비활성 */
}
```

```js
// framer-motion 인라인 스타일 — CSS를 덮어씀
style={{ flex: '0.6 1 0%' }}
```

결과적으로 7개 비활성 카드가 `flex: 0.6`의 비율로 공간을 나눠 갖게 돼 각각 약 30px 정도가 됐고, 활성 카드도 `calc(100vw - 80px)` 대신 `3.5 / 7.1` 비율인 약 175px만 차지했다.

### 원인 2: 버튼 총 폭이 모바일 오버레이 폭을 초과

활성 카드 오버레이(`ActiveContentOverlay`)는 `left: 16px; right: 16px`이라 375px 화면에서 유효 폭은 약 343px이다. 여기에 들어가는 `BottomActionRow`의 요소 폭을 추산하면 다음과 같다.

| 요소 | 추산 폭 |
|---|---|
| `ActiveIconButton` (Home 아이콘 원형) | 44px |
| gap | 8px |
| "예약 정보 확인하기" + ExternalLink (font-size xs, padding 9px 15px) | ~163px |
| gap | 6px |
| "숙소 상세" + ArrowRight | ~78px |
| **합계** | **299px** |

343px < 299px 상황이 아니어서 겨우 들어간다고 볼 수도 있지만, 실제 페이지 컨테이너의 좌우 패딩(약 16–24px)이 추가되면 오버레이 유효 폭은 295px 이하로 줄어든다. 320px 기기에서는 오버레이 폭이 270px대로 더 좁아져 버튼이 명백히 넘쳤다.

### 원인 3: height 줄어들 때 `overflow:hidden` 클리핑이 버튼을 잘라냄

높이 애니메이션(280 → 64px)이 진행되는 동안 `AnimatePresence`의 exit 애니메이션(opacity fade, duration 0.22s)이 동시에 실행된다. `AccordionPill`의 `overflow: hidden`은 카드 높이가 줄어들수록 bottom에서 위 방향으로 콘텐츠를 잘라낸다. `ActiveContentOverlay`는 `position: absolute; bottom: 16px`로 카드 하단에 앵커돼 있어서, 카드가 줄어들수록 오버레이 상단부터 순서대로 잘린다.

spring 애니메이션(`stiffness: 350, damping: 32`)은 완전히 안정되는 데 약 0.4–0.5초 걸리는 반면, exit fade는 0.22초이다. 두 애니메이션의 속도 차이로 인해 약 0.1–0.15초 구간에서 오버레이가 완전히 사라지지 않은 채로 카드가 좁아지면서 아이콘·버튼 레이아웃이 절반씩 잘린 상태로 보이게 된다.

```
t=0      : 탭 → height 280px, overlay 불투명
t=0.15   : overlay opacity ~30%, height ~200px → 버튼이 잘린 상태로 희미하게 보임 ← 문제 구간
t=0.22   : overlay opacity 0 → 사라짐
t=0.5    : height 64px → 완전히 접힘
```

---

## 해결 방법

### 수정 1: 모바일에서 수평 → 수직 아코디언 레이아웃 전환

framer-motion이 `flex`를 인라인 스타일로 설정하는 이상, CSS `width` 오버라이드로는 이를 이길 수 없다. 대신 `isMobile` 상태를 추가해 모바일에서는 `height` 애니메이션으로 대체했다.

```tsx
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const mq = window.matchMedia('(max-width: 767px)');
  setIsMobile(mq.matches);
  const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

```tsx
// 애니메이션 분기
animate={isMobile
  ? { height: isActive ? 280 : 64 }
  : { flex: isActive ? 3.5 : 0.6 }}
```

`AccordionContainer`의 모바일 CSS도 수직 레이아웃으로 바꿔 수평 스크롤을 제거했다.

```css
@media (max-width: 768px) {
  flex-direction: column;
  align-items: stretch;
  overflow-x: hidden;
  scroll-snap-type: none;
  min-height: unset;
  gap: 10px;
}
```

수직 레이아웃에서 접힌 카드에 콘텐츠가 없으면 단순한 검은 띠처럼 보이므로, `MobileCollapsedRow`를 추가해 `지역 뱃지 | 숙소 이름 | ChevronDown` 조합을 표시했다. 이 요소는 CSS `display: none / flex` 전환으로 데스크톱에서 숨긴다.

### 수정 2: 모바일 버튼 레이아웃 재설계

`ActiveIconButton`(Home 아이콘 원형)과 `DetailActionBtn`("숙소 상세")은 동일한 콜백(`onSelectStay / onSelectVillage`)을 호출한다. 모바일에서 공간을 차지하면서 중복 기능을 제공하므로, 모바일(≤640px)에서는 아이콘 버튼을 숨기고 텍스트 버튼 두 개만 남겼다.

```css
/* ActiveIconButton */
@media (max-width: 640px) {
  display: none;
}
```

나머지 두 버튼은 `flex: 1`로 가용 폭을 균등하게 나눠 갖는다.

```css
/* ActionGroup */
@media (max-width: 640px) {
  flex: 1;
}

/* DirectBookingBtn, DetailActionBtn */
@media (max-width: 640px) {
  flex: 1;
  justify-content: center;
  padding: 9px 10px;
  font-size: 12px;
}
```

320px 기기에서도 두 버튼이 각각 약 130px씩 차지하므로 여유 있게 들어간다.

### 수정 3: 모바일 exit 애니메이션 단축

카드가 접힐 때 오버레이 콘텐츠가 즉시 사라지도록 exit 애니메이션을 0.08초로 단축했다. height spring 애니메이션보다 훨씬 빠르게 끝나기 때문에, 카드가 눈에 띄게 줄기 전에 콘텐츠가 이미 사라진다.

```tsx
initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 12 }}
exit={isMobile ? { opacity: 0 } : { opacity: 0, y: 8 }}
transition={isMobile ? { duration: 0.08 } : { duration: 0.22 }}
```

y 이동도 제거했다. 수직 레이아웃에서 카드 자체가 수직으로 움직이는 상황에서 오버레이가 추가로 y 방향으로 움직이면 어색하다.

---

## 핵심 교훈

**framer-motion `flex` 애니메이션과 CSS `width`는 절대로 함께 쓰지 않는다.**  
`flex` 단축 속성은 `flex-basis`를 포함하고, `flex-basis`는 `width`보다 우선한다. CSS로 너비를 제어하려면 애니메이션 타겟도 `width`여야 한다. 반응형 중단점에서 레이아웃 방향이 바뀐다면(수평↔수직), framer-motion의 애니메이션 타겟도 함께 바꿔야 한다.

**두 버튼이 같은 일을 한다면 더 큰 화면에서만 둘 다 보여준다.**  
모바일처럼 공간이 좁은 환경에서 중복 UI는 레이아웃 깨짐의 직접 원인이 된다.

**exit 애니메이션은 부모의 size 애니메이션보다 빠르게 끝나야 한다.**  
`overflow: hidden`인 부모 안에서 자식 콘텐츠를 exit 애니메이션으로 제거할 때, 부모 크기가 줄어드는 속도가 자식 퇴장보다 빠르면 자식이 잘린 상태로 보인다. exit는 부모 크기 변화보다 먼저 끝내야 한다.

---

## 변경 커밋

| 커밋 | 내용 |
|---|---|
| `d7b8d1a` | 수직 아코디언·isMobile 훅·MobileCollapsedRow 추가 |
| `9488680` | 버튼 overflow 수정·ActiveIconButton 모바일 숨김·exit 단축 |
