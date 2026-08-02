# 온마루 Odii 오디오 경험 로드맵

> 상태: UI/UX 구현 완료, 한국관광공사 공공데이터 API 연동 대기
>
> 브랜치: `feature/odii-audio-experience`
>
> 기준 문서: `src/resources/한국관광공사_오디.md`

## 현재 완료

- [x] `/odii` 라우트와 Feature 기반 오디오 화면 구성
- [x] 추천 피처 레일, 근처 이야기 가로 레일, 이야기 검색·필터·목록 UI
- [x] 이야기 선택과 재생 행동 분리
- [x] 플로팅 미니 플레이어 및 확장 플레이어
- [x] 전체 대본 리더, 현재 대본 구간 강조, 대본 구간 클릭 이동
- [x] 모바일 바텀 시트·안전 영역·반응형 레이아웃 보정
- [x] Mock 데이터 어댑터 및 `OdiiStoryItem` 타입 구성

## 공공데이터 API 연동 — 대기

현재 공공데이터포털 로그인/서비스 상태가 정상화되고 서비스 키를 발급받은 뒤 진행한다.

- [ ] 공공데이터포털 로그인 및 `Odii` 활용 신청
- [ ] 서비스 키 발급 및 서버 환경변수 등록
- [ ] API 응답과 문서 명세의 실제 필드 검증
- [ ] 개발/운영 키 및 호출 한도 관리

### 사용할 원본 API

| 목적 | 한국관광공사 Odii API |
| --- | --- |
| 관광지 목록·테마·주소 | `themeBasedList`, `themeLocationBasedList`, `themeSearchList` |
| 이야기·대본·음원·이미지 | `storyBasedList`, `storyLocationBasedList`, `storySearchList` |
| 데이터 갱신 | `themeBaseSyncdList`, `storyBasedSyncList` |

## API 연동 구현 계획

### 1. 서버 어댑터/BFF

프론트에서 공공 API를 직접 조합하지 않고, 온마루 서버에서 관광지와 이야기를 `tid + tlid` 기준으로 병합한다.

- [ ] `GET /api/odii/featured`
- [ ] `GET /api/odii/nearby?lat=&lng=&radius=`
- [ ] `GET /api/odii/stories?category=&query=&page=&size=`
- [ ] `GET /api/odii/stories/:tid/:tlid`
- [ ] API 오류·빈 값·호출 한도에 대한 fallback 응답

### 2. API 필드 변환 규칙

| UI 필드 | 원본 또는 변환 방식 |
| --- | --- |
| ID, 제목, 대본, 음원, 이미지, 재생시간, 좌표 | Odii 이야기 API 필드 직접 사용 |
| 주소·테마 | 관광지 API의 `addr1`, `addr2`, `themaCategory` 병합 |
| `formattedDuration` | `playTime`에서 파생 |
| 거리 | 사용자 좌표와 `mapX`, `mapY`로 계산 |
| 해설자·좋아요·에디토리얼 배지 | Odii 미제공: 숨김 또는 온마루 자체 데이터로 관리 |

`audioUrl`, `imageUrl`, `script`는 선택 필드이므로 빈 값일 때 재생 버튼·이미지·대본 UI가 안전하게 축소되도록 처리한다.

## 다음 개선 항목

- [ ] 실제 위치 권한 요청과 거리순 정렬
- [ ] API 페이지네이션 및 목록 추가 로드
- [ ] 음원 재생 오류·외부 CDN 지연 처리
- [ ] 대본 화자 표기(`[남자]`, `[여자]` 등) 가독성 개선
- [ ] 북마크/최근 청취를 온마루 계정 데이터와 연결
- [ ] 추천 기준(테마·거리·최근 청취) 정의
- [ ] 실제 모바일 기기 QA 및 접근성 키보드/스크린리더 검증

## 검증 기준

- `npx tsc --noEmit`
- 수정 파일 ESLint 검사
- 공공 API 연결 뒤 실제 응답 샘플로 이미지·음원·대본·빈 값 케이스 검증
