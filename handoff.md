# handoff.md

## Current Work
- 카카오 로그인 로직을 백엔드 신규 플로우(2026-09-21 가이드, 로컬 e2e 검증 완료)에 맞춰 갱신했다. 변경 요약: (1) `features/auth`가 카카오 authorize URL을 직접 조립하던 목 모드 경로를 폐기하고 `GET /auth/kakao/login?returnTo=` 시작 + `{returnTo}?auth=success|failed` 복귀 파싱으로 전환, (2) 로그인 상태 판정을 localStorage `onmaru_user` 캐시가 아닌 zustand 인메모리 세션 스토어 + `GET /members/me`(200/401, `credentials: include`)로 단일화, (3) 콜백 페이지는 레거시 진입 방어로 축소, (4) 전역 `useAuthReturn` 핸들러를 `Providers`에 Suspense로 마운트, (5) `loginWithKakao`는 현재 경로를 returnTo로 쓰고 여정 저장 intent가 있으면 `/`로 돌아와 저장을 마무리한다.
- 로컬 개발용 `.env.local`에는 `NEXT_PUBLIC_API_URL` 또는 `NEXT_PUBLIC_API_BASE_URL` 하나만 있으면 로그인이 동작한다(둘 다 client.ts에서 지원). 카카오 로그인 키는 FE에 불필요하다(지도 SDK용 `NEXT_PUBLIC_KAKAO_MAP_KEY`는 유지).
- 배포 전 백엔드 후속 작업(가이드 §4): 콜백 성공 redirect가 상대경로라 FE/BE가 다른 호스트면 브라우저가 백엔드 호스트로 이동한다. 백엔드가 FE origin allowlist 절대 redirect로 수정해야 한다.
- 로그인 장애 발생 시 원인 판별 절차: (1) `npm run probe:auth` 실행 — 실패하면 백엔드/환경 문제, (2) 프로브 통과 시 `npm test -- src/features/auth` — 실패하면 FE 계약 문제, (3) 둘 다 통과하면 브라우저 네트워크 탭에서 `GET /auth/kakao/login` 요청·응답과 `{returnTo}?auth=` 복귀 쿼리를 확인한다. 실제 카카오 동의 화면 왕복은 자동 검증 대상이 아니다.
- README를 다른 개발팀이 서비스 범위와 협업 지점을 이해할 수 있는 온마루 서비스 소개 문서로 개편했다. 구현 코드·명령·인증 정보는 포함하지 않았다.
- `hotfix/delection-submodule`에서 private Core UI submodule 참조를 제거하고 `src/private/core-ui` 전체 코드를 이 저장소에 일반 파일로 직접 포함했다. `.gitmodules`·gitlink·`scripts/check-submodule.mjs`·`check:submodule`/`submodule:*` npm 스크립트·CI(deploy.yml, playwright.yml)의 서브모듈 초기화 단계를 모두 제거했다. 원본 `YRootLab/onmaru-core-ui` 저장소는 아카이브로 유지한다.
- 소리마루 "장면을 따라 걷는 소리" 레일의 Core UI `adee88c` 개선 내용이 이제 in-repo 파일에 그대로 반영되어 있다.
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
