# improvements.md

Backlog for follow-up improvements that are useful but not required to resume the current session.

## Open

- VisitReview 배포 OpenAPI를 실제 계약과 맞춘다. 현재 `CreateReviewRequest` schema는 `text`만/최대 1,000자로 문서화하지만 FE 계약은 `mood`·`score`·`tags`와 300자 제한을 사용한다. 목록·지역 응답도 구체 schema 대신 `object`로만 노출되고, `scope=REGION&regionCode=kr-45`는 0건이지만 leaf `kr-45-jeonju`는 2건을 반환하므로 부모 지역의 재귀 포함 여부를 백엔드 #256 후속으로 명시해야 한다. (2026-09-26 배포 `/v3/api-docs`·실응답 확인)

- GitHub Actions Secrets에 `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` 미등록 시 develop push/배포가 실패할 수 있음. Secrets 등록은 관리자가 브라우저에서 수동 진행해야 함. (서브모듈 인증용 `CORE_UI_READ_TOKEN`·`SUBMODULE_SSH_KEY`는 서브모듈 제거로 더 이상 불필요 — 삭제 대기)
- 백엔드 실서버(`onmaru-backend.onrender.com`)에 `GET /api/v1/hanoks/screen-hanok`가 배포되면 실데이터 스모크 테스트 후 `screenHanok.service.ts`의 Fallback 큐레이션 데이터셋(7종) 유지/축소 여부를 검토한다. (Refs #103 — 이슈는 FE 연동 완료로 종료됨, 백엔드 배포는 별도 진행)

- Expose canonical backend `placeId` in Hanok and Odii view models so the shared saved-place button can be attached to those cards without falling back to legacy TourAPI `contentId` or Odii `stid`.

- Re-design the `OdiiEditorialRail` card index badge UI (currently restored to a compact top-left rounded white badge); explore more native editorial numbering styles.

- The landing route starts an 11 MB `anchae.glb` load for its required 3D scene. Navigating to Odii before the first decode completes can temporarily contend for main-thread time; reducing this further requires a compressed/optimized model or an explicitly approved change to landing asset activation timing.
- The Hanok stay accordion still animates `flex` across up to seven image panels. It was retained because a transform-based replacement could not guarantee the same spring geometry and perceived motion; profile it again only with browser trace and visual comparison available.
- The Hanok server still serializes the normalized village archive into the client boundary so every existing section is immediately functional. Reducing that RSC payload further requires a stable paginated backend/read-model contract or section-level loading UI approval.
- Run desktop/mobile screenshot and interaction regression checks for `/odii` and `/hanok` when an automation browser is connected; this session had no available browser instance.
- The repository-wide lint baseline currently fails outside this performance scope (`41` errors and `75` warnings), mainly in landing, cinematic-tour, and map modules. Touched Hanok files are clean; touched Odii files have only existing external `<img>` optimization warnings.
- Add CI checks and repository branch protection that enforce the Git Flow policy in `AGENTS.md`.
- Review story-image coverage from the Odii API and replace fallback assets when official per-story images become available.

### Odii: 자연어 문답 섹션 기획 — 2026-09-05

**질문:** “지도로 듣는 이야기”로 지역을 둘러본 사용자가, 자신의 시간·분위기·관심사를 말해 실제 Odii 이야기를 발견하도록 하려면 자연어 문답을 어디에, 어떤 역할로 놓아야 하는가?

#### 발산: 가능한 방향

1. 아카이브 검색창을 대화형 검색으로 완전히 교체한다.
2. 지도 섹션 아래에 “무엇을 듣고 싶나요?” 한 문답 블록을 둔다.
3. 지도 핀을 누른 뒤 해당 지역에 한정된 질문을 여는 보조 패널을 둔다.
4. “오늘, 여기에서” 카드 바로 위에서 내 주변·남은 시간 조건을 묻는다.
5. 아카이브의 카테고리와 지역 필터를 자연어 질문으로 자동 변환한다.
6. 답변 결과를 새 카드 UI가 아니라 기존 오디오 행과 동일한 재생 가능한 출처 카드로 표시한다.
7. “혼자 걷기”, “아이와 함께”, “10분 안에” 같은 상황 칩을 질문 초안으로 사용한다.
8. 지도의 현재 선택 지역을 질문의 숨은 필터로 넘긴다.
9. 챗봇 대화 로그를 길게 쌓기보다 한 질문·한 답변·출처 1~3개만 보여준다.
10. 첫 답변 뒤에는 ‘이 장소에서 더 듣기’와 ‘다른 조건으로 묻기’ 두 행동만 제공한다.
11. 답변 중 “가장 가까운 장소”는 GPS 권한이 있을 때만 제안한다.
12. 출처가 부족하면 모델 답변 대신 현재 카테고리/지도 탐색으로 되돌리는 빈 상태를 보인다.
13. 검색 결과를 바로 자동 재생하지 않고, 사용자가 출처 트랙의 재생 버튼을 명시적으로 누르게 한다.
14. 가장 과감한 안으로, 지도의 선택 영역을 대화 답변에 따라 부드럽게 강조한다.
15. 사용자가 마음에 담은 이야기와 최근 재생 기록을 선택적으로 질문 문맥에 포함한다.

#### 수렴: 추천 구조

**1순위 — 지도 다음의 ‘한 번 묻기’ 브리지 섹션**

- 위치: `SoundConstellationSection` 직후, `오늘, 여기에서` 직전.
- 역할: 지도 탐색(어디로 갈까)에서 개인 청취 선택(무엇을 들을까)으로 전환한다.
- 화면: 작은 제목 `어떤 장면을 듣고 싶나요?`, 한 줄 질문 입력, 상황 제안 칩 3개, 답변과 출처 이야기 1~3개.
- 이유: 지도 섹션과 아카이브의 역할을 중복하지 않고, 비어 있는 중간 흐름을 사용자 의도로 연결한다.

**2순위 — 지도 문맥형 보조 질문**

- 선택한 지역/핀을 필터로 전달해 “서울에서 15분 이내의 한옥 이야기”처럼 답한다.
- 지도와 답변의 연결감은 강하지만, 핀 선택이 없는 사용자에게는 발견성이 낮다.

**3순위 — 아카이브 하단의 정밀 검색 보조**

- 현재 구현한 `OdiiQuestionAssistant` 위치다.
- 목록을 다 본 뒤 구체적 검색이 필요한 사용자에게 유용하지만, 자연어 탐색의 발견 시점이 늦다.

**가장 흥미로운 실험:** 답변 출처를 고르면 지도에 그 이야기의 좌표를 잠시 강조한다. 단, 답변을 꾸미는 시각 효과가 아니라 실제 `mapX`/`mapY`가 있을 때만 동작해야 한다.

#### 제품/UX 제약

- ‘AI 상담’, ‘무엇이든 물어보세요’ 같은 범용 챗봇 언어는 사용하지 않는다. 화면 언어는 `어떤 장면을 듣고 싶나요?`처럼 Odii의 청취 맥락을 유지한다.
- 긴 대화 로그, 아바타, 타이핑 연출, 장식용 말풍선은 만들지 않는다. 한 질문과 근거 있는 한 답변이면 충분하다.
- 답변은 `stid` 출처 1개 이상이 있을 때만 보이며, 각 출처는 기존 재생 흐름으로 연결된다.
- 사용자 위치·저장한 이야기·최근 재생은 명시적 동의가 있을 때만 RAG 요청의 문맥으로 포함한다.
- `prefers-reduced-motion`에서는 답변/출처를 즉시 표시한다.

#### 질문 입력 상단: Odii 키워드 칩

- 질문 입력 위에는 현재 Odii 탐색에 실제로 쓰는 카테고리 키워드만 표시한다: `한옥/고택`, `전통시장/장터`, `마을/골목길`, `궁궐/역사`, `소리/문화`, `자연/둘레길`.
- 칩은 장식이나 프롬프트 예시가 아니라 RAG 요청의 `category` 메타데이터 필터다. 한 번에 하나만 선택하며, 선택 해제하면 전체 이야기로 돌아간다.
- 현재 지도에서 선택한 지역이 있으면 키워드 칩 아래에 작게 표시하고, 질문 요청에는 `region` 필터로 전달한다. 지도 선택이 없을 때 지역을 추정하지 않는다.
- 칩을 고른 뒤에도 질문은 자유롭게 입력할 수 있다. 예: `궁궐/역사` 선택 후 “부여에서 10분 안에 들을 수 있는 이야기를 찾아줘”.
- 답변 출처 카드에는 적용된 키워드/지역 필터를 다시 표시해, 왜 해당 이야기가 추천됐는지 이해할 수 있게 한다.

#### 구현 순서

1. RAG 백엔드가 준비되면 `OdiiQuestionAssistant`를 아카이브 하단에서 지도 다음 브리지 위치로 이동한다.
2. 요청에 현재 지도 선택 지역, 선택 카테고리, 검색어를 메타데이터 필터로 포함한다.
3. 답변 출처를 현재 재생 스토어와 지도 좌표로 연결한다.
4. ‘시간’, ‘지역’, ‘분위기’, ‘동행’ 질의 30개를 평가 세트로 만들고, 추천 `stid`의 필터 일치·출처 충실도를 측정한다.
5. 지표가 안정된 뒤에만 최근 재생/저장 문맥과 지도 강조 실험을 추가한다.

#### 앞으로 해야 할 일

1. `OdiiQuestionAssistant`를 아카이브 하단에서 지도 다음 브리지 위치로 이동하고, 키워드 칩을 `ODII_THEME_CATEGORIES` 원본 데이터로 렌더링한다.
2. 질문 API 계약에 `region`, `maxDurationSec`, `contextSource`를 추가하고, 선택된 칩/지도 상태만 전송하도록 검증한다.
3. Odii API 동기화 작업을 일별 증분으로 운영하고, 삭제·수정된 `stid`가 검색 인덱스에서도 제거되도록 한다.
4. RAG 백엔드에 하이브리드 검색, 재정렬, 출처 검증, 질문 길이 제한, rate limit, trace ID를 구현한다.
5. LangGraph 라우팅을 단순 검색·조건 검색·다단계 비교로 제한하고, 도구 호출 횟수 및 시간 예산을 강제한다.
6. 자연어 평가 세트 30개부터 시작해 필터 일치율, 출처 충실도, 재생 전환율, 무응답률을 지속 측정한다.
7. 출처를 누르면 해당 `stid`를 즉시 재생하거나 지도에서 강조할지 사용성 검증 후 결정한다. 자동 재생은 도입하지 않는다.

### Odii: ADR 구현 현황 — 2026-09-05

#### 완료

- **ADR-0002** (`docs/decisions/0002-odii-story-first-archive.md`): 한국관광공사 Odii API의 `stid` 이야기 단위를 보존하는 페이지네이션을 아카이브 기본 계약으로 기록했다.
- 아카이브는 요청당 12개 이야기를 가져와 데스크톱 2열·모바일 1열의 조밀한 이야기 탐색으로 표시한다.
- `장소별 묶어 보기`는 전체 데이터를 사전 적재하지 않고, 현재 API 응답 페이지의 제목 접두어를 이용해 파생 `placeKey`로만 만든다.
- **ADR-0003** (`docs/decisions/0003-odii-rag-langgraph-assistant.md`): 출처 강제 RAG/LangGraph 백엔드 계약을 기록했다.
- 프런트엔드는 `POST /api/odii/ask`만 호출하며, 응답은 답변과 최소 하나의 Odii `stid` 출처를 포함해야 한다.
- RAG 서비스가 구성되지 않은 상태에서는 그 사실을 표시하고, 모델 답변이나 추천을 임의로 만들지 않는다.

#### 후속 백엔드 작업

- `ODII_RAG_API_URL` 서비스에 Odii 일별/증분 수집을 구현하고, `stid`를 문서 ID로 제목·대본·카테고리·좌표·재생시간을 인덱싱한다.
- 키워드(BM25)와 벡터 검색을 결합하고, 지역·카테고리·재생시간은 메타데이터 필터로 먼저 좁힌다.
- LangGraph는 단순 검색에는 직접 검색 노드만, 다조건·비교 질의에만 제한된 라우팅을 사용한다. 무제한 외부 도구 호출은 허용하지 않는다.
- 출처 없는 생성, 프롬프트 인젝션, 과도한 요청을 차단하고 trace ID·rate limit·검색/답변 평가를 운영한다.
- 프런트와 백엔드의 성공 계약: `{ answer, sources: [{ stid, title, locationName?, formattedDuration? }] }`.

### 프론트엔드 아키텍처 방향 선정 — 2026-09-19

**질문:** 컴포넌트마다 제각각이던 `fetch` 로직은 훅(`useArchiveData`, `useKCultureThemes`, `useHanokDetail`, `useStayDetail`)으로 방금 정리했다. 그 다음 단계로 어떤 아키텍처를 정식 방향으로 잡을지는 아직 안 정했다. 실제 백엔드(`onmaru-backend.onrender.com`, `/v3/api-docs` 기준 REST 42종, `NEXT_PUBLIC_API_URL`에 등록 완료)가 이제 붙을 수 있게 됐고, 지금까지는 TourAPI 프록시 라우트 + 정적 폴백 JSON(`hanokVillages.fallback.json`)을 섞어 써 왔다.

#### 발산: 후보

1. 지금처럼 feature 폴더마다 `services/` + `hooks/` 컨벤션만 계속 지킨다(이미 시작함).
2. Next.js 서버 컴포넌트(`app/**/page.tsx`)에서 먼저 페칭하고, 클라이언트 컴포넌트는 props로만 받는다 — 클라이언트 `fetch`는 정말 필요한 곳(필터·사용자 액션에 반응)에만 남긴다.
3. React Query/SWR 같은 캐싱·재검증 레이어를 도입한다.
4. `/v3/api-docs` OpenAPI 스펙을 `openapi-typescript` 등으로 코드젠해서 백엔드 타입을 수동 동기화하지 않는다.
5. Redux/Zustand 같은 전역 상태 레이어를 새로 추가한다.
6. TourAPI 프록시 라우트를 걷어내고 실제 백엔드로 한 번에 전면 교체한다.

#### 수렴: 추천 (우리 규모·일정 기준)

- **1 + 2번을 기본으로 삼는다.** 이미 있는 서비스/훅 분리를 계속 지키고, 새로 페칭하는 화면은 되도록 서버 컴포넌트에서 먼저 가져와 props로 내려준다. 새 프레임워크나 레이어 없이 지금 컨벤션만 일관되게 적용해도 "느슨한 결합 + 데이터 외부 주입"은 이미 달성된다.
- **3번(React Query/SWR)은 아직 이르다.** 캐싱·재검증이 실제로 아픈 지점(같은 데이터를 여러 화면에서 중복 요청, 포커스 시 재검증 필요 등)이 아직 뚜렷하지 않다. 필요해지는 신호가 보이면 그때 도입한다(YAGNI).
- **4번(OpenAPI 코드젠)은 실속이 있다.** 백엔드가 42개 엔드포인트짜리 정식 스펙을 이미 내려주므로, 타입을 손으로 베껴 쓰기 시작하기 전에 `openapi-typescript`로 타입만 자동 생성해 두는 게 이후 유지비를 크게 줄인다. tRPC 같은 런타임 계층까지는 필요 없다.
- **5번(전역 상태 관리)은 지금 규모에서 불필요.** 컴포넌트 트리가 깊지 않고 prop drilling이 실제 문제로 드러난 지점이 아직 없다.
- **6번(전면 교체)은 위험하다.** TourAPI 폴백이 여전히 유효한 데이터 소스이므로, 한 번에 갈아엎지 말고 섹션 단위로 점진적으로 바꾼다(예: "이달의 한옥"처럼 백엔드가 먼저 안정화된 도메인부터).

**결론(1순위):** 새 의존성 추가 없이 기존 서비스/훅 컨벤션을 전 feature에 일관 적용하고, 새 백엔드는 `services/onmaruApi.service.ts` 하나로 얇게 감싸 섹션 단위로 점진 연결한다. 백엔드 스펙이 이미 있으니 타입만 `openapi-typescript`로 자동 생성하는 것부터 다음 단계로 검토한다. React Query·전역 상태관리·tRPC는 필요 신호(중복 요청·캐시 불일치·prop drilling 고통)가 실제로 보일 때 추가한다.

### 한국관광공사_지역별 관광 자원 수요 데이터 활용 아이디어 — 2026-09-17

실시간 API가 아닌 정기 배포 통계 데이터셋(월/분기 단위 갱신)이므로 즉시 도입보다 중장기 기능으로 검토.

**포함 데이터**: 이동통신 기반 지역별 방문자 수(현지인/외지인/외국인), Tmap 관광지 검색 건수/순위, 신용카드 소비 패턴, 지역별 관광 다양성 지수.

**OnMaru 적용 후보 기능**:
- 홈 > 지역별 둘러보기: "이번 달 주목받는 한옥 지역 TOP 3" 자동 선정 배너 (정적 목록 → 수요 기반 동적 큐레이션)
- 여정 큐레이터: Gemini 후보 중 실제 수요가 높은 장소에 우선순위 부여하는 재랭킹 신호로 활용
- 소리마루: "지금 많이 찾는 지역의 소리" — 수요 데이터 → ASMR 트랙 큐레이션 연결
- 지도 히트맵: 관광객 밀집도 시각화 레이어 (한산한 숨겨진 명소 역추천도 가능)

**선결 조건**: 전체 관광지 통계이므로 한옥/전통문화 분류 필터링 레이어 별도 구현 필요. TourAPI + Gemini 현행 조합이 충분한 동안은 낮은 우선순위.

## Done

- Initialized shared harness entry files and continuity documents.
