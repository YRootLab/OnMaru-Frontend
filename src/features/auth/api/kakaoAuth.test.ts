import { beforeEach, describe, expect, it } from 'vitest';
import { resetApiClientForTests } from '@/lib/api/client';
import { buildBackendKakaoLoginUrl } from './kakaoAuth';

describe('buildBackendKakaoLoginUrl (FE 카카오 로그인 가이드 §1-1)', () => {
  beforeEach(() => {
    resetApiClientForTests({ baseUrl: 'http://localhost:8080' });
  });

  it('builds the backend login start url with returnTo', () => {
    expect(buildBackendKakaoLoginUrl('/discover')).toBe(
      'http://localhost:8080/auth/kakao/login?returnTo=%2Fdiscover'
    );
  });

  it('appends explorationId for guest exploration succession', () => {
    const url = new URL(buildBackendKakaoLoginUrl('/discover', 'exp-uuid'));
    expect(url.pathname).toBe('/auth/kakao/login');
    expect(url.searchParams.get('returnTo')).toBe('/discover');
    expect(url.searchParams.get('explorationId')).toBe('exp-uuid');
  });
});