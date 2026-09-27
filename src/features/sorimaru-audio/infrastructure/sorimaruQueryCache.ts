import type { SorimaruListQuery } from '../domain/sorimaruStory';

export const sorimaruQueryKeys = {
  list: (query: SorimaruListQuery) =>
    `odii:list:${query.language}:${query.category ?? ''}:${query.regionCode ?? ''}:${query.cursor ?? ''}:${query.limit}`,
  detail: (storyId: string, language: string) => `odii:detail:${language}:${storyId}`,
  regions: (language: string) => `odii:regions:${language}`,
};

export function createSorimaruQueryCache() {
  const successes = new Map<string, unknown>();
  const inFlight = new Map<string, Promise<unknown>>();

  return {
    read<T>(key: string, load: () => Promise<T>, options?: { force?: boolean }): Promise<T> {
      const pending = inFlight.get(key) as Promise<T> | undefined;
      if (pending) return pending;
      if (!options?.force && successes.has(key)) return Promise.resolve(successes.get(key) as T);

      const request = Promise.resolve()
        .then(load)
        .then((value) => {
          successes.set(key, value);
          return value;
        })
        .finally(() => {
          inFlight.delete(key);
        });
      inFlight.set(key, request);
      return request;
    },
  };
}
