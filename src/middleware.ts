import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    // strict-dynamic: nonce'd script이 로드한 하위 스크립트도 신뢰. URL 화이트리스트는 CSP1 폴백용.
    // unsafe-eval: React 개발 모드 전용 (callstack 재구성 등). 프로덕션에선 포함 안 됨.
    `script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://spoqa.github.io https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://spoqa.github.io https://cdn.jsdelivr.net",
    "connect-src 'self' blob: https: wss:",
    "media-src 'self' blob:",
    "worker-src 'self' blob: https:",
    "frame-src https://www.googletagmanager.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  const reqHeaders = new Headers(request.headers);
  reqHeaders.set('x-nonce', nonce);
  reqHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: reqHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
