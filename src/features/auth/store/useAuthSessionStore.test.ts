import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMyProfileMock } = vi.hoisted(() => ({ getMyProfileMock: vi.fn() }));

vi.mock('../api/memberApi', () => ({
  defaultMemberRepository: {
    getMyProfile: (...args: unknown[]) => getMyProfileMock(...args),
  },
}));

import { useAuthSessionStore } from './useAuthSessionStore';

/*
  가이드 §1-3 계약: 로그인 판정은 오직 GET /members/me 응답(200 = 로그인,
  401 = 비로그인)으로 하고, 실패해도 자동 재시도하지 않는다(§1-5).
  이 테스트가 깨지면 FE 세션 판정 로직의 문제다.
*/
describe('useAuthSessionStore', () => {
  beforeEach(() => {
    getMyProfileMock.mockReset();
    useAuthSessionStore.setState({ user: undefined, hasLoadedOnce: false });
  });

  it('marks the member as logged in on 200 and shares one fetch across consumers', async () => {
    getMyProfileMock.mockResolvedValueOnce({ schemaVersion: '1.2', id: 'm-1', displayName: '여행자' });

    await useAuthSessionStore.getState().ensureSessionLoaded();
    await useAuthSessionStore.getState().ensureSessionLoaded();

    expect(useAuthSessionStore.getState().user).toEqual({ id: 'm-1', displayName: '여행자' });
    expect(getMyProfileMock).toHaveBeenCalledTimes(1);
  });

  it('marks 401 AUTH_REQUIRED as guest and never auto-retries (가이드 §1-5)', async () => {
    getMyProfileMock.mockRejectedValueOnce({
      status: 401,
      code: 'AUTH_REQUIRED',
      message: 'unauthorized',
    });

    await useAuthSessionStore.getState().ensureSessionLoaded();

    expect(useAuthSessionStore.getState().user).toBeNull();

    await useAuthSessionStore.getState().ensureSessionLoaded();
    expect(getMyProfileMock).toHaveBeenCalledTimes(1);
  });

  it('treats the pre-verification state (undefined) as loading, distinct from confirmed guest (null)', () => {
    expect(useAuthSessionStore.getState().user).toBeUndefined();
  });

  it('applies a fresh profile after a successful login return and clears on logout', () => {
    useAuthSessionStore.setState({ user: null });

    const applied = useAuthSessionStore.getState().applyProfile({ id: 'm-2', displayName: '도담' });
    expect(applied).toEqual({ id: 'm-2', displayName: '도담' });
    expect(useAuthSessionStore.getState().user).toEqual({ id: 'm-2', displayName: '도담' });

    useAuthSessionStore.getState().clear();
    expect(useAuthSessionStore.getState().user).toBeNull();
  });
});