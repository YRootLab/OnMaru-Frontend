# 🎧 온마루 '마음 여행' — 한옥의 온기 & Odii(오디) 오디오 도슨트 로드맵

> **상태:** 기획 및 설계 완료 (개발 대기 중 — 사용자 승인 후 착수 예정)  
> **브랜치:** `feature/odii-audio-tour`  
> **아키텍처 표준:** Feature-Based Architecture (FSD) 준수 (`src/features/odii-audio/`)

---

## 🏛️ 1. 핵심 개발 철학
1. **외부 데이터 주입형(Decoupled Data Injection) 설계**:
   - 오디 API 명세서 규격과 100% 동일한 인터페이스(`OdiiStoryItem`)를 정의하고, 모든 UI 컴포넌트는 오직 외부 Props 및 데이터 어댑터를 통해 데이터를 주입받습니다.
   - 8월 3일 API Key가 발급되면 UI 코드는 단 한 줄도 건드리지 않고 `odiiApi.ts`에서 실시간 API 연동으로 스위칭됩니다.
2. **온마루 브랜딩 결합 (한옥 · 한국의 정 · 온기 · 전통 시장)**:
   - 단순한 오디오 목록이 아닌, **대청마루의 바람 소리, 처마 끝 풍경 소리, 옛 시장의 온기**가 녹아든 한옥 특화 오디오 서사 섹션 구성.

---

## 🎨 2. 디자인 컨셉 & 모티브 연출 흐름
- **메인 컬러:** 연지 장미 (`#D42058`, `#E03870`, `#F06090`, `#FFF0F4`)
- **배경 컬러:** 화선지 백 (`#FAF6F0`), 한지 면 (`#F5EFE6`)
- **롤모델 흐름(Flow)**:
  1. **Shopify Editions Winter 2026**: Z-Index 스태킹 스크롤 레이어 모션 (스크롤에 따라 한옥/온기 카드가 층층이 접히며 쌓임)
  2. **Kolon Mall Special Editorial**: 잡지(Magazine) 스타일의 정갈한 에디토리얼 아카이브 카드 리스트
  3. **온마루 오디 뷰어**: 한옥 앨범 아트 + 10초 스킵 + 실시간 핑크 대본 스크롤 동기화 + Local Mini Player

---

## 🏗️ 3. FSD 폴더 구조 명세 (`src/features/odii-audio/`)

```text
src/features/odii-audio/
 ├── components/
 │    ├── HeroAudioPlayer.tsx       # 대형 한옥 앨범아트 + 10초 스킵 + 감성 컨트롤러
 │    ├── ScriptSyncViewer.tsx      # 실시간 대본 스크롤 동기화 (줄 클릭 시 타임스탬프 이동)
 │    ├── StoryCarousel.tsx         # '내 주변 한옥 이야기' (거리 300m, 썸네일, 재생시간) 가로 카루셀
 │    ├── CategoryTagFilter.tsx     # '사람내음과 고운 정', '자연의 소리' 태그 칩 & 검색창
 │    ├── EditorialStoryList.tsx    # Kolon Mall 스타일의 프리미엄 한옥/시장 아카이브 리스트
 │    ├── ZIndexStackedSection.tsx  # Shopify Editions 스타일 한옥 서사 Z-index 층층이 접히는 섹션
 │    └── LocalMiniPlayer.tsx       # 오디 페이지 전용 하단 고정 미니 오디오 바
 ├── store/
 │    └── useOdiiAudioStore.ts      # 오디오 재생, 대본 타임스탬프, 북마크 전역 상태
 ├── hooks/
 │    └── useOdiiAudioPlayer.ts     # HTML5 Audio 조작 및 timeupdate 이벤트 바인딩
 ├── api/
 │    ├── odiiMockData.ts           # 오디 API 규격 호환 한옥/정/온기 데이터셋 (북촌, 소쇄원 등)
 │    └── odiiApi.ts                # 실제 오디 공공데이터 API 연동 어댑터 (8월 3일 Key 적용)
 └── types/
      └── odii.types.ts             # 이야기, 대본 라인, 카테고리 TypeScript 타입
```

---

## 🔄 4. 개발 추진 단계 (Task Flow)

### [Phase 1] 데이터 타입 & 외부 주입 어댑터 레이어 구축 
- [x] Git 브랜치 `feature/odii-audio-tour` 생성 완료
- [ ] `odii.types.ts` 인터페이스 정의
- [ ] `odiiMockData.ts` 한옥/정/온기 데이터셋 작성

### [Phase 2] 전역 오디오 상태 & 대본 동기화 엔진
- [ ] Zustand 기반 `useOdiiAudioStore.ts` 구현
- [ ] 재생 시간(`currentTime`) 변화에 맞춘 대본 하이라이트 동기화 유틸리티

### [Phase 3] 에디토리얼 UI 컴포넌트 개발 (외부 주입형)
- [ ] `HeroAudioPlayer.tsx` + `ScriptSyncViewer.tsx` 2열 레이아웃 구현
- [ ] `StoryCarousel.tsx` 가로 스크롤 카드 뷰어
- [ ] `CategoryTagFilter.tsx` & `EditorialStoryList.tsx` (Kolon Mall 스타일 한옥 리스트)
- [ ] `LocalMiniPlayer.tsx` (오디 페이지 전용 하단 플레이어)

### [Phase 4] Shopify Editions 2026 Z-Index 스태킹 모션
- [ ] GSAP ScrollTrigger 기반 스태킹 섹션 전환 애니메이션 (`ZIndexStackedSection.tsx`)

### [Phase 5] 라우터 페이지 조립 및 검증
- [ ] `src/app/odii/page.tsx` 생성 및 Feature 조립
- [ ] `npx tsc --noEmit` 검증 및 모바일 반응형 가독성 체크

---

## 💬 상의 및 진행 안내
사용자님께서 **"진행해"** 혹은 **"시작하자"**라고 해주시면 위 단계에 따라 1단계부터 차근차근 개발에 착수하겠습니다!
