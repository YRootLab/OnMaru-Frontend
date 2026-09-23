# handoff.md

## Current Work
- `chore/remove-comments` 브랜치에서 추적 파일의 불필요한 주석을 제거 중이다. 컴파일러·린터·에디터 지시문과 실행용 shebang만 보존하고, 보존 주석은 문장부호 없이 단어로 끝나게 정리한다.
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
- 2026-09-23: #184·#185 FE 연동 작업 — 지역 그룹 응답 어댑터(`odii/regions`), 홈 인기 소리(`home/popular-sounds`), 재생 기록(`odii/stories/{storyId}/plays`), 오디오 찜 영속 API를 연결했다. 인기 소리 스켈레톤을 실제 기본 응답 수(7개)에 맞추고 목데이터 기반 찜 저장을 제거했다. `tsc`, 관련 Vitest 14건 통과.
- 2026-09-23 추가: 홈 인기 소리 UI는 `usePopularSounds`로 `/home/popular-sounds`를 직접 사용하고, 소리마루 `SoundConstellationSection`은 `odii/regions` 그룹 응답의 `storyCount`를 지도 핀/선택 지역 헤더에 반영한다. 지도 지역 API 실패 시 목 카드로 대체하지 않는다.
- 2026-09-23 추가: 홈 `이번 주 추천 코스` 캐러셀 좌우 버튼을 카드보다 앞선 z-index와 안전한 좌우 inset으로 조정하고, 로딩 상태를 이미지·지역 배지·제목·설명 2줄·태그·CTA까지 실제 카드 구조와 동일하게 구성했다.
