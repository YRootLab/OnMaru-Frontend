import type { NextConfig } from "next";
import path from "path";
function resolveKakaoMapKey(env: Record<string, string | undefined>): string | undefined {
  const key = env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim() || env.KAKAO_MAP_KEY?.trim();
  return key || undefined;
}

const kakaoMapKey = resolveKakaoMapKey(process.env);

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
];

const nextConfig: NextConfig = {
  compiler: {
    emotion: true,
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL_INTERNAL ?? 'https://api.onmaru.site';
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  env: kakaoMapKey
    ? {
        NEXT_PUBLIC_KAKAO_MAP_KEY: kakaoMapKey,
      }
    : {},
};

export default nextConfig;
