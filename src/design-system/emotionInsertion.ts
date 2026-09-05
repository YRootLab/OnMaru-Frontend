import type { EmotionCache } from '@emotion/utils';

export interface EmotionInsertionFlush {
  names: string[];
  css: string;
}

export interface EmotionInsertionTracker {
  flush(): EmotionInsertionFlush | null;
}

export function createEmotionInsertionTracker(cache: EmotionCache): EmotionInsertionTracker {
  const pendingNames: string[] = [];
  const originalInsert = cache.insert;

  cache.insert = (selector, serialized, sheet, shouldCache) => {
    if (cache.inserted[serialized.name] === undefined) {
      pendingNames.push(serialized.name);
    }
    return originalInsert(selector, serialized, sheet, shouldCache);
  };

  return {
    flush() {
      if (pendingNames.length === 0) return null;

      const names = pendingNames.splice(0, pendingNames.length);
      const css = names
        .map((name) => cache.inserted[name])
        .filter((value): value is string => typeof value === 'string')
        .join(' ');

      return { names, css };
    },
  };
}
