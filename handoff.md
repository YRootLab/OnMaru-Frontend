# handoff.md

## Current Work & Status

- **소리마루(ODII) 오디오 상세 플레이어 및 섹션 UI/UX 고도화**:
  - PR #98, #99 머지 완료 (`develop`).
  - 상세 모달 최초 진입 시 1회 시네마틱 애니메이션 (제목 -> 서브제목 -> 해시태그 -> 대본 덩어리 slide-up & fade-in).
  - 모달 내부 탭 전환(`현장 사진 뷰어` <-> `전체 대본 모드`) 시 매끄러운 세션 상태 유지 및 재오픈 시 리셋.
  - 대본 패널 배경 투명화, 상하단 페이드 마스크, 인디케이터 바 너비 정돈, 반응형 16:9 뷰어/스켈레톤 규격 동기화.
- **Scroll Reveal & Reload Protection (`VesselReveal`)**:
  - PR #99 머지 완료 (`develop`).
  - 스크롤 하강 시 1회 개화(`0.96 -> 1.0`), 상향 스크롤 및 뷰포트 이탈 시에도 영구 개화 유지.
  - 페이지 리로드 시 즉시 최종 규격 렌더링으로 CLS 0 달성, 개화 후 Observer 해제로 메모리 최적화.
- **한옥 아카이브 고도화 (`src/features/hanok-archive`)**:
  - PR #100 머지 완료 (`develop`).
  - 고정 사이드 목차(TOC)와 부드러운 섹션 이동, K-컬처 포스터 필름스트립, 한옥 구조 카드 간결화 및 3D 보기 연동.

## Backend Integration Track (Issue #88 Root)

- **완료된 API 연동 (PR 대상)**:
  - #89 (CSRF fix): 완료 및 Close.
  - #90 (한옥/장소 API): 완료 및 Close.
  - #96 (`moderationApi.ts`): API 및 테스트 완료 (관리자 UI는 별도).
  - #97 (`memberApi.ts`): 로그아웃/탈퇴 API 연동 완료 (프로필 조회 UI 연동 대기).
  - #94 (`journeyThreadsApi.ts`): 스레드 목록/조회/삭제 API 완료.
  - #95 (`useSavedExplorationStore.ts`): 저장된 여정 동기화 API 연동 완료.
- **블로킹/대기 이슈**:
  - #91 (Odii 오디오 API): 백엔드 503 `SERVICE_UNAVAILABLE`로 인해 응답 스키마 확인 대기.
  - #92 (지도 인사이트/방문후기): `insights/heatmap` 백엔드 실관측치 데이터 누락으로 교체 대기.
  - #93 (여정 액션): `explorationApi`와 `journeyApi` 시스템 통합 의사결정 필요.

## Verified
- `npx tsc --noEmit`: 0 errors
- `npm test`: All tests passed
