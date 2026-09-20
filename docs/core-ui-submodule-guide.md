# Core UI 프라이빗 서브모듈 — 팀 온보딩 가이드

온마루의 핵심 UI(소리마루 프리미엄 섹션·플레이어, 지도 온기모드)는 **공개 저장소가 아닌
프라이빗 서브모듈**로 관리됩니다. 이 문서는 팀원(사람·AI 에이전트 모두)이 알아야 할
내용을 한 장으로 정리합니다.

## 1. 구조 한눈에 보기

```
OnMaru-Frontend (public)                 onmaru-core-ui (private)
├─ src/features/...                      ├─ sorimaru/        ← 히어로 레일, 에디토리얼 레일,
├─ src/shared/...                        │                      콘스텔레이션 지도, 미니 플레이어
├─ src/app/...                           └─ map-warmth/      ← 온기 히트맵·피드·작성 모달
└─ src/private/core-ui  ── git submodule ──┘
```

- 소비는 항상 alias import: `@/private/core-ui/sorimaru/...`, `@/private/core-ui/map-warmth/...`
- 서브모듈 코드는 `@/design-system/tokens`, `@/features/...` 등 **호스트의 `@/` alias를 역참조**합니다.
  이것은 의도된 설계입니다. 서브모듈은 독립 빌드 대상이 아니며, 컴파일·테스트는 전부
  호스트 앱(`npm run test`, `npm run build`)이 수행합니다.

## 2. 접근 권한

`YRootLab/onmaru-core-ui`는 **private** 저장소입니다. 권한이 없으면 빌드/테스트가
`check:submodule` 단계에서 실패합니다. org owner에게 Collaborator(read) 권한을 요청하세요.

```bash
# 최초 클론
git clone --recurse-submodules git@github.com:YRootLab/OnMaru-Frontend.git

# 이미 클론했거나 pull 직후
npm run submodule:init        # git submodule update --init --recursive
```

## 3. 일상 워크플로우

| 상황 | 명령 / 규칙 |
| --- | --- |
| pull 후 화면이 깨지거나 모듈을 못 찾음 | `git submodule update --init --recursive` |
| 서브모듈 최신 main 따라가기 | `npm run submodule:update` (`git submodule update --remote --merge`) |
| 빌드/테스트 전 상태 확인 | `npm run check:submodule` (pretest/prebuild에 자동 실행됨) |
| core UI 수정 | **`src/private/core-ui/` 안의 원본을 직접 수정** (아래 경고 참고) |

### ⚠️ 서브모듈 수정 커밋 순서 (가장 중요)

1. `cd src/private/core-ui` (또는 `git -C src/private/core-ui`) 에서 브랜치 생성·커밋·**push**
2. 부모 저장소로 돌아와 `git add src/private/core-ui` 로 **서브모듈 포인터**를 커밋
3. 부모 저장소 PR에 포함

서브모듈을 먼저 push하지 않으면 detached HEAD 커밋이 GitHub에 존재하지 않게 되어
**다른 팀원의 체크아웃이 실패**합니다. 반드시 서브모듈 먼저 push합니다.

### ⚠️ 절대 하지 말 것: 복제본 만들기

`src/features/...`에 core UI 파일을 복사해 수정하면 (1) 실제 화면에는 전혀 반영되지
않고 (2) `TS2307` 타입 오류가 발생합니다. 실제로 한 번 발생했던 사고입니다
(develop 커밋 `a940204` 참고 — 복제본 5개를 삭제하고 수정본을 서브모듈로 이식).
**core UI는 항상 `src/private/core-ui/` 안에서만 수정합니다.**

## 4. CI/CD 동작 방식

- GitHub Actions(`deploy.yml`, `playwright.yml`)는 checkout 후 `CORE_UI_READ_TOKEN`
  시크릿으로 private 서브모듈을 초기화합니다. 시크릿이 없으면 CI가 즉시 실패하므로
  관련 워크플로우 수정 시 이 단계를 지우지 마세요.
- Vercel은 GitHub Actions가 `vercel build --prebuilt`로 만든 산출물만 배포하므로
  Vercel이 저장소를 직접 클론하지 않습니다(별도 Vercel 자격증명 불필요).

## 5. 동료에게 전달할 때 쓰는 안내문 (복사해서 쓰세요)

> **온마루 저장소를 처음 받는 분들께**
>
> 이 저장소는 `src/private/core-ui`라는 **private git submodule**을 포함합니다.
> 소리마루 핵심 UI와 지도 온기모드 UI가 이 안에 있습니다.
>
> 1. 먼저 org owner에게 `YRootLab/onmaru-core-ui` 접근 권한을 받으세요.
> 2. 클론은 `git clone --recurse-submodules ...` 로, 이미 받았다면 `npm run submodule:init`를 실행하세요.
> 3. `npm test`/`npm run build`가 "core-ui submodule" 오류로 실패하면 권한 또는 초기화 문제입니다.
> 4. 이 안내의 나머지는 `docs/core-ui-submodule-guide.md`를 읽어주세요.

## 6. AI 에이전트용 프롬프트 (Claude Code / Codex / Cursor / Cline 등)

아래 블록을 각자 쓰는 에이전트의 시스템 프롬프트/프로젝트 규칙에 붙여넣으세요.
(저장소 루트의 `AGENTS.md`에도 동일한 정책이 있으므로, AGENTS.md를 읽는 에이전트는
자동으로 따르지만, 신규 에이전트 온보딩용으로 사용합니다.)

```text
OnMaru-Frontend에서 작업할 때 반드시 지킬 규칙:

1. 작업 시작 전 `npm run check:submodule`으로 `src/private/core-ui`가 초기화되었는지
   확인한다. 비어 있으면 `npm run submodule:init`을 실행한다. 서브모듈 접근 권한
   오류가 나면 사용자에게 YRootLab/onmaru-core-ui 권한 문제임을 알린다.

2. 소리마루 핵심 UI(히어로 레일 SorimaruAutoSliceRail, "장면을 따라 걷는 소리"
   SorimaruEditorialRail, "지도로 듣는 이야기" SoundConstellationSection, 미니 플레이어
   LocalMiniPlayer와 그 의존 파일들)와 지도 온기모드 UI(WarmthLayer, HeatCanvas,
   WarmthFeed, WriteWarmthModal 등)는 모두 `src/private/core-ui/{sorimaru,map-warmth}`
   안에 있다.

3. 이 컴포넌트들을 수정할 때 `src/features/` 아래에 복제본을 만드는 것은 엄격히 금지한다.
   과거 이로 인해 화면에 반영되지 않는 죽은 코드와 TS2307 오류가 발생했다.
   항상 `src/private/core-ui/` 안의 원본을 직접 수정한다.

4. 서브모듈 수정 커밋 순서: (a) `src/private/core-ui` 안에서 먼저 commit하고 push,
   (b) 부모 저장소에서 서브모듈 포인터(`git add src/private/core-ui`)를 커밋하고 PR에
   포함한다. 서브모듈을 먼저 push하지 않은 detached HEAD 커밋은 유실된다.

5. 서브모듈 코드가 `@/design-system/...`, `@/features/...` 등 호스트 alias를 import하는
   것은 정상 설계다. 서브모듈은 호스트 앱에 의해 컴파일·테스트된다. 단독 빌드 대상이 아니다.

6. UI 이동/리팩터 후 검증: `npx tsc --noEmit`, `npm run test`, `npm run build`.
   순수 재배치·리팩터는 렌더 결과·애니메이션·스타일이 1픽셀도 바뀌지 않아야 한다.

7. `.github/workflows/deploy.yml`과 `playwright.yml`의 "Initialize private Core UI
   submodule" 단계(CORE_UI_READ_TOKEN 사용)는 CI가 private 코드를 읽는 유일한 경로다.
   절대 제거하지 않는다.
```

## 7. FAQ

**Q. 서브모듈 안에서 새 파일을 만들어도 되나요?**
네. 다만 호스트 alias(`@/...`)만 import하고, 서브모듈 내부 상호 참조는 상대 경로(`./`)를
사용하세요. 파일이 늘어나도 `check:submodule`·prebuild 훅이 상태를 검증합니다.

**Q. 왜 npm private package가 아니라 submodule인가요?**
소스 수준 반영 즉시성(빌드 산출물 publish 파이프라인 불필요)과 순수 재배치(렌더 무변화)
검증이 쉽기 때문입니다. 단점(포인터 관리, 협업자 클론 주의)은 이 가이드로 보완합니다.

**Q. 과거 커밋 히스토리에는 이 코드가 남아 있나요?**
네. 분리 시점 이전 커밋에는 원본 코드가 남아 있습니다(팀 합의: 감수). 앞으로의
수정·신규 코드만 private에서 관리됩니다.
