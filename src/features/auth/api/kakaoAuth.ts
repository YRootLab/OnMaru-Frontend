import { getApiRootBaseUrl } from '@/lib/api/client';

/*
  실서버 로그인 시작점 — 백엔드 GET /auth/kakao/login으로 브라우저 전체를 보낸다.
  PKCE/nonce 쿠키 발급, 카카오로의 302 리다이렉트, 콜백에서의 code 검증과 세션 쿠키
  (__Host-onmaru-session) 발급까지 전부 백엔드가 처리한다. FE는 카카오와 직접 통신하지
  않고(JS 키·redirect URI를 전혀 다루지 않는다), code도 절대 받지 않는다.

  완료되면 백엔드가 303으로 `{returnTo}?auth=success|failed`로 돌려보내므로
  returnTo는 반드시 내부 경로여야 한다(외부 URL은 open redirect로 거부된다).
  로그인 전 게스트 탐색을 회원에게 승계하려면 explorationId를 함께 넘긴다.
*/
export function buildBackendKakaoLoginUrl(returnTo: string, explorationId?: string): string {
  const params = new URLSearchParams({ returnTo });
  if (explorationId) params.set('explorationId', explorationId);
  return `${getApiRootBaseUrl()}/auth/kakao/login?${params.toString()}`;
}
