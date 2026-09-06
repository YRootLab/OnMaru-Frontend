import { describe, expect, it } from 'vitest';
import { resolveKakaoMapKey } from './kakaoMapEnv';

describe('resolveKakaoMapKey', () => {
  it('accepts the server-side key name used by local development', () => {
    expect(resolveKakaoMapKey({ KAKAO_MAP_KEY: 'server-key' })).toBe('server-key');
  });

  it('prefers the explicit public key when both names exist', () => {
    expect(resolveKakaoMapKey({
      KAKAO_MAP_KEY: 'server-key',
      NEXT_PUBLIC_KAKAO_MAP_KEY: 'public-key',
    })).toBe('public-key');
  });

  it('ignores blank values', () => {
    expect(resolveKakaoMapKey({ KAKAO_MAP_KEY: '  ' })).toBeUndefined();
  });
});
