# handoff.md

## Current Work
- Core UI 팀 온보딩 가이드(`docs/core-ui-submodule-guide.md`)·`CONTRIBUTING.md` 서브모듈 섹션·AI 에이전트용 프롬프트 추가 (`docs/core-ui-team-onboarding` 브랜치, PR 대기)
- (완료·머지됨) Core UI 컴포넌트 Private 서브모듈(`src/private/core-ui`) 분리·이전 및 submodule 자동화 가이드/워크플로우 구성 — PR #113으로 develop 머지, 고아 복제본 정리는 `a940204`

## Next Steps
- `docs/core-ui-team-onboarding` PR 리뷰·머지 후 팀 채널에 `docs/core-ui-submodule-guide.md` 5번 안내문 전파
- GitHub Repository Secret `CORE_UI_READ_TOKEN`의 private `onmaru-core-ui` read access 유지 여부 확인
- 팀원에게 `onmaru-core-ui` 서브모듈 접근 권한 및 `npm run submodule:init` 안내 (가이드 2장·5번 참고)
- #91 백엔드 503 정상화 후 `GET /api/v1/odii/stories` 실응답으로 소리마루 백엔드 우선 경로를 수동 재검증
