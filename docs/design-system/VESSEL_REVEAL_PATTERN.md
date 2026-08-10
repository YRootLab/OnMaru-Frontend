# Vessel Reveal & Fold Design Pattern & Component Spec 🇰🇷

## 📌 Pattern Summary
**Vessel Reveal & Fold (베슬 리빌 & 폴딩 패턴)**은 Apple 및 Awwwards 우수 인터랙티브 사이트에서 채택되는 **양방향 스크롤 모핑 언폴딩/폴딩(Bi-directional Scroll Morphing Container) 디자인 패턴**입니다.

- **스크롤 진입 (Scroll Entrance)**: 화면 하단 12% 뷰포트 진입 시 **85% 축소된 네모 라운드 캡슐 박스(`scale: 0.85`, `rounded-[2.5rem]`, `border border-[#211e19]/14`)** 형태에서 시선 중심으로 이동하며 **100% 확대 개화(Unfold)되고 테두리가 소멸**합니다.
- **스크롤 이탈 (Scroll Exit)**: 화면 위로 스크롤하여 섹션을 지날 때, 다시 부드럽게 **85% 축소 네모 라운드 캡슐 박스로 접혀 들어가면서(Fold)** 수려하게 사라집니다.

---

## 🛠️ Key Specifications & Properties

| Property | Default Value | Description |
| :--- | :--- | :--- |
| **`threshold`** | `0.12` (12%) | 화면 감지 및 모핑 인터랙션이 발동하는 뷰포트 노출 비율 |
| **`duration`** | `0.85s` | 캡슐 ↔ 100% 전면 개화 간 모션 변환 시간 |
| **`scaleVessel`** | `0.85` (85%) | 이탈 및 진입 시 수축되는 네모 박스 축소 비율 |
| **`roundedVessel`**| `'2.5rem'` (40px) | 이탈 및 진입 시 네모 박스 곡률 |
| **`yVessel`** | `24px` | 수축 시 이동 Y 거리에 대한 수평 미세 오프셋 |
| **`once`** | `false` | 양방향 스크롤 모핑 수축/확대 반복 활성화 옵션 |

---

## 💻 Reusable Component Code & Import Location

### Component Path
`src/shared/components/animation/VesselReveal.tsx`

### Usage Example
```tsx
import { VesselReveal } from '@/shared/components/animation/VesselReveal';

export default function MyPageSection() {
  return (
    // 진입 시 100% 전면 개화, 이탈 시 85% 네모 박스로 수축 접힘
    <VesselReveal threshold={0.12} scaleVessel={0.85} once={false}>
      <section className="py-12 bg-white">
        <h2>양방향 스크롤 모핑 언폴딩 & 폴딩 섹션</h2>
        <p>시선 진입 시 100% 개화, 이탈 시 85% 네모 라운드 캡슐로 폴딩 수축됩니다.</p>
      </section>
    </VesselReveal>
  );
}
```
