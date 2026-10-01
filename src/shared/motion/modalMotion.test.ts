import { describe, it, expect } from 'vitest';
import {
  LIVELY_MODAL_CUBIC_BEZIER,
  LIVELY_MODAL_EASE,
  livelyModalSpring,
  livelyBottomSheetSpring,
  modalExitTransition,
  modalOverlayTransition,
  livelyModalEnter,
  livelyBottomSheetEnter,
} from './modalMotion';

describe('modalMotion', () => {
  it('exports valid cubic bezier string and ease array', () => {
    expect(LIVELY_MODAL_CUBIC_BEZIER).toBe('cubic-bezier(0.19, 1.15, 0.22, 1)');
    expect(LIVELY_MODAL_EASE).toEqual([0.19, 1.15, 0.22, 1]);
    expect(LIVELY_MODAL_EASE[1]).toBeGreaterThan(1.0); // Verifies subtle overshoot bounce
  });

  it('configures spring physics with lively bounce parameters', () => {
    expect(livelyModalSpring.type).toBe('spring');
    expect(livelyModalSpring.stiffness).toBeGreaterThan(300);
    expect(livelyModalSpring.damping).toBeLessThan(30);

    expect(livelyBottomSheetSpring.type).toBe('spring');
    expect(livelyBottomSheetSpring.stiffness).toBeGreaterThan(300);
    expect(livelyBottomSheetSpring.damping).toBeLessThan(30);
  });

  it('provides clean exit and overlay transitions', () => {
    expect(modalExitTransition.duration).toBeGreaterThan(0);
    expect(modalOverlayTransition.duration).toBeGreaterThan(0);
  });

  it('creates valid emotion keyframes for CSS animations', () => {
    expect(livelyModalEnter).toBeDefined();
    expect(livelyBottomSheetEnter).toBeDefined();
  });
});
