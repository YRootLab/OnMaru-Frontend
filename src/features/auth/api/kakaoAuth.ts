import { getApiRootBaseUrl } from '@/lib/api/client';

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';

// 카카오 개발자 콘솔에 등록해 둔 리다이렉트 주소가 없으면 현재 origin 기준으로 계산한다.
// (목 모드 전용 — 백엔드가 없을 때 카카오 인가 화면을 FE가 직접 흉내내는 경로에서만 쓴다)
export function getKakaoRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI) return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/kakao/callback`;
  return '';
}

// 목 모드 전용: FE가 직접 카카오 인가 URL을 만들어 FE 콜백 페이지로 돌아오게 한다.
export function buildMockKakaoAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '',
    redirect_uri: getKakaoRedirectUri(),
    response_type: 'code',
  });
  return `${KAKAO_AUTH_URL}?${params.toString()}`;
}

/*
  실서버 로그인 시작점 — 백엔드 GET /auth/kakao/login으로 브라우저 전체를 보낸다.
  PKCE/nonce 쿠키 발급, 카카오로의 302 리다이렉트, 콜백에서의 code 검증과 세션 쿠키
  (__Host-onmaru-session) 발급까지 전부 백엔드가 처리한다. FE는 code를 절대 직접
  받지 않는다 — 로그인 완료 후 백엔드가 303으로 returnTo 경로로 돌려보낸다.
*/
export function buildBackendKakaoLoginUrl(returnTo: string): string {
  const params = new URLSearchParams({ returnTo });
  return `${getApiRootBaseUrl()}/auth/kakao/login?${params.toString()}`;
}
