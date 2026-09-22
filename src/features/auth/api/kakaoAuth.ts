import { getApiRootBaseUrl } from '@/lib/api/client';

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';



export function getKakaoRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI) return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/kakao/callback`;
  return '';
}


export function buildMockKakaoAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '',
    redirect_uri: getKakaoRedirectUri(),
    response_type: 'code',
  });
  return `${KAKAO_AUTH_URL}?${params.toString()}`;
}







export function buildBackendKakaoLoginUrl(returnTo: string): string {
  const params = new URLSearchParams({ returnTo });
  return `${getApiRootBaseUrl()}/auth/kakao/login?${params.toString()}`;
}
