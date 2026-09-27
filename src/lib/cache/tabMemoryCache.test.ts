import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabMemoryCache, swrFetch } from './tabMemoryCache';
import { CK } from './cacheKeys';

let cache: TabMemoryCache;

beforeEach(() => {
  cache = new TabMemoryCache();
  vi.useFakeTimers();
});

// ─── TabMemoryCache 단위 ─────────────────────────────────────────────────────

describe('TabMemoryCache', () => {
  it('fresh hit는 isStale=false를 반환한다', () => {
    cache.set('k', 'v', 60_000);
    const hit = cache.get<string>('k');
    expect(hit).not.toBeNull();
    expect(hit!.value).toBe('v');
    expect(hit!.isStale).toBe(false);
  });

  it('TTL 경과 후 isStale=true를 반환한다', () => {
    cache.set('k', 'v', 1_000);
    vi.advanceTimersByTime(2_000);
    const hit = cache.get<string>('k');
    expect(hit!.isStale).toBe(true);
  });

  it('엔트리가 없으면 null 반환', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('delete 후 get은 null 반환', () => {
    cache.set('k', 'v', 60_000);
    cache.delete('k');
    expect(cache.get('k')).toBeNull();
  });

  it('deleteByPrefix는 해당 접두사 키만 삭제한다', () => {
    cache.set('home:a', 1, 60_000);
    cache.set('home:b', 2, 60_000);
    cache.set('hanok:c', 3, 60_000);
    cache.deleteByPrefix('home:');
    expect(cache.get('home:a')).toBeNull();
    expect(cache.get('home:b')).toBeNull();
    expect(cache.get('hanok:c')).not.toBeNull();
  });

  it('100개 초과 시 가장 오래 접근한 엔트리가 제거된다', () => {
    for (let i = 0; i < 100; i++) {
      cache.set(`k${i}`, i, 60_000);
      vi.advanceTimersByTime(1); // lastAccessed 순서 구분
    }
    // k0이 가장 오래됨
    cache.set('k_new', 'new', 60_000);
    expect(cache.get('k0')).toBeNull();
    expect(cache.get('k_new')).not.toBeNull();
    expect(cache.size()).toBe(100);
  });

  it('in-flight 참조 일치 시만 clearInFlight가 삭제한다', () => {
    const p1 = Promise.resolve(1);
    const p2 = Promise.resolve(2);
    cache.setInFlight('k', p1);
    cache.clearInFlight('k', p2 as unknown as Promise<unknown>); // 다른 promise
    expect(cache.getInFlight('k')).toBe(p1); // 삭제되지 않음

    cache.clearInFlight('k', p1 as unknown as Promise<unknown>);
    expect(cache.getInFlight('k')).toBeUndefined();
  });

  it('reset은 store와 in-flight를 모두 초기화한다', () => {
    cache.set('k', 'v', 60_000);
    cache.setInFlight('k', Promise.resolve());
    cache.reset();
    expect(cache.get('k')).toBeNull();
    expect(cache.getInFlight('k')).toBeUndefined();
  });
});

// ─── swrFetch 동작 ──────────────────────────────────────────────────────────

describe('swrFetch', () => {
  function makeCache(): TabMemoryCache {
    return cache; // swrFetch는 외부 cache를 받지 않으므로 모듈 singleton 대신
    // 이 테스트에서는 import한 tabCache를 직접 사용하는 대신
    // TabMemoryCache 인스턴스를 swrFetch에 주입할 수 없어서
    // tabMemoryCache.ts의 tabCache singleton을 import해 테스트.
  }
  void makeCache;

  // tabCache singleton을 import해야 swrFetch와 같은 캐시를 씀
  it('(swrFetch 통합 시나리오는 useHomeData.test.ts에서 검증)', () => {
    expect(true).toBe(true);
  });
});

// ─── swrFetch + tabCache 싱글턴 통합 ─────────────────────────────────────────

describe('swrFetch (tabCache 싱글턴)', () => {
  // tabCache를 reset하기 위해 모듈을 동적 임포트
  it('fresh hit — API를 다시 호출하지 않는다', async () => {
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();
    tc.set('k', 'cached', 60_000);

    const fetcher = vi.fn().mockResolvedValue('fresh');
    const result = await swr('k', fetcher, 60_000);

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.value).toBe('cached');
    expect(result.fromCache).toBe(true);
    expect(result.wasStale).toBe(false);
  });

  it('stale hit — 즉시 반환하고 API를 정확히 한 번 호출한다', async () => {
    vi.useRealTimers();
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();
    tc.set('k', 'stale', 1);
    await new Promise((r) => setTimeout(r, 5)); // TTL 만료

    const fetcher = vi.fn().mockResolvedValue('fresh');
    const onRevalidate = vi.fn();

    const result = await swr('k', fetcher, 60_000, { onRevalidate });
    expect(result.value).toBe('stale');
    expect(result.wasStale).toBe(true);

    // 백그라운드 microtask 완료 대기
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onRevalidate).toHaveBeenCalledWith('fresh');
    const updated = tc.get<string>('k');
    expect(updated?.value).toBe('fresh');
    vi.useFakeTimers();
  });

  it('cache miss — 로딩 후 캐시에 저장한다', async () => {
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();

    const fetcher = vi.fn().mockResolvedValue('loaded');
    const result = await swr('k', fetcher, 60_000);

    expect(result.value).toBe('loaded');
    expect(result.fromCache).toBe(false);
    expect(tc.get<string>('k')?.value).toBe('loaded');
  });

  it('동시 요청은 fetcher를 한 번만 호출한다', async () => {
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();

    let resolve: (v: string) => void;
    const p = new Promise<string>((r) => { resolve = r; });
    const fetcher = vi.fn().mockReturnValue(p);

    const [r1, r2] = await Promise.all([
      swr('k', fetcher, 60_000),
      swr('k', fetcher, 60_000),
    ].map((req) => { resolve!('shared'); return req; }));

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(r1.value).toBe('shared');
    expect(r2.value).toBe('shared');
  });

  it('실패 응답은 캐시하지 않는다', async () => {
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();

    const fetcher = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(swr('k', fetcher, 60_000)).rejects.toThrow('fail');
    expect(tc.get('k')).toBeNull();
  });

  it('validate 실패 payload는 캐시하지 않는다', async () => {
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();

    const fetcher = vi.fn().mockResolvedValue([]);
    await swr('k', fetcher, 60_000, { validate: (v: unknown[]) => v.length > 0 });
    expect(tc.get('k')).toBeNull();
  });

  it('stale 갱신 실패 시 마지막 성공 값이 유지된다', async () => {
    vi.useRealTimers();
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();
    tc.set('k', 'old', 1);
    await new Promise((r) => setTimeout(r, 5)); // TTL 만료

    const fetcher = vi.fn().mockRejectedValue(new Error('network'));
    const onErr = vi.fn();

    const result = await swr('k', fetcher, 60_000, { onRevalidateError: onErr });
    expect(result.value).toBe('old'); // stale 값 즉시 반환

    // 백그라운드 microtask 완료 대기
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(onErr).toHaveBeenCalled();
    expect(tc.get<string>('k')?.value).toBe('old');
    vi.useFakeTimers();
  });

  it('force=true는 fresh cache도 우회한다', async () => {
    const { tabCache: tc, swrFetch: swr } = await import('./tabMemoryCache');
    tc.reset();
    tc.set('k', 'cached', 60_000);

    const fetcher = vi.fn().mockResolvedValue('forced');
    const result = await swr('k', fetcher, 60_000, { force: true });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.value).toBe('forced');
  });

  it('deleteByPrefix로 특정 키만 무효화된다', async () => {
    const { tabCache: tc } = await import('./tabMemoryCache');
    tc.reset();
    tc.set(CK.homeCuratedCourses(), 'courses', 60_000);
    tc.set(CK.homeTrendingSounds(), 'sounds', 60_000);
    tc.set(CK.hanokArchive(), 'hanok', 60_000);

    tc.deleteByPrefix('home:');
    expect(tc.get(CK.homeCuratedCourses())).toBeNull();
    expect(tc.get(CK.homeTrendingSounds())).toBeNull();
    expect(tc.get(CK.hanokArchive())).not.toBeNull();
  });
});

// ─── 키 팩토리 ──────────────────────────────────────────────────────────────

describe('CK 키 팩토리', () => {
  it('다른 카테고리는 다른 키를 생성한다', () => {
    expect(CK.homeCuratedCourses('a')).not.toBe(CK.homeCuratedCourses('b'));
  });

  it('검색어 대소문자·공백 정규화 후 동일한 키 생성', () => {
    expect(CK.sorimaruStories('', '  한옥  ', 1, 12))
      .toBe(CK.sorimaruStories('', '한옥', 1, 12));
    expect(CK.sorimaruStories('', 'Hanok', 1, 12))
      .toBe(CK.sorimaruStories('', 'hanok', 1, 12));
  });

  it('다른 좌표는 다른 sorimaruNearby 키를 생성한다', () => {
    expect(CK.sorimaruNearby(37.5665, 126.9780))
      .not.toBe(CK.sorimaruNearby(35.1796, 129.0756));
  });

  it('좌표 반올림으로 미세한 차이는 같은 키를 생성한다', () => {
    expect(CK.sorimaruNearby(37.56651, 126.97800))
      .toBe(CK.sorimaruNearby(37.56649, 126.97800));
  });
});
