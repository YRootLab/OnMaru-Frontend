# OnMaru (온마루) Contribution Guide

온마루 프로젝트에 기여해 주셔서 감사합니다. 원활한 협업과 높은 코드 품질을 위해 아래 규칙을 준수해 주세요.

---

## 🌿 Git Flow & 브랜치 규칙

- **`develop`**: 개발 통합 브랜치
- **`main`**: 프로덕션 배포 브랜치
- **작업 브랜치**:
  - 기능 개발: `feat/<기능명>`, `feature/<기능명>`
  - 버그 수정: `fix/<버그명>`
  - 문서/기타: `docs/<문서명>`, `refactor/<리팩토링명>`
- **직접 푸시 금지**: `develop`, `main`으로의 직접 푸시는 로컬 Git Hook에 의해 차단되며, 반드시 PR을 통해 머지합니다.

---

## 🛠️ 개발 및 검증 규칙

1. **사전 검증**: PR 생성 전 다음 명령어가 에러 없이 통과해야 합니다.
   ```bash
   npx tsc --noEmit
   npm run build
   ```
2. **이모지 규칙**: 일본 성 이모지(`🏯`) 사용은 엄격히 금지되며, 한옥 관련 표현에는 태극기(`🇰🇷`)를 사용합니다.
3. **아키텍처**: Feature-based (FSD 영감) 구조를 준수하며, `src/features/` 간 상호 직접 결합을 지양합니다.

---

## 🔒 Core UI 프라이빗 서브모듈

- `src/private/core-ui`는 **private git submodule**(`YRootLab/onmaru-core-ui`)입니다.
  소리마루 핵심 UI·플레이어와 지도 온기모드 UI가 이 안에 있습니다.
- 클론은 `--recurse-submodules`로, pull 후에는 `npm run submodule:init`를 실행하세요.
  `npm test`/`npm run build` 전에는 `check:submodule`이 자동 실행됩니다.
- core UI 수정은 **반드시 서브모듈 안에서** 하고, 서브모듈을 먼저 push한 뒤 부모 저장소에
  포인터를 커밋합니다. `src/features/`에 복제본을 만들지 마세요.
- 자세한 규칙과 AI 에이전트용 프롬프트는 [`docs/core-ui-submodule-guide.md`](docs/core-ui-submodule-guide.md)를 참고하세요.

---

## 📋 PR & 이슈 라이프사이클

1. 구현 작업은 GitHub Issue를 기반으로 진행합니다.
2. PR 생성 전 `handoff.md`, `improvements.md` 등 작업 로그를 정리합니다.
3. PR 본문에 관련 이슈 번호(`Refs #번호` 또는 `Closes #번호`)를 반드시 명시합니다.
