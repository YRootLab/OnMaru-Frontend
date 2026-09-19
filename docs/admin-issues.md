# 🏛️ 온마루 관리자(Admin) 페이지 구축 GitHub Issues 명세서

본 문서는 Spring Boot API 연동을 대비한 Mock 기반 **온마루 관리자 페이지(Admin Web Console)** 구축을 위한 GitHub Issue 템플릿 모음입니다.

---

## 📌 Issue 목차 및 진행 로드맵

| 번호 | 구분 | 이슈 제목 | 우선순위 | 상태 |
| :---: | :---: | :--- | :---: | :---: |
| **Epic** | `Epic` | [#57 [Epic] 온마루 관리자(Admin) 콘솔 구축 (Spring Boot 연동 대비 Mock 기반 풀스택 UI)](https://github.com/YRootLab/OnMaru-Frontend/issues/57) | High | Open |
| **#1** | `Task` | [#52 [Admin #1] 공용 API 클라이언트 계층 및 관리자 인증/권한 가드 구축](https://github.com/YRootLab/OnMaru-Frontend/issues/52) | High | Open |
| **#2** | `Task` | [#53 [Admin #2] 관리자 공통 레이아웃 및 8종 재사용 UI 컴포넌트 시스템 개발](https://github.com/YRootLab/OnMaru-Frontend/issues/53) | High | Open |
| **#3** | `Feature` | [#54 [Admin #3] 대시보드(/admin) 및 온기(후기) 관리(/admin/reviews) 화면 구현](https://github.com/YRootLab/OnMaru-Frontend/issues/54) | Medium | Open |
| **#4** | `Feature` | [#55 [Admin #4] 신고 처리(/admin/reports) 및 한옥 큐레이션 관리(/admin/curation) 화면 구현](https://github.com/YRootLab/OnMaru-Frontend/issues/55) | Medium | Open |
| **#5** | `Feature` | [#56 [Admin #5] 사용자 관리(/admin/users), 데이터 파이프라인(/admin/data) 및 로그인(/admin/login) 구현](https://github.com/YRootLab/OnMaru-Frontend/issues/56) | Medium | Open |

---

## [Epic] 온마루 관리자(Admin) 페이지 구축 (Spring Boot 연동 대비 Mock 기반 풀스택 UI)

- **Labels**: `epic`, `admin`, `frontend`
- **Milestone**: `v0.4.0-admin`

### 1. 개요 (Overview)
온마루 서비스의 콘텐츠(온기 후기, 신고 내역, 큐레이션 메타데이터), 사용자 권한, 공공데이터 수집 파이프라인을 효율적으로 관리·통제하기 위한 **관리자 전용 웹 콘솔**을 구축합니다.
현재 백엔드(Spring Boot) 개발과 병행하여 진행되므로, 프론트엔드는 `src/lib/api/client.ts`의 Mock 인터셉트 계층을 통해 UI/UX 및 상호작용을 100% 완성하고, 추후 `NEXT_PUBLIC_API_BASE_URL` 환경 변수 주입만으로 실제 API와 매끄럽게 연결되도록 설계합니다.

### 2. 핵심 원칙 (Core Principles)
1. **작업 효율 및 정보 밀도 최우선**:
   - 대중 대상 서비스 페이지(인터랙티브 3D, 감성 비주얼)와 달리 관리자 콘솔은 빠른 판독과 조작을 위해 밝은 배경(`#FAFAFA`), 정갈한 표(DataTable), 고밀도 레이아웃을 채택합니다.
2. **디자인 토큰 엄격 준수 (`src/design-system/tokens.ts`)**:
   - 주 액션: `juhong[500]`
   - 성공/게시: `cheongrok[500]`
   - 경고/대기: `hwanggeum[500]`
   - 위험/삭제/에러: `danpung[500]`
   - 중립/보더/텍스트: `meok` (100~900)
3. **듀얼 모드 API 클라이언트**:
   - `USE_MOCK = !process.env.NEXT_PUBLIC_API_BASE_URL` 로직을 통해 Mock/Real 자동 전환
   - 200~500ms 인위적 지연을 적용하여 로딩 스켈레톤 및 낙관적 업데이트 검증
4. **역할 기반 접근 제어 (RBAC)**:
   - `ADMIN`: 전체 메뉴 및 파이프라인/사용자 권한 통제
   - `EDITOR`: 대시보드, 온기 관리, 신고 처리, 큐레이션 관리만 허용
   - `USER`: 접근 차단 화면 제공

### 3. 전체 프로젝트 구조
```
src/
├── app/admin/
│   ├── layout.tsx                    # 관리자 공통 레이아웃 및 인증 가드
│   ├── page.tsx                      # 대시보드
│   ├── reviews/page.tsx              # 온기(후기) 관리
│   ├── reports/page.tsx              # 신고 처리
│   ├── curation/page.tsx             # 큐레이션 관리 (village-overrides UI)
│   ├── users/page.tsx                # 사용자 관리 (ADMIN 전용)
│   ├── data/page.tsx                 # 데이터 파이프라인 (ADMIN 전용)
│   └── login/page.tsx                # 관리자 로그인
├── admin/
│   ├── components/
│   │   ├── AdminSidebar.tsx          # 240px 고정 사이드바
│   │   ├── AdminHeader.tsx           # 60px 헤더 (블러, 서비스 이동)
│   │   ├── DataTable.tsx             # 재사용 범용 테이블
│   │   ├── StatCard.tsx              # 지표 통계 카드
│   │   ├── StatusBadge.tsx           # 상태 뱃지
│   │   ├── ConfirmDialog.tsx         # 위험/확인 모달
│   │   ├── Pagination.tsx            # 페이지네이션
│   │   ├── EmptyState.tsx            # 빈 상태
│   │   ├── TableSkeleton.tsx         # 테이블 로딩 스켈레톤
│   │   └── Toast.tsx                 # 알림 토스트
│   ├── hooks/
│   │   ├── useAdminAuth.ts           # 관리자 세션/권한 관리
│   │   └── useAdminApi.ts            # SWR/Fetch 래퍼
│   ├── types.ts                      # 도메인 모델 정의
│   └── mock/
│       ├── dashboard.mock.ts
│       ├── reviews.mock.ts
│       ├── reports.mock.ts
│       ├── curation.mock.ts
│       ├── users.mock.ts
│       └── pipeline.mock.ts
└── lib/api/
    └── client.ts                     # 공용 Fetch 클라이언트
```

### 4. 하위 이슈 목록
- [ ] #1 `[Admin #1] 공용 API 클라이언트 계층 및 관리자 인증/권한 가드 구축`
- [ ] #2 `[Admin #2] 관리자 공통 레이아웃 및 8종 재사용 UI 컴포넌트 시스템 개발`
- [ ] #3 `[Admin #3] 대시보드(/admin) 및 온기(후기) 관리(/admin/reviews) 화면 구현`
- [ ] #4 `[Admin #4] 신고 처리(/admin/reports) 및 한옥 큐레이션 관리(/admin/curation) 화면 구현`
- [ ] #5 `[Admin #5] 사용자 관리(/admin/users), 데이터 파이프라인(/admin/data) 및 로그인(/admin/login) 구현`

---

## [Admin #1] 공용 API 클라이언트 계층 및 관리자 인증/권한 가드 구축

- **Labels**: `feature`, `admin`, `api`, `auth`
- **Assignee**: Frontend Team
- **Milestone**: `v0.4.0-admin`

### 1. 목표 (Goal)
- Spring Boot 백엔드 연동을 대비한 통합 HTTP 클라이언트(`src/lib/api/client.ts`) 구축
- 환경변수 기반 Mock/Real 모드 스위칭 지원 및 200~500ms 네트워크 지연 시뮬레이션
- 토큰 기반 인증, 401 Unauthorized 시 자동 Refresh / 리다이렉트 처리, 10초 타임아웃 방어 로직 구현
- 관리자 권한(`ADMIN`, `EDITOR`, `USER`) 검증 훅(`useAdminAuth`) 및 도메인 타입 정의

### 2. 세부 명세 (Specifications)

#### A. API 클라이언트 (`src/lib/api/client.ts`)
- **베이스 설정**:
  ```typescript
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const USE_MOCK = !BASE; // 환경변수 미설정 시 mock 모드로 동작
  ```
- **인터페이스**:
  - `export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T>`
  - `export async function apiPost<T>(path: string, body?: any): Promise<T>`
  - `export async function apiPatch<T>(path: string, body?: any): Promise<T>`
  - `export async function apiDelete(path: string): Promise<void>`
- **공통 인터셉터/에러 핸들링**:
  - `Authorization: Bearer {accessToken}` 자동 첨부 (localStorage 기반)
  - `AbortController`를 통한 10초 타임아웃 제한
  - 401 응답 시 refresh 토큰 재발급 시도 -> 실패 시 `/admin/login`으로 강제 이동
  - 에러 응답 객체 정규화: `{ message: string; status: number; code?: string }`
  - Mock 모드일 시 인위적 지연(200~500ms jitter) 후 모의 데이터 반환

#### B. 타입 정의 (`src/admin/types.ts`)
- `AdminRole`: `'ADMIN' | 'EDITOR' | 'USER'`
- `AdminUser`: `{ id: string; email: string; nickname: string; role: AdminRole; createdAt: string; lastLoginAt: string; status: 'ACTIVE' | 'SUSPENDED' }`
- `WarmthReview`: 후기 ID, 작성자 정보, 대상 장소, 무드(1~5), 내용, 태그 배열, 도움 수, 신고 수, 상태(`PUBLISHED` | `HIDDEN` | `DELETED`), 작성일시 등
- `ReportItem`: 신고 ID, 사유 카테고리, 신고자, 대상 후기, 피신고자, 누적 신고 수, 상태(`PENDING` | `RESOLVED` | `REJECTED`), 일시
- `CurationItem`: 컨텐츠 ID, 썸네일, 한옥 이름, 지역, 유형(도심형/집성촌형/체험형), 뱃지 목록, 포함 여부(boolean), 최종 수정자 및 수정일시
- `PipelineStatus`: 최근 갱신 시각, 소요 시간, 결과 상태, 수집 분류별 건수(마을, 숙소, 루트), 엔드포인트별 쿼터 사용량, 실패 로그 목록

#### C. 인증/인가 훅 (`src/admin/hooks/useAdminAuth.ts`)
- 상태: `accessToken`, `user`, `role`, `isLoading`
- 편의 판정: `isAdmin` (`role === 'ADMIN'`), `isEditor` (`role === 'EDITOR' || role === 'ADMIN'`)
- Mock 개발 전용 Role Switcher (`setRole('ADMIN' | 'EDITOR' | 'USER')`) 지원

### 3. 완료 조건 (Acceptance Criteria)
- [ ] `NEXT_PUBLIC_API_BASE_URL`이 비어있을 때 Mock 핸들러가 동작하며 응답을 정상 반환한다.
- [ ] 10초 이상 응답이 지연되면 타임아웃 에러를 발생시킨다.
- [ ] `useAdminAuth` 훅을 통해 로컬 스토리지 모의 토큰 및 사용자 역할 상태를 조회/변경할 수 있다.
- [ ] `npx tsc --noEmit`에서 타입 에러가 발생하지 않는다.

---

## [Admin #2] 관리자 공통 레이아웃 및 8종 재사용 UI 컴포넌트 시스템 개발

- **Labels**: `feature`, `admin`, `ui`, `components`
- **Assignee**: Frontend Team
- **Milestone**: `v0.4.0-admin`

### 1. 목표 (Goal)
- 관리자 콘솔 전용 240px 사이드바 + 60px 블러 헤더 + 유연한 콘텐츠 컨테이너 레이아웃 구축
- 역할(Role)별 라우트 가드 및 비인가 사용자 차단 화면 구현
- 운영 효율성과 디자인 일관성을 보장하는 재사용 컴포넌트 8종 개발

### 2. 세부 명세 (Specifications)

#### A. 레이아웃 시스템 (`src/app/admin/layout.tsx`)
- 전체 배경: `#FAFAFA`
- 비인가 접근 차단:
  - 미로그인: `/admin/login` 리다이렉트
  - `USER` 권한: 접근 제한 전용 화면 안내 ("접근 권한이 없습니다. 관리자에게 문의하세요.")
- 권한별 메뉴 가시성:
  - `ADMIN`: 전체 메뉴 노출
  - `EDITOR`: 대시보드, 온기 관리, 신고 처리, 큐레이션 관리만 노출 (사용자/데이터 메뉴 숨김)

#### B. `AdminSidebar.tsx` (240px 고정)
- 상단 로고: "온마루" 17px Bold + 아래 "관리자" 11px (`juhong[500]`, 자간 0.1em)
- 메뉴 목록 (아이콘 18px + 라벨 14px, 높이 42px):
  - 대시보드 (`/admin`)
  - 온기 관리 (`/admin/reviews`) -> 뱃지: 신규 N (배경 `meok[200]`)
  - 신고 처리 (`/admin/reports`) -> 뱃지: 대기 N (긴급 시 배경 `danpung[500]`, 흰색 텍스트)
  - 큐레이션 (`/admin/curation`)
  - 사용자 (`/admin/users`) (ADMIN only)
  - 데이터 (`/admin/data`) (ADMIN only)
- Active 상태: 좌측 3px 주홍 세로바 + 배경 `juhong[50]`, 글자 `juhong[700]`
- 하단 고정 프로필: 로그인 닉네임, 역할 뱃지, [로그아웃] 버튼 + (Dev 전용 Role 스위치)

#### C. `AdminHeader.tsx` (60px 스티키)
- 배경: `rgba(250, 250, 250, 0.9)`, `backdrop-filter: blur(12px)`
- 좌측: 현재 페이지 제목 (18px Bold)
- 우측: `[서비스로 이동 ↗]` 텍스트 링크 (새 탭으로 온마루 메인 `/` 이동)

#### D. 재사용 컴포넌트 8종 (`src/admin/components/`)
1. **`StatusBadge.tsx`**: 높이 22px, 반경 6px, 11px 600 weight
   - 게시중 (`cheongrok[50]` / `cheongrok[700]`)
   - 숨김 (`meok[200]` / `meok[700]`)
   - 삭제됨 (`danpung[50]` / `danpung[700]`)
   - 대기 (`hwanggeum[50]` / `hwanggeum[700]`)
   - 정지 (`danpung[50]` / `danpung[700]`)
2. **`DataTable.tsx`**: 시맨틱 `<table>` 기반, 정렬(`aria-sort`), 행 체크박스 선택, 행 클릭 이벤트, 페이지네이션 연동
3. **`StatCard.tsx`**: 14px 반경, 라벨 13px, 값 28px `tabular-nums`, 어제 대비 증감율(`cheongrok` ▲ / `danpung` ▼)
4. **`ConfirmDialog.tsx`**: 타이틀, 설명, 취소/확인 버튼, 파괴적 작업 시 확인 버튼 `danpung` 강조, ESC 및 배경 클릭 닫기
5. **`Pagination.tsx`**: 20건 단위 페이지 번호, 이전/다음 네비게이션
6. **`EmptyState.tsx`**: 아이콘, 안내 문구, 서브 설명
7. **`TableSkeleton.tsx`**: 8개 행 스켈레톤, 중립 그레이 shimmer 애니메이션
8. **`Toast.tsx`**: 우상단 플로팅, 3초 후 자동 소멸, 성공(`cheongrok`) 및 실패(`danpung`)

### 3. 완료 조건 (Acceptance Criteria)
- [ ] 1024px 이상 데스크톱 해상도에서 240px 사이드바와 60px 헤더가 깨짐 없이 렌더링된다.
- [ ] 권한이 `EDITOR`일 때 사용자/데이터 메뉴가 노출되지 않으며, URL 직간접 접근 시 차단된다.
- [ ] `StatusBadge` 컴포넌트가 5개 상태별 시맨틱 컬러 토큰을 정확히 표현한다.
- [ ] `ConfirmDialog` 모달에서 ESC 입력 시 정상적으로 닫힌다.

---

## [Admin #3] 대시보드(/admin) 및 온기(후기) 관리(/admin/reviews) 화면 구현

- **Labels**: `feature`, `admin`, `dashboard`, `reviews`
- **Assignee**: Frontend Team
- **Milestone**: `v0.4.0-admin`

### 1. 목표 (Goal)
- 서비스 전체 현황을 한눈에 조망하는 `/admin` 대시보드 구축
- 사용자 온기(후기)를 필터링, 검색, 검독, 일괄 처리, 상세 조회할 수 있는 `/admin/reviews` 관리 화면 구축
- Mock 데이터 25건 이상을 구성하여 실제 데이터 바인딩 검증

### 2. 세부 명세 (Specifications)

#### A. 대시보드 (`/admin`)
1. **상단 StatCard 4구 그리드**:
   - `오늘 온기`: `24` (어제 대비 ▲ 8)
   - `신고 대기`: `3` (1 이상이면 `danpung` 강조)
   - `신규 가입`: `12` (어제 대비 ▲ 5)
   - `전체 사용자`: `428`
2. **중단 그리드 (좌/우 분할)**:
   - 좌측: `최근 온기 5건` 리스트 (닉네임, 장소명, 무드 아이콘, 작성 시각, `[전체보기 →]` 링크)
   - 우측: `처리 대기 신고` 간이 리스트 (사유, 대상, 접수 시각, 미존재 시 EmptyState)
3. **하단 데이터 파이프라인 요약**:
   - 마지막 갱신 일시 (상대 시간 표시)
   - 수집 현황 (마을 17 · 숙소 172 · 루트 41)
   - API 호출량 (1,247 / 5,000) 및 실패 건수 (3건 [보기])
   - `[지금 갱신하기]` 버튼 (ADMIN 전용, 클릭 시 ConfirmDialog 후 프로그레스 인디케이터 동작)

#### B. 온기(후기) 관리 (`/admin/reviews`)
1. **복합 필터 바**:
   - 검색창: "닉네임, 장소, 내용 검색" (280px)
   - 상태 셀렉트: 전체 / 게시중 / 숨김 / 삭제됨
   - 무드 필터: 전체 / 1~5점
   - 기간 필터: 전체 / 오늘 / 7일 / 30일 / 직접입력
   - 정렬: 최신순 / 도움순 / 신고순 + `[초기화]` 버튼
2. **DataTable 컬럼 구성**:
   - `[ ]` (40px)
   - `작성자` (120px): 닉네임 + 아래 11px 이메일
   - `장소` (180px): 장소명 + 아래 11px 지역명
   - `무드` (60px): 온기 무드 아이콘
   - `내용` (auto): 최대 2줄 말줄임 (ellipsis)
   - `태그` (140px): 칩 최대 2개 + "+N"
   - `도움` (60px)
   - `신고` (60px): 0건 회색, 1건 이상 `danpung` 강조
   - `상태` (80px): `StatusBadge`
   - `작성일` (100px): 상대 시각 (호버 시 절대시각 툴팁)
   - `관리` (80px): `⋯` 더보기 드롭다운 (상세보기, 숨기기, 삭제, 작성자 정지)
3. **하단 고정 일괄 작업 바 (Sticky Bottom)**:
   - 체크박스 1개 이상 선택 시 노출
   - `N개 선택됨` 안내 + `[숨기기]`, `[삭제]`, `[선택 해제]` 액션 버튼
4. **우측 슬라이드 인 상세 패널 (400px)**:
   - 행 클릭 시 트리거
   - 후기 전문, 첨부 사진 갤러리, 작성자 누적 정보, 신고 접수 이력, 즉시 조치 버튼

### 3. 완료 조건 (Acceptance Criteria)
- [ ] 대시보드의 `[지금 갱신하기]` 클릭 시 관리자 권한 확인 모달이 열리고 시뮬레이션 진행률이 렌더링된다.
- [ ] 후기 목록에서 검색어 입력 시 닉네임/내용 실시간 필터링이 작동한다.
- [ ] 체크박스로 여러 행을 선택했을 때 하단 일괄 작업 바가 올라오며, 일괄 숨김/삭제가 동작한다.
- [ ] 행 클릭 시 400px 우측 패널이 부드럽게 열리고 상세 내용이 표시된다.

---

## [Admin #4] 신고 처리(/admin/reports) 및 한옥 큐레이션 관리(/admin/curation) 화면 구현

- **Labels**: `feature`, `admin`, `reports`, `curation`
- **Assignee**: Frontend Team
- **Milestone**: `v0.4.0-admin`

### 1. 목표 (Goal)
- 신고된 콘텐츠를 사유별로 검토하고 제재 조치를 취할 수 있는 `/admin/reports` 카드형 뷰 구현
- 서비스 핵심 데이터 오버라이드 파일(`village-overrides.json`)을 직접 편집하고 반영할 수 있는 실용적 `/admin/curation` 관리 툴 구축

### 2. 세부 명세 (Specifications)

#### A. 신고 처리 (`/admin/reports`)
1. **상단 탭 바**:
   - `[대기 N]` (대기 건수 뱃지)
   - `[처리완료]`
   - `[반려]`
2. **신고 카드 목록**:
   - 상단: 신고 사유 뱃지(욕설/비방, 광고/스팸, 허위정보, 부적절한 내용, 기타) + 신고 시각 + 신고자 정보
   - 중단: 신고된 후기 전문 (인용 블록 스타일: 좌측 3px `meok[200]` 보더, 패딩 14px, 배경 `meok[100]`)
   - 하단: 피신고자 정보(닉네임, 누적 피신고 N회) + 조치 버튼군(`[숨김 처리]`, `[삭제]`, `[반려]`, `[작성자 정지]`)
3. **확인 모달 연동**:
   - 삭제/정지 등 파괴적 액션 수행 시 사유 확인 및 알림 발송 안내 다이얼로그 노출

#### B. 큐레이션 관리 (`/admin/curation`)
1. **상단 탭**: `[한옥마을 17]`, `[한옥숙소 172]`, `[루트 41]`
2. **필터**: 검색, 유형(도심형/집성촌형/체험형), 포함여부(전체/포함/제외), 썸네일 유무
3. **인라인 에디팅 DataTable**:
   - `썸네일` (56px): 이미지 또는 기본 한옥 플레이스홀더
   - `이름` (200px): 인라인 클릭 수정 (alias 편집)
   - `지역` (100px)
   - `유형` (120px): 셀렉트 박스로 즉시 변경
   - `뱃지` (auto): 칩 목록 나열 + `[+]` 팝오버로 추가, 칩의 `✕` 버튼으로 삭제
   - `포함` (70px): 토글 스위치 (ON/OFF)
   - `수정` (100px): 최종 수정자 및 수정 시각
4. **미반영 표시 및 낙관적 업데이트**:
   - 수정된 행의 좌측에 주황색 점(`juhong[500]`) 인디케이터 표시
   - 변경 즉시 UI 반영, 실패 시 롤백 및 토스트 안내
5. **[변경사항 반영] 버튼 (상단 우측)**:
   - "변경사항 N건을 반영합니다. 데이터 재빌드가 실행되며 3~5분 소요됩니다." ConfirmDialog 띄움

### 3. 완료 조건 (Acceptance Criteria)
- [ ] 신고 카드에서 [숨김 처리] 또는 [삭제] 시 ConfirmDialog를 거쳐 상태가 `처리완료`로 전이된다.
- [ ] 큐레이션 테이블에서 한옥 별칭(이름)과 유형, 포함 토글을 인라인으로 변경할 수 있다.
- [ ] 뱃지 추가 팝오버에서 신규 뱃지를 입력하거나 기존 뱃지를 선택해 추가/삭제할 수 있다.
- [ ] 수정된 항목에 주황색 미반영 점이 표시되고, 상단 [변경사항 반영] 버튼이 활성화된다.

---

## [Admin #5] 사용자 관리(/admin/users), 데이터 파이프라인(/admin/data) 및 로그인(/admin/login) 구현

- **Labels**: `feature`, `admin`, `users`, `pipeline`, `auth`
- **Assignee**: Frontend Team
- **Milestone**: `v0.4.0-admin`

### 1. 목표 (Goal)
- 관리자 계정 권한 부여 및 이용자 제재를 관리하는 `/admin/users` 구현 (ADMIN 전용)
- TourAPI/공공데이터 수집 상태 모니터링 및 수동 재빌드를 실행하는 `/admin/data` 파이프라인 콘솔 구축
- 직관적이고 견고한 `/admin/login` 로그인 인터페이스 구현

### 2. 세부 명세 (Specifications)

#### A. 사용자 관리 (`/admin/users` - ADMIN 전용)
1. **필터**: 닉네임/이메일 검색, 역할 필터, 상태 필터, 가입일자 정렬
2. **테이블 컬럼**:
   - 닉네임 / 이메일
   - 역할: 셀렉트 박스(`ADMIN` / `EDITOR` / `USER`). 본인 계정은 `disabled` 처리. 변경 시 확인 모달 필수.
   - 상태: `StatusBadge` (정상 / 정지)
   - 활동 통계: 작성 온기 수 / 받은 신고 수
   - 가입일 / 최근 접속일
   - `⋯` 메뉴: [활동 내역], [정지], [정지 해제]
3. **정지 조치 모달**:
   - 정지 기간 선택 (3일 / 7일 / 30일 / 영구)
   - 사유 입력 (필수 텍스트 영역)

#### B. 데이터 파이프라인 (`/admin/data` - ADMIN 전용)
1. **상단 현황 카드**:
   - 마지막 빌드 시각 (2시간 전), 소요 시간 (4분 32초), 결과 (성공 / 실패 3건)
2. **수집 현황 테이블**:
   - 구분(한옥마을 17, 한옥숙소 172, 루트 41)별 건수, 이미지 보유율(%), 마지막 갱신 시각
3. **API 쿼터 호출 현황 막대 그래프**:
   - `searchKeyword2`, `detailCommon2`, `locationBasedList2`의 일일 한도 대비 사용량 게이지
   - 80% 초과 시 막대 색상이 `danpung[500]`으로 변경되며 경고 아이콘 표시
4. **실패 로그 목록**:
   - 최근 20건 실패 기록 (시각, 엔드포인트, contentId, 에러 사유) + `[전체 다운로드]` JSON 내보내기
5. **수동 실행 트리거**:
   - `[전체 빌드]`, `[마을만]`, `[숙소만]`, `[루트만]`
   - 실행 시 단계별 프로그레스 바 + "detailCommon2 조회 중 (87/172)" 실시간 단계 텍스트 + `[중단]` 버튼

#### C. 관리자 로그인 (`/admin/login`)
- 400px 중앙 정렬 카드 레이아웃
- "온마루" 로고 24px + "관리자 콘솔 로그인" 서브텍스트
- 이메일 / 비밀번호 폼 + Full-width 로그인 버튼
- 오류 발생 시 `danpung[500]` 경고 박스 출력
- 회원가입 링크 비노출 (관리자 초청/부여 방식)

### 3. 완료 조건 (Acceptance Criteria)
- [ ] 본인 관리자 계정의 역할은 셀렉트 박스가 비활성화되어 스스로 강등할 수 없다.
- [ ] 사용자 정지 모달에서 사유 미입력 시 확인 버튼이 비활성화된다.
- [ ] 데이터 파이프라인에서 쿼터 80% 초과 엔드포인트에 `danpung` 경고 색상이 적용된다.
- [ ] 수동 빌드 버튼 클릭 시 실시간 진행률 시뮬레이션이 동작하고 중단 버튼으로 취소할 수 있다.
- [ ] `/admin/login`에서 유효한 모의 계정으로 로그인 시 토큰이 저장되고 `/admin`으로 리다이렉트된다.
