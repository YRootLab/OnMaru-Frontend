# Vessel Reveal Design Pattern & Component Spec 🇰🇷

## 📌 Pattern Summary
**Vessel Reveal (베슬 리빌 패턴)**은 Apple 및 Awwwards 우수 인터랙티브 사이트에서 채택되는 **고급 모듈형 스크롤 언폴딩(Scroll Unfolding Container) 디자인 패턴**입니다.

사용자가 스크롤을 내리며 화면의 하단 영역(기본 12% 뷰포트)에 진입할 때, 섹션 콘텐츠가 **은은하게 캡슐화된 모던 보더 박스(Rounded Vessel Container)** 형태로 나타납니다. 시선 중심에 다다르면서 부드럽게 개화(Unfold & Scale Up)하고 테두리가 사르르 소멸하며 광활한 에디토리얼 화면으로 자연스럽게 전환됩니다.

---

## 🛠️ Key Specifications & Properties

| Property | Default Value | Description |
| :--- | :--- | :--- |
| **`threshold`** | `0.12` (12%) | 화면 하단에 진입하여 모핑 애니메이션이 발동하는 뷰포트 노출 비율 |
| **`duration`** | `0.85s` | 캡슐 상태에서 전면 개화(Unfold)까지의 모션 시간 |
| **`roundedFrom`** | `'2.5rem'` (40px) | 진입 초기 라운드 캡슐 곡률 |
| **`scaleFrom`** | `0.94` | 진입 초기 축소 스케일 |
| **`yFrom`** | `28px` | 진입 초기 하단 미세 이동 거리 |
| **`once`** | `true` | 상단 이탈 시 어색한 재수축 방지를 위한 단방향 보장 옵션 |

---

## 💻 Reusable Component Code & Import Location

### Component Path
`src/shared/components/animation/VesselReveal.tsx`

### Usage Example
```tsx
import { VesselReveal } from '@/shared/components/animation/VesselReveal';

export default function MyPageSection() {
  return (
    <VesselReveal threshold={0.12} duration={0.85}>
      <section className="py-12 bg-white">
        <h2>자연스러운 스크롤 언폴딩 섹션</h2>
        <p>스크롤 시 12% 지점에서 모던 캡슐이 수려하게 개화합니다.</p>
      </section>
    </VesselReveal>
  );
}
```

---

## 🎨 Recommended Design Principles
1. **Hero Section Exception (상단 히어로 섹션 제외)**:
   - 페이지 최상단(Hero Section)은 진입 시 즉시 시원하게 정보를 전달하기 위해 `VesselReveal` 모핑보다는 직관적인 `Fade/Slide` 모션을 권장합니다.
2. **Sequential Flow (섹션 2 이하 연속 적용)**:
   - 섹션 2부터 하단 CTA 섹션까지 `VesselReveal`을 감싸주면, 사용자의 시선 흐름에 맞춰 리드미컬하고 압도적인 스크롤텔링(Scrollytelling) 몰입감을 연출할 수 있습니다.
