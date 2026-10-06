import { describe, expect, it } from 'vitest';
import { resolveViewportRenderMode } from './viewportRenderMode';

describe('resolveViewportRenderMode', () => {
  it.each([
    [5, 'PLACE'],
    [6, 'PLACE'],
    [7, 'CLUSTER'],
    [8, 'DISTRICT'],
    [10, 'DISTRICT'],
    [11, 'REGION'],
  ] as const)('maps Kakao level %i to %s', (level, expected) => {
    expect(resolveViewportRenderMode(level)).toBe(expected);
  });
});
