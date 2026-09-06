import type { EmotionCache, SerializedStyles } from '@emotion/utils';
import { describe, expect, it } from 'vitest';
import { createEmotionInsertionTracker } from './emotionInsertion';

function createFakeCache(): EmotionCache {
  const inserted: Record<string, string | true> = {};
  return {
    key: 'css',
    sheet: {} as EmotionCache['sheet'],
    nonce: undefined,
    inserted,
    registered: {},
    insert: (_selector, serialized) => {
      inserted[serialized.name] = serialized.styles;
    },
  };
}

function serialized(name: string, styles: string): SerializedStyles {
  return { name, styles, next: undefined };
}

describe('createEmotionInsertionTracker', () => {
  it('flushes each inserted name exactly once', () => {
    const cache = createFakeCache();
    const tracker = createEmotionInsertionTracker(cache);

    cache.insert('.alpha', serialized('alpha', '.alpha{color:red}'), cache.sheet, true);

    expect(tracker.flush()).toEqual({
      names: ['alpha'],
      css: '.alpha{color:red}',
    });
    expect(tracker.flush()).toBeNull();
  });

  it('does not record an already inserted style again', () => {
    const cache = createFakeCache();
    const tracker = createEmotionInsertionTracker(cache);
    const rule = serialized('alpha', '.alpha{color:red}');

    cache.insert('.alpha', rule, cache.sheet, true);
    cache.insert('.alpha', rule, cache.sheet, true);

    expect(tracker.flush()?.names).toEqual(['alpha']);
  });
});
