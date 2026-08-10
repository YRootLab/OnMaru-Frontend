# Vessel Reveal & Fold Design Pattern & Component Spec 🇰🇷

## 📌 Pattern Summary
**Vessel Reveal (하단 전용 80% 스크롤 모핑 패턴)**은 화면 하단 경계(Bottom Viewport) 진입/이탈 시에만 네모 캡슐 80% 모핑 애니메이션이 작동하고, 화면 상단 경계(Top Viewport)에서는 100% 완전한 상태로 상쇄(Clamp)되는 **하단 비대칭 스크롤 렌더링 패턴**입니다.

---

## 🧭 Scroll Trajectory Matrix (4개 스크롤 상황 정밀 동작표)

| 스크롤 상황 | 이동 방향 | 뷰포트 위치 | 동작 및 스케일 (Scale) |
| :--- | :--- | :--- | :--- |
| **Case A** | 아래로 스크롤 (Down) | 화면 하단 진입 → 중앙 | **80% 네모 라운드 캡슐** → **100% 전면 개화** (Expand) |
| **Case B** | 아래로 스크롤 (Down) | 화면 중앙 → 상단 이탈 | **100% 평면 유지 (애니메이션 무반응)** |
| **Case C** | 위로 스크롤 (Up) | 화면 상단 재진입 → 중앙 | **100% 평면 유지 (애니메이션 무반응)** |
| **Case D** | 위로 스크롤 (Up) | 화면 중앙 → 하단 이탈 | **100%** → **80% 네모 라운드 캡슐 수축 접힘** (Fold) |

---

## 🛠️ Key Specifications & Properties

| Property | Default Value | Description |
| :--- | :--- | :--- |
| **`scaleFrom`** | `0.80` (80%) | 하단 진입/이탈 시 모핑 캡슐 박스 축소 비율 |
| **`offsetRange`** | `['start 0.98', 'start 0.68']` | 하단 98% ~ 68% 구간에서만 보간 애니메이션 적용 오프셋 |
| **`roundedFrom`** | `'2.5rem'` (40px) | 하단 캡슐 박스 모핑 곡률 |
| **`yFrom`** | `32px` | 하단 등판 수평 미세 오프셋 |

---

## 💻 Reusable Component Code & Import Location

### Component Path
`src/shared/components/animation/VesselReveal.tsx`

### Usage Example
```tsx
import { VesselReveal } from '@/shared/components/animation/VesselReveal';

export default function MyPageSection() {
  return (
    // 하단 80% 모핑 ↔ 상단 100% 무반응 웰메이드 스크롤 모션 적용
    <VesselReveal scaleFrom={0.80}>
      <section className="py-12 bg-white">
        <h2>하단 전용 80% 스크롤 모핑 언폴딩 섹션</h2>
        <p>아래에서 등판할 때만 80% 캡슐에서 100%로 전개되며 상단 이탈 시에는 100%를 유지합니다.</p>
      </section>
    </VesselReveal>
  );
}
```
