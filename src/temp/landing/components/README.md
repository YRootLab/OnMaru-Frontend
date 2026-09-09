# 🏛️ 온마루(OnMaru) 랜딩 컴포넌트 개발자 가이드라인

이 디렉토리 (`src/components/landing/`)는 **온마루 메인 랜딩 페이지(Landing Page)의 3D 스크롤 스토리텔링 서사 컴포넌트들**을 모아둔 공간입니다.

---

## 📜 랜딩 서사 진행 순서 (Narrative Flow)

랜딩 페이지는 3D 한옥 메쉬 및 조명 연출 위에 서사 순서대로 텍스트와 인터랙션 카드가 시퀀스 형태로 오버레이됩니다:

```
[ 3D 자원 로딩 ] (LandingLoader)
       ↓
[ 1. 히어로 인트로 ] (LandingHero)
       ↓
[ 2. 24절기 처마 그림자 ] (LandingSolarShadow)
       ↓
[ 3. 7단계 한옥 부재 조립 ] (LandingHanokAssembly)
       ↓
[ 4. 여백과 침묵 스토리 ] (LandingPhilosophy)
       ↓
[ 5. 서비스 탐색 CTA ] (LandingCallToAction)
```

---

## 📂 파일별 역할 명세 (File Architecture)

| 파일명 | 주요 역할 및 담당 서사 | 연동 3D / 상태 |
| :--- | :--- | :--- |
| **`LandingLoader.jsx`** | 3D 자원(`anchae.glb`) 로딩 진행률(0%~100%) 추적 스크린. 로딩 완료 시 `0.5초` Fade-out 이행 | `@react-three/drei` `useProgress` |
| **`LandingHero.jsx`** | 온마루 브랜드 타이포그래피 인트로 및 비디오 배경, 하단 스크롤 인디케이터 연출 | `progress: 0.00 ~ 0.09` |
| **`LandingSolarShadow.jsx`** | 서울 종로구 계동 기준 24절기 남중고도 및 처마 그림자 인터랙션 슬라이더 카드 | `useSceneStore` (`setSun`) 연동 |
| **`LandingHanokAssembly.jsx`** | 전통 한옥 7단계 부재(기단~지붕) 결구 조립 시각화 및 부재설명 텍스트 카드 | `useSceneStore` (`setAssembling`) 연동 |
| **`LandingPhilosophy.jsx`** | 한옥이 건네는 여백, 소리, 빛에 관한 브랜드 침묵 스토리텔링 및 마우스 근접 발광 | `progress: 0.70 ~ 0.82` |
| **`LandingCallToAction.jsx`** | 전국 한옥 숙소 규모 카운트업, 절기 안내 카드, 지도 및 한옥 탐색 서비스 유도 CTA | `progress: 0.84 ~ 1.00` |
| **`LandingSectionFrame.jsx`** | 랜딩 섹션 공통 프레임, 스크롤 이징(`progressIn`, `clamp01`), 접근성 훅 모음 | 공통 이징 및 접근성 유틸 |

---

## 🛠️ 개발 및 유지보수 시 주의사항

1. **3D Canvas와의 레이어링 관합 (`z-index`)**:
   - 3D 한옥 Canvas(`LandingExperience.jsx`)는 `z-index: 1` 위치에 고정되어 있습니다.
   - 각 랜딩 컴포넌트는 `z-index: 2` 이상에서 오버레이되며, 마우스 및 스크롤 드래그가 3D Canvas로 관통하도록 텍스트 레이어에는 **`pointer-events: none !important;`** 가 명시되어 있습니다. (슬라이더, 버튼 등 상호작용 요소만 `pointer-events: auto;` 적용)

2. **디자인 시스템 컬러 토큰 사용**:
   - 하드코딩된 색상 대신 `@/design-system/tokens`의 온마루 컬러 토큰(`surface`, `meok`, `juhong`, `hwanggeum`, `kobalt` 등)을 엄격히 준수합니다.

3. **3D 바이너리 파일 보호 (`anchae.glb`)**:
   - `/public/anchae.glb` 모델 바이너리 파일은 절대로 직접 수정하지 않으며, 오직 Three.js/R3F 파라미터 로딩 제어로만 다룹니다.
