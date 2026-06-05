# 온마루 Design System — `tmp_design_sys`

> Emotion CSS 기반 라이트/다크 컬러 토큰 시스템

---

## 📁 파일 구조

```
tmp_design_sys/
├── tokens.ts            # 원시 컬러 램프 + Semantic Token + createTheme()
├── ThemeProvider.tsx    # Emotion ThemeProvider 래퍼 + useOnmaruTheme 훅
├── components.tsx       # styled / css 방식 공통 컴포넌트
└── README.md
```

---

## ⚡ 빠른 시작

### 1. 설치

```bash
npm install @emotion/react @emotion/styled
```

### 2. 앱 최상단에 Provider 감싸기

```tsx
// main.tsx 또는 App.tsx
import { OnmaruThemeProvider } from './tmp_design_sys/ThemeProvider';

<OnmaruThemeProvider defaultMode="light" followSystem>
  <App />
</OnmaruThemeProvider>;
```

### 3. 컴포넌트에서 바로 사용

```tsx
import {
  CTAButton,
  NavButton,
  DocentButton,
  HanokCard,
} from './tmp_design_sys/components';
import { useOnmaruTheme } from './tmp_design_sys/ThemeProvider';

function MyComponent() {
  const { theme, toggleMode } = useOnmaruTheme();

  return (
    <HanokCard>
      <CTAButton>온기 남기기</CTAButton>
      <NavButton>지도 보기</NavButton>
      <DocentButton>▶ 도슨트</DocentButton>
      <button onClick={toggleMode}>모드 전환</button>
    </HanokCard>
  );
}
```

---

## 🎨 컬러 역할표

| 토큰             | 라이트    | 다크      | 역할                   |
| ---------------- | --------- | --------- | ---------------------- |
| `action.primary` | `#E85A18` | `#F07030` | CTA · 체크인 · 온기 핀 |
| `nav.primary`    | `#1E7A68` | `#3DB898` | 지도 탐색 · 탭         |
| `badge.star`     | `#F5A623` | `#FFCC40` | 별점 · 추천 · 장터     |
| `docent.primary` | `#D42058` | `#F06090` | 오디 도슨트 · 플레이어 |
| `info.primary`   | `#2B5CE6` | `#6088F0` | 건축 데이터 · 링크     |
| `bg.app`         | `#FAF6F0` | `#0E0B07` | 앱 배경                |
| `text.primary`   | `#2A1A0A` | `#E8D8B8` | 본문 텍스트            |

---

## 📦 tokens.ts 핵심 구조

```
primitive        →  7단계 컬러 램프 (원시값)
semanticTokens   →  light / dark 역할별 분기
createTheme()    →  최종 테마 객체 생성
lightTheme       →  createTheme('light') 인스턴스
darkTheme        →  createTheme('dark')  인스턴스
```

---

## 🪝 ThemeProvider.tsx 핵심 API

| 항목                                             | 설명                                             |
| ------------------------------------------------ | ------------------------------------------------ | ----------------- |
| `<OnmaruThemeProvider defaultMode followSystem>` | 앱 루트에 한 번만                                |
| `useOnmaruTheme()`                               | `theme` · `mode` · `toggleMode` · `setMode` 반환 |
| `followSystem`                                   | 시스템 다크모드 자동 감지 (기본 `true`)          |
| localStorage                                     | `onmaru-color-mode` 키로 모드 자동 저장          |
| `data-theme`                                     | `<html data-theme="light                         | dark">` 자동 주입 |

---

## 🧩 components.tsx 제공 컴포넌트

| 컴포넌트            | 컬러        | 용도                   |
| ------------------- | ----------- | ---------------------- |
| `CTAButton`         | 단청 주홍   | 온기 남기기, 주요 액션 |
| `NavButton`         | 대청 청록   | 지도 보기, 탐색 링크   |
| `DocentButton`      | 연지 장미   | 도슨트 재생            |
| `StarBadge`         | 황금 기와   | 별점, 추천             |
| `InfoTag`           | 청화 코발트 | 건축 데이터, 외부 링크 |
| `HanokCard`         | 중성        | 한옥 카드 컨테이너     |
| `SearchInput`       | 중성        | 검색창                 |
| `BottomSheet`       | 중성        | 한옥 상세 바텀시트     |
| `TabBar / TabItem`  | 중성/주홍   | 하단 탭 바             |
| `ThemeToggleButton` | —           | 라이트↔다크 전환 버튼  |

---

## 🌡️ Hue 충돌 검증

```
단청 주홍  21°  ──────────────────────────────
황금 기와  38°  ── (+17°)
대청 청록 168°  ────────────── (+130°)
청화 코발트 224° ─────────────────── (+56°)
연지 장미  340° ──────────────────────────── (+116°)
```

---

_온마루 (On-Maru) Design System v1.0 · 2026_
