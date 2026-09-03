import { describe, expect, it } from 'vitest';
import { getVisibleSceneIndices } from './sceneRailModel';

describe('scene rail model', () => {
  it('wraps previous and next indices around the active card', () => {
    expect(getVisibleSceneIndices(5, 0)).toEqual({ previous: 4, active: 0, next: 1 });
    expect(getVisibleSceneIndices(5, 4)).toEqual({ previous: 3, active: 4, next: 0 });
  });
});
