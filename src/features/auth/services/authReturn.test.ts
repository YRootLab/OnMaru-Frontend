import { describe, expect, it } from 'vitest';
import {
  buildAuthReturnCleanup,
  parseAuthReturnParam,
  resolveKakaoLoginReturnTo,
} from './authReturn';

describe('parseAuthReturnParam (가이드 §1-2 복귀 감지)', () => {
  it('recognizes success and failed', () => {
    expect(parseAuthReturnParam('?auth=success')).toBe('success');
    expect(parseAuthReturnParam('?auth=failed')).toBe('failed');
  });

  it('returns null for anything else — unknown values never act as login', () => {
    expect(parseAuthReturnParam('?auth=denied')).toBeNull();
    expect(parseAuthReturnParam('')).toBeNull();
    expect(parseAuthReturnParam('?returnTo=/discover')).toBeNull();
    expect(parseAuthReturnParam('?AUTH=success')).toBeNull();
  });

  it('works when other query values surround auth', () => {
    expect(parseAuthReturnParam('?tab=map&auth=success')).toBe('success');
    expect(parseAuthReturnParam('?auth=failed&explorationId=exp-1')).toBe('failed');
  });
});

describe('resolveKakaoLoginReturnTo (가이드 §1-1 로그인 시작)', () => {
  it('returns the guest back to the page they logged in from, query included', () => {
    expect(
      resolveKakaoLoginReturnTo({ pathname: '/discover', search: '?mood=calm', hasPendingSave: false })
    ).toBe('/discover?mood=calm');
    expect(
      resolveKakaoLoginReturnTo({ pathname: '/map', search: '', hasPendingSave: false })
    ).toBe('/map');
  });

  it('falls back to /mypage when login starts from an auth page', () => {
    expect(
      resolveKakaoLoginReturnTo({ pathname: '/auth/login', search: '', hasPendingSave: false })
    ).toBe('/mypage');
    expect(
      resolveKakaoLoginReturnTo({
        pathname: '/auth/kakao/callback',
        search: '?auth=failed',
        hasPendingSave: false,
      })
    ).toBe('/mypage');
  });

  it('routes to home so the pending journey save can finish after login', () => {
    expect(
      resolveKakaoLoginReturnTo({ pathname: '/map', search: '?place=p-1', hasPendingSave: true })
    ).toBe('/');
  });

  it('never returns an absolute URL (open redirect guard is upstream, but paths only)', () => {
    const result = resolveKakaoLoginReturnTo({
      pathname: '/discover',
      search: '?next=https://evil.example',
      hasPendingSave: false,
    });
    expect(result.startsWith('/')).toBe(true);
  });
});

describe('buildAuthReturnCleanup (가이드 §1-2 쿼리 정리)', () => {
  it('strips only the auth param so refreshes never re-process the return', () => {
    expect(buildAuthReturnCleanup('/discover', '?auth=success')).toBe('/discover');
    expect(buildAuthReturnCleanup('/discover', '?auth=success&tab=map')).toBe('/discover?tab=map');
  });

  it('keeps unrelated params and bare paths intact', () => {
    expect(buildAuthReturnCleanup('/map', '?tab=map')).toBe('/map?tab=map');
    expect(buildAuthReturnCleanup('/map', '')).toBe('/map');
  });
});