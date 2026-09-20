# handoff.md

## Current Work
- 홈 화면 API 연동: 큐레이션 코스·인기 소리·인기 지역을 `api/v1/home` API로 교체했고, 탐색 시작 요청을 `POST /api/journey-curator/explore` 호환 경로로 전환했다.
- 한옥도감과 지역별 한옥 스테이 이미지 카드의 둥근 모서리에 나타나는 1px 합성 경계는, 부모·이미지 레이어 배경을 일치시켜 수정했고 원인·재발 방지는 `docs/reports/hanok-card-image-compositing-boundary.md`에 기록했다.
- 소리마루와 한옥 지도에서 사진을 둥근 썸네일 배경으로 쓰는 컴포넌트에도 같은 합성 경계 방지 처리를 적용했다.
- 소리마루 “장면을 따라 걷는 소리” 레일은 Core UI `fix/sorimaru-editorial-image-seams` 브랜치의 `9f56978`를 가리키며, 인라인 이미지의 하단 베이스라인 여백과 카드 외곽 그림자·다크 모드 테두리를 제거했다.

## Next Steps
- GitHub Repository Secret `CORE_UI_READ_TOKEN`의 private `onmaru-core-ui` read access 유지 여부 확인
- 팀원에게 `onmaru-core-ui` 서브모듈 접근 권한 및 `npm run submodule:init` 안내
- #91 백엔드 503 정상화 후 `GET /api/v1/odii/stories` 실응답으로 소리마루 백엔드 우선 경로를 수동 재검증
