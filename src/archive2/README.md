# archive2 — 1차 구현 보존 아카이브

`feature/intro-section-zero` 브랜치까지 진행했던 첫 번째 구현을 정리한 폴더입니다.
`one-long-scroll` 라우트 및 아카이브 코드는 정리 완료되었습니다.

## 구성

- `components/` — 이전 `src/components`
  - `BackgroundSystem.js` — 시간대별 선형+라디얼 다층 그라데이션 (design-system/tokens.ts 연동)
  - `LightingSystem.js` — 스크롤 구간별 키라이트 색/강도 커브
  - `Section00.jsx` — 00 인트로 섹션

> 그 이전 한옥 뷰어 구현은 `src/archive` (`/hanok`, `/anchae`) 에 있습니다.
