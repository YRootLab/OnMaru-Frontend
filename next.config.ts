import type { NextConfig } from "next";
import path from "path";
import { resolveKakaoMapKey } from "./src/config/kakaoMapEnv";

const kakaoMapKey = resolveKakaoMapKey(process.env);

const nextConfig: NextConfig = {
  compiler: {
    emotion: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: kakaoMapKey
    ? {
        NEXT_PUBLIC_KAKAO_MAP_KEY: kakaoMapKey,
      }
    : {},
};

export default nextConfig;
