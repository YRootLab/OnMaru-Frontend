# archive2 — One Long Scroll 1차 구현 (2026-07-30 보존)

`feature/intro-section-zero` 브랜치까지 진행했던 첫 번째 One Long Scroll 구현을 그대로 보존한 폴더다.
새 페이지를 처음부터 다시 만들기 위해 `src/app` 에서 떼어내 여기로 옮겼다.

## 구성

- `one-long-scroll/` — 스크롤 스테이지 전체 (이전 `src/features/one-long-scroll`)
  - `OneLongScrollStage.tsx` — 스크롤 트리거 · 배경 · 고정 캔버스 · 오버레이 조립부
  - `hooks/useOneLongScroll.ts`, `store/scrollProgress.ts` — 스크롤 진행도
  - `components/canvas/` — 고정 배경 캔버스, 한옥 정적 모델
- `components/` — 이전 `src/components`
  - `BackgroundSystem.js` — 시간대별 선형+라디얼 다층 그라데이션 (design-system/tokens.ts 연동)
  - `LightingSystem.js` — 스크롤 구간별 키라이트 색/강도 커브
  - `Section00.jsx` — 00 인트로 섹션

## 남아있는 확인용 라우트

- `/one-long-scroll` — 스테이지 전체
- `/section00-preview` — 00 인트로 섹션 단독

> 그 이전 한옥 뷰어 구현은 `src/archive` (`/hanok`, `/anchae`) 에 있다.
