# handoff.md

## Current Work
- Core UI 컴포넌트 Private 서브모듈(`src/private/core-ui`) 분리·이전 및 submodule 자동화 가이드/워크플로우 구성 (PR #110 예정)

## Next Steps
- GitHub Repository Secret `CORE_UI_DEPLOY_KEY`의 private `onmaru-core-ui` read access 유지 여부 확인
- 팀원에게 `onmaru-core-ui` 서브모듈 접근 권한 및 `npm run submodule:init` 안내
- #91 백엔드 503 정상화 후 `GET /api/v1/odii/stories` 실응답으로 소리마루 백엔드 우선 경로를 수동 재검증
