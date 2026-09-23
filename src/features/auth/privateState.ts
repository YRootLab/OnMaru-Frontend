const PRIVATE_STORAGE_KEYS = [
  'onmaru_user',
  'onmaru_access_token',
  'onmaru_refresh_token',
  'onmaru.mock_session',
  'onmaru.pendingSaveIntent.v1',
];

/*
  HttpOnly 세션 쿠키 외에 남는 유일한 로그인 흔적이다. localStorage 개인 데이터
  캐싱은 폐기됐으므로(가이드 §1-3: 로그인 상태 판단은 항상 GET /members/me 응답으로),
  이 힌트는 "이 탭에서 로그인한 적 있음" 정도의 게스트 UI 게이트 용도로만 쓴다.
*/
const SESSION_HINT_KEY = 'onmaru_session_hint';

export function hasAuthenticatedUser(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.sessionStorage.getItem(SESSION_HINT_KEY));
}

export function markSessionHint(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_HINT_KEY, '1');
  } catch {
    // 저장 실패해도 로그인 자체는 막지 않는다.
  }
}

export function clearPrivateClientState(storage?: Storage): void {
  if (typeof window === 'undefined' && !storage) return;

  const targetStorage = storage ?? window.localStorage;
  PRIVATE_STORAGE_KEYS.forEach((key) => {
    targetStorage.removeItem(key);
    // 목 모드 세션 플래그 등 일부 키는 sessionStorage에 살 수도 있다.
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(key);
    }
  });
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('onmaru.pendingSaveIntent.v1');
    window.sessionStorage.removeItem(SESSION_HINT_KEY);
  }
}
