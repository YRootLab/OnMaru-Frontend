# OnMaru Core UI (Private)

온마루의 **프라이빗 코어 UI** 저장소입니다. `OnMaru-Frontend` 공개 저장소의
`src/private/core-ui/` 위치에 **git submodule**로 마운트되어 함께 컴파일됩니다.

## 이 저장소에 있는 것

| 디렉터리 | 내용 |
| --- | --- |
| `sorimaru/` | 소리마루 화면의 핵심 UI — 히어로 레일(SorimaruAutoSliceRail), "장면을 따라 걷는 소리"(SorimaruEditorialRail), "지도로 듣는 이야기"(SoundConstellationSection), 오디오 플레이어(LocalMiniPlayer)와 그 의존 컴포넌트 |
| `map-warmth/` | 지도 온기모드 UI — WarmthLayer(히트맵 오버레이), HeatCanvas, WarmthNotesLayer, WarmthFeed, WriteWarmthModal 등 |

## 빌드 규칙 (중요)

- 이 저장소는 **독립적으로 빌드/실행되지 않습니다.** 모든 컴파일·타입체크·테스트는
  호스트 앱(`OnMaru-Frontend`)이 수행합니다.
- 파일들은 `@/design-system/tokens`, `@/features/...` 등 **호스트 앱의 `@/` alias를
  역참조**합니다. 이 import들은 submodule로 마운트된 위치(`src/private/core-ui/...`)에서
  호스트의 tsconfig/vitest alias로 해석됩니다.
- UI 렌더 결과·애니메이션은 OnMaru-Frontend의 AGENTS.md 규칙(재배치 시 무변화)을
  그대로 따릅니다.

## 작업 방식

1. 여기서 직접 커밋·푸시한다
2. `OnMaru-Frontend`에서 `git submodule update --remote src/private/core-ui` 로
   서브모듈 포인터를 새 커밋으로 옮긴다
3. `OnMaru-Frontend`에서 서브모듈 포인터 변경을 커밋하고 PR을 올린다
4. 호스트에서 `npx tsc --noEmit`, `npm run test`, `npm run build` 로 검증한다

UI가 한 번에 여러 파일 걸쳐 변하는 경우, 호스트의 기능 브랜치에서 서브모듈 디렉터리를
직접 수정한 뒤 서브모듈 브랜치로 커밋하는 방식(`git -C src/private/core-ui` 작업)도
가능합니다. 이때는 반드시 서브모듈 먼저 푸시한 뒤 호스트를 커밋해야 detached HEAD에
걸리지 않습니다.
