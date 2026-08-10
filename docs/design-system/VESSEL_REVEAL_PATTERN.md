# Vessel Reveal & Fold Design Pattern & Component Spec 🇰🇷

## 📌 Pattern Summary
**Vessel Reveal (은은한 부유 언폴딩 패턴)**은 화면 하단 진입 시 갑자기 튀어 오르는 점프 현상(Pop/Jump)을 철저히 억제하고, 하단 경계에서 자연스럽게 대기하다 실크처럼 수려하게 펼쳐지는 **실크 모핑 디자인 패턴**입니다.

---

## 🛠️ Refined Key Specifications & Properties

| Property | Default Value | Description |
| :--- | :--- | :--- |
| **`scaleFrom`** | `0.92` (92%) | 튐 현상이 없는 은은한 라운드 캡슐 축소 비율 |
| **`yFrom`** | `6px` | 급작스러운 위쪽 팝업 점프를 방지하는 미세 수평 오프셋 |
| **`threshold`** | `0.08` (8%) | 하단 경계 진입 즉시 부드럽게 언폴딩이 시작되는 림 |
| **`duration`** | `0.95s` | `cubic-bezier(0.22, 1, 0.36, 1)` 실크 이징 곡선 시간 |
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
    // 튐 현상 없이 은은하게 92% -> 100% 실크 개화
    <VesselReveal scaleFrom={0.92} duration={0.95}>
      <section className="py-12 bg-white">
        <h2>자연스러운 부유 스크롤 언폴딩 섹션</h2>
        <p>하단 경계에서 은은하게 대기하다 실크처럼 부드럽게 펼쳐집니다.</p>
      </section>
    </VesselReveal>
  );
}
```
