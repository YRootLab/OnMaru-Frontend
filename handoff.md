# handoff.md

## Current Work
- 홈 화면 API 연동: 큐레이션 코스·인기 소리·인기 지역을 `api/v1/home` API로 교체했고, 탐색 시작 요청을 `POST /api/journey-curator/explore` 호환 경로로 전환했다.
- 한옥도감과 지역별 한옥 스테이 이미지 카드의 둥근 모서리에 나타나는 1px 합성 경계는, 부모·이미지 레이어 배경을 일치시켜 수정했고 원인·재발 방지는 `docs/reports/hanok-card-image-compositing-boundary.md`에 기록했다.
- 소리마루와 한옥 지도에서 사진을 둥근 썸네일 배경으로 쓰는 컴포넌트에도 같은 합성 경계 방지 처리를 적용했다.
- 소리마루 “장면을 따라 걷는 소리” 레일은 Core UI `fix/sorimaru-editorial-image-seams` 브랜치의 `e4d49c4`를 가리키며, 인라인 이미지의 하단 베이스라인 여백·다크 모드 테두리·하단 패널의 이중 클리핑과 반투명 모서리 프린지를 제거하고 카드 그림자를 복원했다.
- Vercel Git 배포는 private Core UI submodule을 인증할 수 없어 비활성화했다. `deploy.yml`의 GitHub Actions Vercel CLI 배포가 `CORE_UI_READ_TOKEN`으로 submodule을 초기화한 뒤 production/preview를 배포한다.
- 한옥 이야기의 처마 일조·7단계 조립 3D 모달은 section reveal의 transform 컨텍스트 밖인 `document.body` 포털로 렌더링한다. 작은 화면에서도 안전 영역을 제외한 뷰포트 안에서 유지된다.
- Vercel Speed Insights를 루트 레이아웃에 연결해 실사용 Core Web Vitals를 수집한다.
- Vercel Analytics를 루트 레이아웃에 연결해 페이지 조회와 웹 분석 이벤트를 수집한다.
- 의존성 감사에서 보고된 Next.js critical RCE·SSRF·DoS, Vitest path traversal 및 전이 의존성 취약점을 patch 업데이트해 `npm audit` 결과를 0개로 만들었다.
- Vitest/Vite가 요구하는 `yaml@2.9.1`을 lockfile에 명시해 `npm ci`가 manifest와 lockfile 불일치로 실패하지 않도록 했다.

## Next Steps
- GitHub Repository Secret `CORE_UI_READ_TOKEN`의 private `onmaru-core-ui` read access 유지 여부 확인
- 팀원에게 `onmaru-core-ui` 서브모듈 접근 권한 및 `npm run submodule:init` 안내
- #91 백엔드 503 정상화 후 `GET /api/v1/odii/stories` 실응답으로 소리마루 백엔드 우선 경로를 수동 재검증
