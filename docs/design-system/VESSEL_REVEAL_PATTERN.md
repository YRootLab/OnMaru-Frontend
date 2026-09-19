# Vessel Reveal & Fold Design Pattern & Component Spec 🇰🇷

## 📌 Pattern Summary
**Vessel Reveal (선제적 하단 25% 뷰포트 스크롤 모핑 패턴)**은 사용자가 화면을 스크롤하여 섹션을 벗어날 때 뒤늦게 수축되는 현상을 방지하기 위해, **화면 하단 25% 영역(`vh * 0.75`) 진입 시 선제적으로 수축 폴딩(Fold)**이 작동하는 반응형 스크롤 패턴입니다.

---

## 🛠️ Key Specifications & Properties

| Property | Default Value | Description |
| :--- | :--- | :--- |
| **`exitThresholdRatio`** | `0.75` (vh * 0.75) | 선제적 수축 폴딩이 시작되는 화면 하단 25% 뷰포트 임계선 |
| **`scaleFrom`** | `0.92` (92%) | 하단 영역 수축 시 라운드 캡슐 축소 비율 |
| **`yFrom`** | `6px` | 급작스러운 위쪽 팝업 점프를 방지하는 미세 수평 오프셋 |
| **`duration`** | `0.85s` | `cubic-bezier(0.22, 1, 0.36, 1)` 실크 이징 곡선 시간 |
| **`roundedFrom`** | `'2.2rem'` (35px) | 부드러운 라운드 캡슐 곡률 |

---

## 💻 Reusable Component Code & Import Location

### Component Path
`src/shared/components/animation/VesselReveal.tsx`

### Usage Example
```tsx
import { VesselReveal } from '@/shared/components/animation/VesselReveal';

export default function MyPageSection() {
  return (
    // 화면 하단 25% 영역 진입 시 뒤늦음 없이 즉각 선제적 수축 폴딩
    <VesselReveal exitThresholdRatio={0.75} scaleFrom={0.92}>
      <section className="py-12 bg-white">
        <h2>선제적 하단 스크롤 언폴딩 & 폴딩 섹션</h2>
        <p>하단 25% 뷰포트 영역에서 사용자의 이탈 의도를 선제적으로 감지하여 부드럽게 수축됩니다.</p>
      </section>
    </VesselReveal>
  );
}
```
