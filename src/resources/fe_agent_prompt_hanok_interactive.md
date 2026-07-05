# 🏛️ FE Engineering Agent Prompt
## Mission: "Hanok A to Z" — 한옥 인터랙티브 해부도 (2.5D Exploded View) 구현

---

## 📌 프로젝트 컨텍스트 (Context)

당신은 **온마루(On-Maru)** 라는 한옥 문화 관광 플랫폼의 핵심 기능인 **"한옥 A to Z 스토리텔링 화면"** 의 프론트엔드 인터랙션을 구현하는 시니어 FE 엔지니어입니다.

이 화면의 목표는 사용자가 한옥의 구조(기와, 기둥, 주춧돌, 온돌 등)를 마치 **애플(Apple) 제품 페이지나 뮤지엄 인터랙티브 전시물**처럼 탐색하고, 부위를 클릭할 때마다 해당 부위가 **하얗게 빛나며(Glow Effect) 강조**되고 상세 설명이 나타나는 **하이엔드 UX**를 구현하는 것입니다.

이 컴포넌트는 **애플 디자인 어워드(Apple Design Award)** 수상작 수준의 완성도를 목표로 합니다.

---

## 🎨 레퍼런스 디자인 분석 (What We're Building)

첨부된 레퍼런스 이미지에서 확인되는 핵심 요소:

1. **전체 화면 구성**: 밝은 회색(`#f0f0f0`) 계열 배경 위에 한옥 3D 렌더링 이미지가 중앙 배치
2. **Callout UI**: 부위에서 얇은 선(`1px`, 흰색 또는 회색)이 뻗어나와 레이블(부위명 + 짧은 설명)이 연결됨
3. **클릭 시 Glow/Highlight 효과**: 선택된 부위가 하얀색으로 발광하며 나머지는 흐려짐(Dim)
4. **상단 카테고리 탭**: `뼈대 | 지붕 | 온돌 | 마루` 같은 구조 카테고리 탭 존재
5. **우측 상단 Detail 패널**: 선택된 부위의 클로즈업 이미지 + 상세 설명 패널 (glassmorphism 스타일)
6. **전체적인 톤**: 차갑지 않고, 한옥의 따뜻한 나무 질감과 어우러지는 밝고 깔끔한 회백색 계열

---

## 🛠️ 기술 스택 (Tech Stack)

```
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + Custom CSS (CSS Variables 적극 활용)
- Animation: Framer Motion (핵심 인터랙션 전담)
- 이미지 처리: Next.js <Image> 컴포넌트 + CSS clip-path, filter
- 상태관리: Zustand 또는 React useState (컴포넌트 내 로컬 상태로 충분)
- 폰트: Google Fonts - "Noto Serif KR" (한국어 고딕/명조 혼용), "Pretendard"
```

**절대 사용 금지**: Three.js, WebGL, Canvas 3D API
이 컴포넌트는 **순수 2.5D CSS 레이어 방식**으로 구현합니다.

---

## 📁 컴포넌트 구조 (Component Architecture)

```
src/
└── components/
    └── hanok/
        ├── HanokExplorer.tsx          # 최상위 컨테이너 컴포넌트
        ├── HanokCanvas.tsx            # 이미지 레이어 + 인터랙션 영역
        ├── HanokHotspot.tsx           # 개별 클릭 포인트 (Callout 포함)
        ├── HanokDetailPanel.tsx       # 우측 상세 설명 패널
        ├── HanokCategoryTab.tsx       # 상단 카테고리 탭 UI
        └── hanok.data.ts              # 모든 부위 데이터 (텍스트, 좌표 등)
```

---

## 📐 핵심 구현 명세 (Implementation Spec)

### 1. HanokExplorer.tsx (최상위 컨테이너)

```typescript
// 전체 레이아웃: 좌측(탐색 캔버스 70%) + 우측(상세 패널 30%)
// 상태: selectedPart: string | null
// Framer Motion의 AnimatePresence로 패널 진입/퇴장 애니메이션 관리
```

**레이아웃 구조**:
```
┌─────────────────────────────────────────────────────────────┐
│  [뼈대] [지붕] [온돌] [마루]  ← 상단 카테고리 탭           │
├──────────────────────────────────┬──────────────────────────┤
│                                  │  ┌────────────────────┐  │
│    한옥 이미지 + 핫스팟 영역     │  │  기와 (Giwa)       │  │
│    (HanokCanvas)                 │  │  클로즈업 이미지   │  │
│                                  │  │  + 상세 설명 텍스트 │  │
│                                  │  └────────────────────┘  │
└──────────────────────────────────┴──────────────────────────┘
```

---

### 2. HanokCanvas.tsx (이미지 레이어 + 인터랙션의 핵심)

이것이 이 기능의 심장부입니다. **레이어드 이미지 방식(Layered Image Approach)**으로 구현합니다.

#### 2-1. 이미지 레이어 구조

한옥 이미지는 다음 레이어들로 구성되며, CSS `position: absolute`로 완벽히 겹쳐져 하나처럼 보여야 합니다:

```
z-index 층위:
┌─────────────────────────┐  z-index: 50 (핫스팟 오버레이 - SVG)
├─────────────────────────┤  z-index: 40 (지붕 레이어 - 기와)
├─────────────────────────┤  z-index: 30 (상부 구조 - 대들보, 서까래)
├─────────────────────────┤  z-index: 20 (기둥, 벽체 레이어)
├─────────────────────────┤  z-index: 10 (기단, 주춧돌 레이어)
└─────────────────────────┘  z-index:  1 (배경, 마당, 그림자)
```

#### 2-2. 선택(Active) 상태 시각 처리

부위 선택 시 아래 CSS 효과를 Framer Motion으로 0.4초 ease-out 애니메이션 적용:

```css
/* 선택된 레이어 */
.layer--active {
  filter: brightness(1.8) drop-shadow(0 0 20px rgba(255, 255, 255, 0.9))
          drop-shadow(0 0 40px rgba(255, 240, 200, 0.6));
  /* 따뜻한 흰빛 발광 효과 - 차가운 파란빛이 아닌 따뜻한 아이보리빛 */
}

/* 선택되지 않은 나머지 레이어들 */
.layer--dimmed {
  filter: brightness(0.6) saturate(0.4);
  opacity: 0.7;
  transition: all 0.4s ease-out;
}
```

#### 2-3. 특수 이펙트: 온돌(Ondol) 선택 시

온돌 부위 클릭 시에는 CSS 애니메이션으로 바닥에서 붉은 파동이 퍼져나가는 효과:

```css
@keyframes ondolPulse {
  0%   { transform: scale(0.3); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

.ondol-wave {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 100, 0, 0.6), transparent 70%);
  animation: ondolPulse 2s ease-out infinite;
}

/* 파동 3겹으로 시차(delay) 줘서 겹치기 */
.ondol-wave:nth-child(2) { animation-delay: 0.6s; }
.ondol-wave:nth-child(3) { animation-delay: 1.2s; }
```

이 `.ondol-wave` div를 한옥 이미지의 바닥 위치에 `transform: skew(-15deg)` 로 원근감 있게 비틀어 배치합니다.

---

### 3. HanokHotspot.tsx (클릭 포인트 + Callout 라인)

각 부위의 클릭 포인트와 설명선(Callout)을 담당합니다.

```typescript
interface HotspotProps {
  id: string;
  label: string;           // "기둥 (Gidung)"
  shortDesc: string;       // "한옥의 수직 구조재"
  position: {              // 부모 컨테이너 기준 %값으로 위치 지정
    x: string;             // ex: "42%"
    y: string;             // ex: "55%"
  };
  calloutDirection: 'left' | 'right' | 'top' | 'bottom';
  isSelected: boolean;
  onClick: () => void;
}
```

#### 핫스팟 점(Dot) 디자인:
```css
/* 기본 상태: 작은 흰색 원 + 바깥에 pulse 링 */
.hotspot-dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.4);
}

/* Pulse 링 애니메이션 (선택 전 상태에서 주의 유도) */
@keyframes hotspotPulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.6); }
  100% { box-shadow: 0 0 0 14px rgba(255,255,255,0); }
}
```

#### Callout 선(Line) + 레이블 구현:

SVG를 사용해 핫스팟에서 레이블까지 이어지는 얇은 선을 그립니다. Framer Motion으로 선이 그려지는 `pathLength` 애니메이션 적용:

```tsx
// SVG line draw-on 애니메이션
<motion.line
  x1={dotX} y1={dotY}
  x2={labelX} y2={labelY}
  stroke="rgba(255,255,255,0.7)"
  strokeWidth={1}
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>
```

레이블 박스 스타일:
```css
.callout-label {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 6px 12px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  /* Glassmorphism 스타일 */
}
```

---

### 4. HanokDetailPanel.tsx (우측 상세 패널)

선택된 부위의 상세 정보를 표시하는 우측 슬라이드인 패널.

#### Framer Motion 진입 애니메이션:
```tsx
<AnimatePresence mode="wait">
  {selectedPart && (
    <motion.div
      key={selectedPart.id}
      initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
    >
```

#### 패널 내용 구성:
```
┌──────────────────────────┐
│  [클로즈업 이미지]        │  ← 해당 부위 클로즈업 사진 (aspect-ratio: 4/3)
│                          │     Glassmorphism card
├──────────────────────────┤
│  기와 (Giwa)             │  ← 부위명 (Noto Serif KR Bold, 22px)
│  기와지붕의 전통 곡선      │  ← 영문 서브타이틀 (14px, opacity: 0.7)
├──────────────────────────┤
│  자연의 곡선을 닮은       │  ← AI 3줄 요약 설명 (본문 텍스트)
│  한국 전통 지붕의 마감재.  │
│  암키와와 수키와가...      │
├──────────────────────────┤
│  [더 알아보기 →]          │  ← CTA 버튼 (아코디언 펼치기)
└──────────────────────────┘
```

---

### 5. hanok.data.ts (데이터 파일)

모든 부위의 정보를 이 파일에서 중앙 관리합니다.

```typescript
export interface HanokPart {
  id: string;
  nameKo: string;           // "기와"
  nameEn: string;           // "Giwa"
  layer: 'roof' | 'structure' | 'pillar' | 'foundation' | 'floor';
  position: { x: string; y: string };
  calloutDirection: 'left' | 'right' | 'top' | 'bottom';
  shortDesc: string;        // 캘아웃에 표시되는 한 줄 설명
  summary: string[];        // 패널에 표시되는 3줄 요약 (배열 3개)
  fullDescription: string;  // 아코디언 펼쳤을 때 전체 설명
  detailImageSrc: string;   // 클로즈업 이미지 경로
  specialEffect?: 'ondol' | 'wind' | 'light'; // 특수 이펙트 여부
}

export const HANOK_PARTS: HanokPart[] = [
  {
    id: 'giwa',
    nameKo: '기와',
    nameEn: 'Giwa (Roof Tile)',
    layer: 'roof',
    position: { x: '50%', y: '18%' },
    calloutDirection: 'top',
    shortDesc: '자연의 곡선을 품은 처마',
    summary: [
      '기와는 암기와와 수기와의 음양 원리로 배열되어 빗물을 자연스럽게 흘려보냅니다.',
      '처마의 완만한 곡선(현수곡선)은 수학적으로 가장 아름다운 선이자, 빗물을 멀리 튕겨내는 실용적 공학입니다.',
      '한옥 기와의 짙은 청회색은 제조 과정에서 탄소를 흡수해 자연스럽게 만들어지는 색입니다.',
    ],
    fullDescription: '...',
    detailImageSrc: '/images/hanok/giwa-detail.jpg',
  },
  {
    id: 'gidung',
    nameKo: '기둥',
    nameEn: 'Gidung (Pillar)',
    layer: 'pillar',
    position: { x: '35%', y: '52%' },
    calloutDirection: 'left',
    shortDesc: '하늘과 땅을 잇는 수직의 힘',
    summary: [
      '한옥의 기둥은 배흘림기법(엔타시스)으로 중간이 약간 불룩한데, 이는 시각적 착시를 교정해 더 곧게 보이도록 하는 고대의 지혜입니다.',
      '기둥의 두께와 높이 비율은 수백 년의 경험으로 정립된 황금비율을 따릅니다.',
      '기둥은 지붕의 하중만 받고, 벽은 하중을 받지 않아 창호를 어디든 설치할 수 있습니다.',
    ],
    fullDescription: '...',
    detailImageSrc: '/images/hanok/gidung-detail.jpg',
  },
  {
    id: 'juchutdol',
    nameKo: '주춧돌',
    nameEn: 'Juchutdol (Foundation Stone)',
    layer: 'foundation',
    position: { x: '38%', y: '72%' },
    calloutDirection: 'bottom',
    shortDesc: '자연을 거스르지 않는 기초',
    summary: [
      '주춧돌은 다듬지 않은 자연석을 그대로 사용합니다. 대신 기둥 밑동을 돌의 울퉁불퉁한 면에 맞춰 정밀하게 깎아내는데, 이를 "그랭이 기법"이라 합니다.',
      '그랭이 기법으로 접합된 기둥과 주춧돌은 접착제 없이도 지진과 강풍에 안전하게 버팁니다.',
      '자연의 형태에 인공물을 맞추는 이 방식은 한국 건축 철학의 핵심: 자연을 이기는 것이 아닌 자연과 어우러지는 것입니다.',
    ],
    fullDescription: '...',
    detailImageSrc: '/images/hanok/juchutdol-detail.jpg',
  },
  {
    id: 'ondol',
    nameKo: '온돌',
    nameEn: 'Ondol (Under-floor Heating)',
    layer: 'floor',
    position: { x: '55%', y: '68%' },
    calloutDirection: 'right',
    shortDesc: '불과 흙의 미학: 세계 최초 바닥 난방',
    summary: [
      '아궁이에서 시작된 열기는 구들장 아래 고래(연도)를 따라 방 전체로 퍼져나가며 바닥을 데웁니다.',
      '뜨거운 공기가 아닌 복사열(방사열)로 데우는 온돌은 현대 과학이 증명한 가장 효율적이고 건강한 난방 방식입니다.',
      '온돌은 유네스코 인류무형문화유산으로 등재된 한국 고유의 발명품입니다.',
    ],
    fullDescription: '...',
    detailImageSrc: '/images/hanok/ondol-detail.jpg',
    specialEffect: 'ondol',
  },
  {
    id: 'changho',
    nameKo: '창호',
    nameEn: 'Changho (Paper Screen Door)',
    layer: 'structure',
    position: { x: '62%', y: '48%' },
    calloutDirection: 'right',
    shortDesc: '빛을 거르는 한지의 과학',
    summary: [
      '창호지(한지)는 단순히 빛을 막는 것이 아니라 빛을 산란시켜 방 안으로 은은하고 고른 조명을 제공합니다.',
      '한지는 수천 개의 미세한 구멍이 있어 공기를 통과시키면서도 소리와 바람을 차단하는 반투과성 소재입니다.',
      '겨울엔 단열재, 여름엔 통풍구가 되는 창호는 한옥의 스마트한 패시브 에너지 시스템입니다.',
    ],
    fullDescription: '...',
    detailImageSrc: '/images/hanok/changho-detail.jpg',
    specialEffect: 'light',
  },
  {
    id: 'maru',
    nameKo: '대청마루',
    nameEn: 'Daecheong Maru (Open Hall)',
    layer: 'floor',
    position: { x: '45%', y: '60%' },
    calloutDirection: 'left',
    shortDesc: '바람이 쉬어가는 안과 밖의 경계',
    summary: [
      '대청마루는 안방과 건넌방 사이의 개방된 공간으로, 한옥의 여름 냉방 시스템입니다.',
      '앞뒤 문을 모두 열면 앞마당에서 뒷마당으로 바람이 관통하며 자연 환기가 이루어집니다.',
      '"마루"는 온마루 서비스의 어원이 된 공간으로, 내부와 외부, 사람과 사람이 만나는 경계 없는 환대의 장소입니다.',
    ],
    fullDescription: '...',
    detailImageSrc: '/images/hanok/maru-detail.jpg',
    specialEffect: 'wind',
  },
];
```

---

## 🎬 인터랙션 흐름 상세 명세 (Interaction Flow)

### 시나리오 1: 페이지 최초 진입
1. 한옥 전체 이미지가 `opacity: 0` → `1`로 1초간 서서히 등장 (fade-in)
2. 등장 완료 후 0.5초 뒤, 각 핫스팟 점(Dot)들이 순차적으로(staggered, 0.1s 간격) 나타남
3. 핫스팟 Dot들이 pulse 애니메이션 시작 (조용히 클릭을 유도)
4. 우측 패널은 완전히 비어있는 상태 (`null` state)

### 시나리오 2: 핫스팟 첫 번째 클릭 (예: 기와 클릭)
1. 클릭과 동시에 모든 레이어에 `brightness(0.6) saturate(0.4)` dimming 효과 (0.3s ease)
2. '기와' 레이어(`z-index: 40`)에만 `brightness(1.8) drop-shadow(흰빛 글로우)` 효과 적용 (0.3s ease)
3. Callout 라인이 SVG `pathLength` 0→1 로 선이 그려지는 애니메이션 (0.4s)
4. 우측 상세 패널이 `x: 30 → 0` + `blur(8px) → blur(0px)` 으로 슬라이드인 (0.45s)
5. 패널 내부 텍스트는 0.1s delay 후 줄 단위로 순차 등장

### 시나리오 3: 다른 부위로 전환 (기와 → 기둥 클릭)
1. 우측 패널이 `x: 0 → -20` + `blur(0px) → blur(4px)` 로 퇴장
2. 기와 glowing 해제 + 기둥 glowing 시작 (동시에 0.3s ease)
3. 우측 패널에 기둥 정보가 새로 슬라이드인

### 시나리오 4: 온돌(Ondol) 클릭 특수 이펙트
1. 기본 dimming + glowing 효과 동일하게 적용
2. **추가로:** 한옥 바닥 위치에 `ondolPulse` 애니메이션이 시작됨
3. 붉은색/주황색 방사형 파동 3겹이 2초 주기로 반복 퍼져나감
4. 온돌 부위 선택이 해제되면 파동 애니메이션 즉시 stop + `opacity: 0`으로 fade-out

### 시나리오 5: 빈 배경 클릭 (선택 해제)
1. 모든 dimming 효과 해제, 전체 이미지 원상복귀 (0.5s ease)
2. 우측 패널 퇴장 애니메이션
3. 핫스팟 Dot들 다시 pulse 상태로 복귀

---

## 📱 반응형 대응 (Responsive)

```
Desktop (≥1280px): 좌(캔버스 65%) + 우(패널 35%) 2단 레이아웃
Tablet (768-1279px): 상(캔버스 60vh) + 하(패널 슬라이드업) 레이아웃
Mobile (<768px): 풀스크린 캔버스, 선택 시 하단에서 Sheet 형태로 패널 올라옴
```

---

## ⚡ 성능 최적화 요구사항

1. **이미지 최적화**: 모든 한옥 레이어 이미지는 Next.js `<Image>` 컴포넌트로 처리, WebP 포맷 사용
2. **Lazy Loading**: 상세 패널의 클로즈업 이미지는 선택 시에만 로드 (`priority={false}`)
3. **CSS will-change**: 애니메이션이 발생하는 레이어에 `will-change: transform, filter` 사전 선언으로 GPU 가속
4. **Framer Motion 최적화**: `layout` prop은 반드시 필요한 곳에만 사용, 과도한 re-render 방지
5. **Preload 처리**: 페이지 진입 시 핵심 레이어 이미지(`roof`, `pillar`)는 `<link rel="preload">` 처리

---

## ✅ 완료 기준 (Definition of Done)

다음 항목이 모두 충족되어야 구현 완료로 간주합니다:

- [ ] 6개 부위(기와, 기둥, 주춧돌, 온돌, 창호, 대청마루) 모두 클릭 가능
- [ ] 선택 시 Glow 효과와 나머지 Dim 효과가 부드럽게 (0.3~0.5s) 전환됨
- [ ] Callout 라인이 선을 그리는 애니메이션으로 나타남
- [ ] 우측 패널이 각 부위 전환 시 부드럽게 전환됨
- [ ] 온돌 선택 시 붉은 파동 이펙트가 재생됨
- [ ] 빈 영역 클릭 시 선택이 해제되고 전체가 원상복귀됨
- [ ] 데스크탑 / 태블릿 / 모바일 3가지 뷰포트에서 정상 동작함
- [ ] Lighthouse Performance 점수 90점 이상
- [ ] 전체 인터랙션에서 60fps 유지 (Chrome DevTools Performance 탭 확인)

---

## 🖼️ 이미지 에셋 요구사항

개발자는 아래 이미지 에셋이 필요합니다. 디자이너/PM에게 아래 목록 기준으로 요청하세요:

```
public/images/hanok/
├── layer_background.png     # 배경, 마당, 그림자 레이어 (투명 배경 PNG)
├── layer_foundation.png     # 기단, 계단 레이어 (투명 배경 PNG)
├── layer_pillar.png         # 기둥, 벽체, 창호 레이어 (투명 배경 PNG)
├── layer_structure.png      # 대들보, 서까래 레이어 (투명 배경 PNG)
├── layer_roof.png           # 기와지붕 레이어 (투명 배경 PNG)
├── giwa-detail.jpg          # 기와 클로즈업 (4:3 비율, 600×450px)
├── gidung-detail.jpg        # 기둥 클로즈업
├── juchutdol-detail.jpg     # 주춧돌 클로즈업
├── ondol-detail.jpg         # 온돌 클로즈업
├── changho-detail.jpg       # 창호 클로즈업
└── maru-detail.jpg          # 대청마루 클로즈업
```

**이미지 규격**:
- 레이어 이미지: 최소 1600×900px, 투명 배경 PNG
- 디자인 스타일: 따뜻한 아이보리 톤 배경, 클레이 렌더링 스타일, 밝고 부드러운 스튜디오 조명
- 레이어들을 겹쳤을 때 한 장의 완전한 한옥이 되어야 함 (각 레이어 좌표계 동일)

---

*이 프롬프트는 온마루(On-Maru) 플랫폼의 FE 엔지니어링 Agent에게 전달하기 위해 작성되었습니다.*
*작성: Product Manager / 기획팀*
