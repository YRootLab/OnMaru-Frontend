# handoff.md

## Current Work
- `hotfix/delection-submodule`에서 private Core UI submodule 참조를 제거하고 `src/private/core-ui` 전체 코드를 이 저장소에 일반 파일로 직접 포함했다. `.gitmodules`·gitlink·`scripts/check-submodule.mjs`·`check:submodule`/`submodule:*` npm 스크립트·CI(deploy.yml, playwright.yml)의 서브모듈 초기화 단계를 모두 제거했다. 원본 `YRootLab/onmaru-core-ui` 저장소는 아카이브로 유지한다.
- 소리마루 "장면을 따라 걷는 소리" 레일의 Core UI `fix/sorimaru-editorial-image-seams`(`e4d49c4`) 개선 내용이 이제 in-repo 파일에 그대로 반영되어 있다.
- Vercel 배포는 `deploy.yml`의 GitHub Actions Vercel CLI 배포가 수행하며, 서브모듈 인증 없이 checkout만으로 빌드·배포한다.
- 한옥 이야기의 처마 일조·7단계 조립 3D 모달은 section reveal의 transform 컨텍스트 밖인 `document.body` 포털로 렌더링한다. 작은 화면에서도 안전 영역을 제외한 뷰포트 안에서 유지된다.
- Vercel Speed Insights를 루트 레이아웃에 연결해 실사용 Core Web Vitals를 수집한다.
- Vercel Analytics를 루트 레이아웃에 연결해 페이지 조회와 웹 분석 이벤트를 수집한다.
- 의존성 감사에서 보고된 Next.js critical RCE·SSRF·DoS, Vitest path traversal 및 전이 의존성 취약점을 patch 업데이트해 `npm audit` 결과를 0개로 만들었다.
- Vitest/Vite가 요구하는 `yaml@2.9.1`을 lockfile에 명시해 `npm ci`가 manifest와 lockfile 불일치로 실패하지 않도록 했다.
- Vercel direct deployment에서 `--scope` 옵션을 제거했다. token/project 환경으로 pull하고 빌드·배포하며, 서브모듈 초기화 단계는 제거되었다.

## Next Steps
- GitHub Repository Secret `CORE_UI_READ_TOKEN`은 이제 어떤 워크플로우도 사용하지 않으므로 관리자가 Settings에서 삭제한다.
- #91 백엔드 503 정상화 후 `GET /api/v1/odii/stories` 실응답으로 소리마루 백엔드 우선 경로를 수동 재검증
