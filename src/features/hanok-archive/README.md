# Hanok Archive

## 데이터 로딩

`/hanok`은 백엔드 API를 Single Source of Truth로 사용한다 (2026-09-23 기준).

1. `src/app/hanok/page.tsx`가 `HANOK_ARCHIVE_FALLBACK` snapshot으로 즉시 HTML을 만든다.
2. `HanokArchive`가 hydration 후 백엔드 API `/hanoks`를 요청한다.
3. 응답이 현재 계약에 맞고 비어 있지 않을 때만 화면 데이터를 교체한다.
4. timeout, HTTP 오류, 빈 배열이 발생하면 snapshot을 그대로 유지한다.

백엔드 fetch는 `infrastructure/backendHanokSource.ts`에서 담당한다. `HanokArchiveService`(`services/hanokArchive.service.ts`)는 이 함수를 직접 export하는 얇은 진입점이다. 프론트엔드는 필터링, 분류, 변환을 하지 않고 백엔드에서 제공하는 데이터를 그대로 사용한다. UI에 전달할 최소 payload 검증은 `decodeHanokArchivePayload`가 담당한다. UI 컴포넌트는 외부 URL이나 API key를 알지 않는다.

## 정적 Snapshot

`src/data/hanokVillages.fallback.json`은 TourAPI 장애나 개발 환경의 network 단절에도 도감, 이달의 한옥, 지도 marker를 유지하기 위한 마지막 정상 snapshot이다. 변경 시 다음 조건을 지킨다.

- `Village` 계약과 호환되어야 한다.
- image URL은 fallback module에서 HTTPS로 정규화한다.
- `meta.total`, type 통계, badge 통계는 snapshot에서 계산한다.
- 실시간 응답이 빈 배열이면 정상 갱신으로 취급하지 않는다.

## 화면 배경

한옥도감의 페이지 canvas, 공통 `PageContainer`가 만드는 상단/좌우 여백, 해당 route의 `html`/`body`, 지도 지연 로딩 면은 `#ffffff`다. `PageContainer`의 `data-page-surface="hanok"` 표식을 전역 selector가 감지하므로 theme style 재주입이나 client navigation 뒤에도 회색 app canvas로 돌아가지 않는다. 한옥 route에서는 회색에서 흰색으로 보이는 body 배경 transition도 비활성화한다. 카드, semantic color, 선택 상태, typography, animation 색은 각 컴포넌트의 기존 값을 유지한다.

## 카카오 지도 설정

한옥 전국 지도와 `/map`은 Kakao Maps JavaScript SDK를 사용한다. 로컬 환경에는 다음 중 하나를 설정하고 개발 서버를 재시작한다.

```dotenv
KAKAO_MAP_KEY=your-javascript-key
# 또는
NEXT_PUBLIC_KAKAO_MAP_KEY=your-javascript-key
```

`next.config.ts`가 두 이름을 `NEXT_PUBLIC_KAKAO_MAP_KEY` 하나로 정규화한다. 공개형 이름이 둘 다 있으면 이를 우선한다. JavaScript SDK key는 브라우저 bundle에 포함되는 공개 식별자이므로 Kakao Developers의 Web 플랫폼에서 실제 origin(로컬 기본값 `http://localhost:3000`)을 제한해야 한다.

지도는 최초 HTML과 API 갱신을 막지 않도록 viewport 근처에서만 mount된다. 키가 없거나 SDK script가 실패하면 지도 영역 안에 원인을 표시하고, 한옥 snapshot과 나머지 화면은 그대로 유지한다.

## 섹션 Reveal

인트로, 이달의 한옥, 도감, 스테이, 전국 지도, 매니페스토는 `src/shared/components/animation/VesselReveal.tsx`를 그대로 사용한다. Hanok 내부에서 별도 observer나 animation state를 만들지 않는다.

- 처음 reveal 경계에 진입하는 섹션만 축소 상태에서 최종 크기로 펼쳐진다.
- 현재 viewport에 있거나 새로고침 위치보다 위에 있는 섹션은 완성 상태를 유지한다.
- snapshot이 background refresh 데이터로 교체되어도 reveal wrapper identity는 유지된다.
- reduced-motion, scale, duration, easing은 공용 모듈의 계약을 따른다.

## 검증

```bash
npx vitest run src/hanok/data/hanokArchiveFallback.test.ts
curl -sS -o /dev/null -w '%{http_code} %{time_total}\n' http://localhost:3000/hanok
```
