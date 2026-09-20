# handoff.md

## Current Work
- develop 최신 내역을 `feat/issue-111-ui-refactor`에 병합하며 changelog·handoff·Core UI submodule 충돌을 해소했다. 병합으로 들어온 `@vercel/analytics`·`@vercel/speed-insights` 의존성을 `npm install`로 설치해 `Module not found` 빌드 오류를 해결하고 lockfile을 커밋했다.
- 소리마루 "장면을 따라 걷는 소리" 레일은 Core UI `fix/sorimaru-editorial-image-seams` 브랜치의 `e4d49c4`를 가리키며, 인라인 이미지의 하단 베이스라인 여백·다크 모드 테두리·하단 패널의 이중 클리핑과 반투명 모서리 프린지를 제거하고 카드 그림자를 복원했다.
- Vercel Git 배포는 private Core UI submodule을 인증할 수 없어 비활성화했다. `deploy.yml`의 GitHub Actions Vercel CLI 배포가 `CORE_UI_READ_TOKEN`으로 submodule을 초기화한 뒤 production/preview를 배포한다.
- 한옥 이야기의 처마 일조·7단계 조립 3D 모달은 section reveal의 transform 컨텍스트 밖인 `document.body` 포털로 렌더링한다. 작은 화면에서도 안전 영역을 제외한 뷰포트 안에서 유지된다.
- Vercel Speed Insights를 루트 레이아웃에 연결해 실사용 Core Web Vitals를 수집한다.
- Vercel Analytics를 루트 레이아웃에 연결해 페이지 조회와 웹 분석 이벤트를 수집한다.
- 의존성 감사에서 보고된 Next.js critical RCE·SSRF·DoS, Vitest path traversal 및 전이 의존성 취약점을 patch 업데이트해 `npm audit` 결과를 0개로 만들었다.
- Vitest/Vite가 요구하는 `yaml@2.9.1`을 lockfile에 명시해 `npm ci`가 manifest와 lockfile 불일치로 실패하지 않도록 했다.
- Vercel direct deployment에서 `--scope="$VERCEL_ORG_ID"`를 제거했다. 이전 성공 실행처럼 token/project 환경으로 pull하고, private Core UI submodule checkout은 기존 `CORE_UI_READ_TOKEN` 경로를 유지한다.

## Next Steps
- GitHub Repository Secret `CORE_UI_READ_TOKEN`의 private `onmaru-core-ui` read access 유지 여부 확인
- 팀원에게 `onmaru-core-ui` 서브모듈 접근 권한 및 `npm run submodule:init` 안내
- #91 백엔드 503 정상화 후 `GET /api/v1/odii/stories` 실응답으로 소리마루 백엔드 우선 경로를 수동 재검증
