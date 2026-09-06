# Hanok Archive

## 데이터 로딩

`/hanok`은 외부 TourAPI 응답을 서버 렌더의 선행 조건으로 사용하지 않는다.

1. `src/app/hanok/page.tsx`가 `HANOK_ARCHIVE_FALLBACK` snapshot으로 즉시 HTML을 만든다.
2. `HanokArchive`가 hydration 후 내부 adapter route인 `/api/tourapi`를 요청한다.
3. 응답이 현재 `{ villages, meta }` 계약에 맞고 `villages`가 비어 있지 않을 때만 화면 데이터를 교체한다.
4. timeout, HTTP 오류, 빈 배열 또는 향후 backend payload 변경이 발생하면 snapshot을 그대로 유지한다.

외부 TourAPI URL과 인증 방식은 `TourApiClient`, raw payload 변환은 `HanokArchiveService`, UI에 전달할 최소 payload 검증은 `decodeHanokArchivePayload`가 담당한다. UI 컴포넌트는 외부 URL이나 API key를 알지 않는다.

## 정적 Snapshot

`src/data/hanokVillages.fallback.json`은 TourAPI 장애나 개발 환경의 network 단절에도 도감, 이달의 한옥, 지도 marker를 유지하기 위한 마지막 정상 snapshot이다. 변경 시 다음 조건을 지킨다.

- `Village` 계약과 호환되어야 한다.
- image URL은 fallback module에서 HTTPS로 정규화한다.
- `meta.total`, type 통계, badge 통계는 snapshot에서 계산한다.
- 실시간 응답이 빈 배열이면 정상 갱신으로 취급하지 않는다.

## 화면 배경

한옥도감의 페이지 canvas와 해당 route에서 적용하는 body 배경은 `#ffffff`다. 카드, semantic color, 선택 상태, typography, animation 색은 각 컴포넌트의 기존 값을 유지한다.

## 검증

```bash
npx vitest run src/hanok/data/hanokArchiveFallback.test.ts
curl -sS -o /dev/null -w '%{http_code} %{time_total}\n' http://localhost:3000/hanok
```
