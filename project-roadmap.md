# 온마루 (OnMaru) Project Roadmap

온마루는 한국의 전통 한옥과 지역 문화유산을 현대적인 인터랙티브 웹 기술(Next.js, Three.js/R3F, GSAP ScrollTrigger, Framer Motion)로 재해석하는 디지털 문화유산 플랫폼입니다.

---

## 🏛️ Vision & Long-term Goals

1. **디지털 한옥 인터랙티브 경험 고도화**
   - 7단계 한옥 조립 3D 인터랙티브 스크롤리텔링
   - 사계절 일조·그림자 시뮬레이션 및 전통 건축 양식 아카이빙

2. **한국관광공사 공공데이터 연계 전국 한옥 지도 & 오디오 투어**
   - Odii(오디) 스토리 기반 인터랙티브 오디오 플레이어 & 성좌 탐색기 ([ODII_AUDIO_ROADMAP.md](ODII_AUDIO_ROADMAP.md))
   - TourAPI 연계 전국 권역별 정통 한옥/한옥마을 인터랙티브 맵

3. **고성능 & 현대적 인터랙션 최적화**
   - 60fps 부드러운 스크롤 모핑(VesselReveal) 및 모바일 반응형 덱
   - SSR 최적화, 경량 번들, 데이터 캐싱 및 내결함성(Fault Tolerance) 강화

---

## 🎯 Milestones

- [x] **Milestone 1: 프로토타입 및 3D 스크롤리텔링 캔버스 구축**
  - R3F 기반 안채 3D 모델(anchae.glb) 7단계 조립 애니메이션 구현
  - 럭셔리 다크모드 디자인 시스템 및 에디토리얼 레이아웃

- [x] **Milestone 2: 한옥 아카이브 & 정통 한옥 지도 V1**
  - 전국 한옥 데이터베이스 및 권역별 인터랙티브 필터링
  - TourAPI 실시간 연동 및 반응형 카드 그리드

- [x] **Milestone 3: Odii 오디오 경험 UI/UX 구축**
  - 플로팅/확장 오디오 플레이어, 대본 싱크 뷰어, 성좌(Constellation) 인터랙션
  - 성능 최적화 및 렌더링 병목 개선

- [ ] **Milestone 4: 공공데이터 실시간 연동 및 프로덕션 릴리스**
  - 한국관광공사 Odii 및 TourAPI 라이브 키 연동 및 백엔드 어댑터
  - E2E 테스트 및 배포 자동화
