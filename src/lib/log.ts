/**
 * 기능별 콘솔 로거. 이미 코드베이스가 쓰던 `[Namespace] 메시지` 규약을 켜고 끌 수 있게만 한 것.
 *
 * 브라우저 — DevTools 콘솔에서:
 *   localStorage.debug = 'map'          // map만
 *   localStorage.debug = 'map,landing'  // 여러 개
 *   localStorage.debug = '*'            // 전부
 *   localStorage.removeItem('debug')    // 끄기
 *   → 바꾼 뒤 새로고침. 로거는 모듈 로드 시 한 번만 판정한다.
 *
 * 서버(route handler) — .env.local 에 DEBUG=map,tourapi
 *
 * warn/error는 토글 대상이 아니다. 꺼도 되는 거였으면 애초에 warn이 아니다.
 */

const noop = () => {};

function enabled(ns: string): boolean {
  const raw =
    typeof window === 'undefined' ? process.env.DEBUG : window.localStorage.getItem('debug');
  const v = raw ?? '';
  return v === '*' || v.split(',').some((s) => s.trim() === ns);
}

export function logger(ns: string) {
  const on = enabled(ns);
  // bind로 넘긴다 — 함수로 감싸면 DevTools가 호출 지점 대신 log.ts 줄번호를 찍는다.
  const tag = [`%c${ns}`, 'color:#e85a18;font-weight:700'] as const;
  return {
    log: on ? console.log.bind(console, ...tag) : noop,
    table: on ? console.table.bind(console) : noop,
    warn: console.warn.bind(console, ...tag),
    error: console.error.bind(console, ...tag),
  };
}

export const __test = { enabled };
