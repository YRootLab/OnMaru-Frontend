type KakaoMapEnvironment = Record<string, string | undefined>;

export function resolveKakaoMapKey(env: KakaoMapEnvironment): string | undefined {
  const key = env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim() || env.KAKAO_MAP_KEY?.trim();
  return key || undefined;
}
