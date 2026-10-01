import type { NextConfig } from "next";
import path from "path";
function resolveKakaoMapKey(env: Record<string, string | undefined>): string | undefined {
  const key = env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim() || env.KAKAO_MAP_KEY?.trim();
  return key || undefined;
}

const kakaoMapKey = resolveKakaoMapKey(process.env);

const nextConfig: NextConfig = {
  compiler: {
    emotion: true,
  },
  turbopack: {
    root: path.resolve(process.cwd()),
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
