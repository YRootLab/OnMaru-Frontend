/*
  카카오 로그인 복귀 흐름의 순수 로직 (가이드 §1-1, §1-2).

  훅(useAuth, useAuthReturn)은 이 모듈의 함수로 네비게이션만 수행한다 —
  BE/FE 원인 판별 테스트가 여기서 계약 전체를 커버한다.
*/

export type AuthReturnResult = 'success' | 'failed' | null;

/**
 * `{returnTo}?auth=success|failed` 복귀 쿼리를 판별한다. 성공·실패 외 값은 null.
 */
export function parseAuthReturnParam(search: string): AuthReturnResult {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const value = new URLSearchParams(raw).get('auth');
  return value === 'success' || value === 'failed' ? value : null;
}

/**
 * 로그인 시작 시 돌아갈 내부 경로를 정한다 (open redirect 방지를 위해 경로만 넘긴다).
 * - 여정 저장 intent가 대기 중이면 `/`로 돌아와 저장을 마저 끝낸다.
 * - 로그인 화면(`auth/*`)에서 시작했으면 기본 복귀 지점 `/mypage`를 쓴다.
 * - 그 외엔 로그인을 시작한 페이지·쿼리를 그대로 유지한다.
 */
export function resolveKakaoLoginReturnTo(options: {
  pathname: string;
  search: string;
  hasPendingSave: boolean;
}): string {
  if (options.hasPendingSave) return '/';
  if (!options.pathname.startsWith('/auth/')) {
    return `${options.pathname}${options.search}`;
  }
  return '/mypage';
}

/**
 * 복귀 처리 후 `auth` 파라미터만 제거한 URL을 만든다 — 뒤로 가기·새로고침 재처리 방지.
 */
export function buildAuthReturnCleanup(pathname: string, search: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  params.delete('auth');
  const remaining = params.toString();
  return remaining ? `${pathname}?${remaining}` : pathname;
}
