import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearPrivateClientState, hasAuthenticatedUser, markSessionHint } from './privateState';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
  } as Storage;
}

/*
  localStorage 개인 데이터 캐싱은 폐기됐다(가이드 §1-3). 이 힌트는 sessionStorage의
  가벼운 게스트 UI 게이트 용도로만 쓰인다 — localStorage에는 아무것도 남지 않아야 한다.
*/
describe('privateState (가이드 §1-3 — localStorage 개인 데이터 금지)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts as guest', () => {
    vi.stubGlobal('window', { localStorage: createMemoryStorage(), sessionStorage: createMemoryStorage() });
    expect(hasAuthenticatedUser()).toBe(false);
  });

  it('marks the hint in sessionStorage only — never localStorage', () => {
    const localStorage = createMemoryStorage();
    const sessionStorage = createMemoryStorage();
    vi.stubGlobal('window', { localStorage, sessionStorage });

    markSessionHint();

    expect(hasAuthenticatedUser()).toBe(true);
    expect(sessionStorage.length).toBe(1);
    expect(localStorage.length).toBe(0);
  });

  it('clearPrivateClientState wipes private keys from both storages', () => {
    const localStorage = createMemoryStorage();
    const sessionStorage = createMemoryStorage();
    sessionStorage.setItem('onmaru_session_hint', '1');
    sessionStorage.setItem('onmaru.mock_session', '1');
    localStorage.setItem('onmaru_access_token', 'legacy');
    vi.stubGlobal('window', { localStorage, sessionStorage });

    clearPrivateClientState();

    expect(hasAuthenticatedUser()).toBe(false);
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('is safe on the server (no window)', () => {
    expect(hasAuthenticatedUser()).toBe(false);
    expect(() => clearPrivateClientState()).not.toThrow();
  });
});