import { describe, expect, it } from 'vitest';
import { getPlaceSlipMotion } from './placeSlip';

describe('place slip motion', () => {
  it('uses transform and opacity with bounded stagger and disables motion when requested', () => {
    expect(getPlaceSlipMotion({ reducedMotion: false, index: 2 })).toMatchObject({
      initial: { opacity: 0, y: 10, scaleY: 0.96 },
      animate: { opacity: 1, y: 0, scaleY: 1 },
    });
    expect(getPlaceSlipMotion({ reducedMotion: false, index: 10 }).transition.delay).toBeLessThanOrEqual(0.28);
    expect(getPlaceSlipMotion({ reducedMotion: true, index: 10 })).toEqual({
      initial: { opacity: 1, y: 0, scaleY: 1 },
      animate: { opacity: 1, y: 0, scaleY: 1 },
      transition: { duration: 0 },
    });
  });
});
