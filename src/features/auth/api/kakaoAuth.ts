const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';

// 카카오 개발자 콘솔에 등록해 둔 리다이렉트 주소가 없으면 현재 origin 기준으로 계산한다.
export function getKakaoRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI) return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  if (typeof window !== 'undefined') return `${window.location.origin}/auth/kakao/callback`;
  return '';
}

export function buildKakaoAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '',
    redirect_uri: getKakaoRedirectUri(),
    response_type: 'code',
  });
  return `${KAKAO_AUTH_URL}?${params.toString()}`;
}
