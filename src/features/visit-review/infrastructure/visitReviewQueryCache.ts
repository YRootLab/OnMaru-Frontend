type CacheEntry = {
  expiresAt: number;
  promise: Promise<unknown>;
};

export type VisitReviewQueryCache = {
  get<T>(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T>;
  invalidate(prefix?: string): void;
};

export function createVisitReviewQueryCache(
  now: () => number = Date.now,
): VisitReviewQueryCache {
  const entries = new Map<string, CacheEntry>();

  return {
    get<T>(key: string, loader: () => Promise<T>, ttlMs = 30_000): Promise<T> {
      const cached = entries.get(key);
      if (cached && cached.expiresAt > now()) {
        return cached.promise as Promise<T>;
      }

      const promise = loader().catch((error) => {
        entries.delete(key);
        throw error;
      });
      entries.set(key, { expiresAt: now() + ttlMs, promise });
      return promise;
    },

    invalidate(prefix = '') {
      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) entries.delete(key);
      }
    },
  };
}
