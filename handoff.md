# handoff.md

## Current Work
- `feat/clean-architecture-foundation`에서 전체 클린 아키텍처 전환을 단계적으로 시작했다. 첫 단계로 `domain`·`application`·`infrastructure`·`presentation` 경계와 안쪽을 향하는 import 규칙을 `AGENTS.md`에 정의했으며, 첫 세로 이전 대상은 한옥 아카이브다.
- 한옥 아카이브의 순수 도메인 모델·규칙을 `src/features/hanok-archive/domain/`(`village.ts`, `villageRules.ts`)로 분리했다. `types.ts`는 도메인 타입을 재수출만 하고, TourAPI 파싱 서비스(`hanokArchive.service.ts`)·K-컬처 라우트(`app/api/tourapi/kculture/route.ts`)·fallback 데이터(`data/hanokArchiveFallback.ts`)가 모두 이 도메인 규칙 하나를 공유한다. 과거 `lib/classify.mjs`에 중복돼 있던 지역·유형·배지·좌표·이미지 규칙 함수는 삭제하고 TourAPI 카테고리 매핑(`CATEGORY_MAPPINGS`)만 남겼다.
- 한옥 아카이브 목록 조회를 3·4단계(유스케이스 조합 + 인프라 어댑터 이동)까지 진행했다. `infrastructure/tourApiHanokSource.ts`(TourAPI 페이지네이션 fetch)·`infrastructure/backendHanokSource.ts`(백엔드 `/hanoks` fetch)로 fetch를 분리하고, `application/fetchRealtimeHanoks.ts`가 백엔드 우선/TourAPI 폴백 흐름과 raw → `Village` 변환(도메인 규칙 호출)을 담당한다. `services/hanokArchive.service.ts`는 이제 이 유스케이스를 그대로 내보내는 3줄짜리 진입점이라 기존 라우트(`app/api/tourapi/route.ts`)와 테스트(`hanokArchive.backend.test.ts`)는 무수정으로 통과한다. 타입체크·`hanok-archive` 유닛 테스트(40개) 통과 확인. 진행 과정 전체는 `docs/reports/clean-architecture-blog-notes.md`(블로그 정리용, 이다체)에 기록 중이다.
- 한옥 상세 조회(`HanokDetailService`)도 3·4단계까지 진행했다. `infrastructure/tourApiHanokDetailSource.ts`(TourAPI 상세 4종 fetch)·`infrastructure/backendHanokDetailSource.ts`(백엔드 상세 fetch)로 분리하고, `application/getHanokDetail.ts`가 백엔드 우선/TourAPI 폴백과 raw→`VillageDetailResponse` 매핑을 담당한다. 이미지 정규화는 `map/utils/formatters`의 별도 `toHttps` 대신 한옥 아카이브 도메인의 `toSecureImageUrl`로 통일했다. `services/hanokDetail.service.ts`는 3줄짜리 진입점으로 축소.
- 5단계(훅을 표현 계층으로 축소) 검토 결과: `useArchiveData`/`useStayDetail`/`useHanokDetail`은 내부 라우트만 fetch하고 로직이 없어 이미 조건을 만족했다(AGENTS.md가 이미 허용한 패턴). `useHanokTranquility`만 실제로 정리가 필요했다 — 혼잡도 점수를 여유 등급·문구로 바꾸는 판정 로직(약 60줄)을 `domain/tranquilityRules.ts`(`computeTranquility`/`fallbackTranquility`/`resolveDistrictFromAddr`)로 빼고, 훅은 fetch + domain 함수 호출로 축소했다. fetch 자체는 내부 라우트(`/api/map/heat`) 호출이라 훅에 그대로 남겼다.
- 타입체크·`hanok-archive` 유닛 테스트(40개) 통과 확인. 진행 과정 전체(코드 스니펫 포함)는 `docs/reports/clean-architecture-blog-notes.md`(블로그 정리용, 이다체)에 기록 중이다.
- K-컬처 스크린 한옥(`screenHanokService`)도 같은 원칙으로 정리했다: `domain/screenHanok.ts`(타입) · `data/screenHanokFallback.ts`(큐레이션 fixture 7건) · `infrastructure/screenHanokSource.ts`(백엔드 목록/저장/해제 fetch) · `application/screenHanok.ts`(백엔드 우선, 비었거나 실패 시 fallback) · `services/screenHanok.service.ts`(얇은 진입점).
- `lib/classify.mjs`에 남아 있던 `CATEGORY_MAPPINGS`는 `infrastructure/tourApiHanokSource.ts`로, `LIVE_VILLAGE_TYPES`는 `domain/village.ts`로 옮겼다. `classify.mjs`와 거기 의존하던 `classify.contract.test.ts`(중복 `STAY_TYPE`이 같은지만 검사하던 테스트)를 삭제했다 — 복사본이 하나로 줄어 검사할 대상이 없어졌다.
- `domain/villageRules.test.ts`·`domain/tranquilityRules.test.ts`를 추가해 도메인 순수 함수를 직접 커버한다. `hanok-archive` 유닛 테스트가 40개 → 62개(도메인 테스트 24개 추가, classify contract 테스트 2개 제거)로 늘었다. 타입체크 통과.
- 진행 과정 전체(before/after 코드, 뷰 계층까지의 요청 흐름 트레이스 포함)는 `docs/reports/clean-architecture-blog-notes.md`(블로그 정리용, 이다체)에 기록했다. 이 디렉터리는 사용자가 의도적으로 `.gitignore`에 추가해 git 추적 대상이 아니다 — 로컬 파일로만 유지한다.
- 6단계(다른 기능으로 반복)를 소리마루(`src/features/sorimaru-audio`)에 적용했다. `sorimaruNetwork.ts`가 이미 `SorimaruNetworkClient` 포트 + DI 주입 구조로 인프라 역할을 하고 있어서 새로 만들 필요가 없었고, `sorimaruApi.ts`에 섞여 있던 순수 함수(`mapStoryItem`·`matchesKeyword`·`calculateDistanceKm`·`formatDistance`·`isPlayableStory`·카테고리/동의어 맵)만 `domain/sorimaruStoryRules.ts`로 뺐다. 기존 `sorimaruApi.test.ts`(가짜 네트워크 주입 테스트 7개)는 무수정으로 통과했고, `domain/sorimaruStoryRules.test.ts`를 신규 추가했다. `sorimaruNetwork.ts`의 물리적 폴더 이동과 localStorage 캐싱의 infrastructure 포트 분리는 실익 대비 위험이 커서 보류했다.
- 남은 반복 대상: `map/utils/formatters`의 중복 `toHttps` 통합 여부 판단(기능 경계를 넘는 공유 유틸이라 별도 결정 필요), 지도(`map`) 기능으로 1~5단계 반복(6단계 계속) — 범위가 커서 시작 전에 확인 필요.
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
