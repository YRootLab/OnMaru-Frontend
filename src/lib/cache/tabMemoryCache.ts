const MAX_ENTRIES = 100;

interface CacheEntry<T> {
  value: T;
  storedAt: number;
  expiresAt: number;
  lastAccessed: number;
}

export class TabMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  get<T>(key: string): { value: T; isStale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    entry.lastAccessed = Date.now();
    return { value: entry.value, isStale: Date.now() > entry.expiresAt };
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    const now = Date.now();
    this.store.set(key, { value, storedAt: now, expiresAt: now + ttlMs, lastAccessed: now });
    this.evict();
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }

  getInFlight<T>(key: string): Promise<T> | undefined {
    return this.inFlight.get(key) as Promise<T> | undefined;
  }

  setInFlight<T>(key: string, promise: Promise<T>): void {
    this.inFlight.set(key, promise as Promise<unknown>);
  }

  clearInFlight(key: string, forPromise: Promise<unknown>): void {
    if (this.inFlight.get(key) === forPromise) this.inFlight.delete(key);
  }

  size(): number {
    return this.store.size;
  }

  reset(): void {
    this.store.clear();
    this.inFlight.clear();
  }

  private evict(): void {
    if (this.store.size <= MAX_ENTRIES) return;
    let lruKey = '';
    let lruTime = Infinity;
    for (const [k, e] of this.store) {
      if (e.lastAccessed < lruTime) { lruTime = e.lastAccessed; lruKey = k; }
    }
    if (lruKey) this.store.delete(lruKey);
  }
}

export const tabCache = new TabMemoryCache();

/**
 * SWR 어댑터: fresh → 즉시 반환, stale → 즉시 반환 + 백그라운드 갱신,
 * miss → 로딩 후 저장. in-flight 중복 요청은 Promise 공유.
 */
export async function swrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  options?: {
    validate?: (v: T) => boolean;
    force?: boolean;
    onRevalidate?: (value: T) => void;
    onRevalidateError?: (err: unknown) => void;
  },
): Promise<{ value: T; wasStale: boolean; fromCache: boolean }> {
  const cached = tabCache.get<T>(key);

  if (cached && !cached.isStale && !options?.force) {
    return { value: cached.value, wasStale: false, fromCache: true };
  }

  if (cached?.isStale && !options?.force) {
    // stale: 즉시 반환 + 백그라운드 갱신
    void (async () => {
      const existing = tabCache.getInFlight<T>(key);
      if (existing) {
        existing.then(options?.onRevalidate).catch(options?.onRevalidateError);
        return;
      }
      const p = fetcher();
      tabCache.setInFlight(key, p);
      try {
        const next = await p;
        if (options?.validate?.(next) === false) return;
        tabCache.set(key, next, ttlMs);
        options?.onRevalidate?.(next);
      } catch (err) {
        options?.onRevalidateError?.(err);
      } finally {
        tabCache.clearInFlight(key, p as Promise<unknown>);
      }
    })();
    return { value: cached.value, wasStale: true, fromCache: true };
  }

  // miss 또는 force: 직접 fetch (in-flight 병합)
  const existing = tabCache.getInFlight<T>(key);
  if (existing && !options?.force) {
    const value = await existing;
    return { value, wasStale: false, fromCache: false };
  }

  const p = fetcher();
  tabCache.setInFlight(key, p);
  try {
    const value = await p;
    if (options?.validate?.(value) !== false) {
      tabCache.set(key, value, ttlMs);
    }
    return { value, wasStale: false, fromCache: false };
  } finally {
    tabCache.clearInFlight(key, p as Promise<unknown>);
  }
}
