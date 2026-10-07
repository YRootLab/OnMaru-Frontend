import { describe, expect, it } from 'vitest';
import {
  BEE_MAX_CONCURRENT,
  canSpawnBee,
  getBeePosition,
  beeWorldLantern,
} from './beeFlightPath';

const VP = { w: 1000, h: 800 };

describe('getBeePosition', () => {
  it('t=0: starts near the bottom', () => {
    const pos = getBeePosition(0, 0.5, 'me', VP);
    expect(pos.y).toBeGreaterThan(VP.h * 0.7);
  });

  it('t=0: scale is 0 (spawn scale-in)', () => {
    const pos = getBeePosition(0, 0.5, 'me', VP);
    expect(pos.scale).toBeCloseTo(0);
  });

  it('t=1: ends near the top', () => {
    const pos = getBeePosition(1, 0.5, 'me', VP);
    expect(pos.y).toBeLessThan(VP.h * 0.3);
  });

  it('t=1: alpha is 0 (fade-out complete)', () => {
    const pos = getBeePosition(1, 0.5, 'me', VP);
    expect(pos.alpha).toBeCloseTo(0, 1);
  });

  it('t=0.15: scale reaches 1', () => {
    const pos = getBeePosition(0.15, 0.5, 'me', VP);
    expect(pos.scale).toBeCloseTo(1, 2);
  });

  it('me arcs to the right', () => {
    const pos = getBeePosition(1, 0.5, 'me', VP);
    expect(pos.x).toBeGreaterThan(VP.w * 0.5);
  });

  it('other arcs to the left', () => {
    const pos = getBeePosition(1, 0.5, 'other', VP);
    expect(pos.x).toBeLessThan(VP.w * 0.5);
  });

  it('tilt stays within ±15°', () => {
    const maxTilt = (15 * Math.PI) / 180 + 1e-6;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(Math.abs(getBeePosition(t, 0.3, 'me', VP).angle)).toBeLessThanOrEqual(maxTilt);
      expect(Math.abs(getBeePosition(t, 0.7, 'other', VP).angle)).toBeLessThanOrEqual(maxTilt);
    }
  });

  it('mid-flight alpha is 1', () => {
    expect(getBeePosition(0.5, 0.5, 'me', VP).alpha).toBe(1);
  });

  it('scale-in: t=0.075 → scale ≈ 0.5', () => {
    const pos = getBeePosition(0.075, 0.5, 'me', VP);
    expect(pos.scale).toBeCloseTo(0.5, 1);
  });

  it('handles startX extremes without NaN', () => {
    const a = getBeePosition(0.5, 0, 'me', VP);
    const b = getBeePosition(0.5, 1, 'other', VP);
    expect(Number.isFinite(a.x)).toBe(true);
    expect(Number.isFinite(b.x)).toBe(true);
  });
});

describe('canSpawnBee', () => {
  it('allows spawn when count is 0', () => {
    expect(canSpawnBee(0)).toBe(true);
  });

  it('allows spawn up to limit-1', () => {
    expect(canSpawnBee(BEE_MAX_CONCURRENT - 1)).toBe(true);
  });

  it('blocks spawn at the limit', () => {
    expect(canSpawnBee(BEE_MAX_CONCURRENT)).toBe(false);
  });

  it('blocks spawn above the limit', () => {
    expect(canSpawnBee(BEE_MAX_CONCURRENT + 5)).toBe(false);
  });
});

describe('beeWorldLantern', () => {
  it('returns finite coordinates', () => {
    const pos = getBeePosition(0.5, 0.5, 'me', VP);
    const lantern = beeWorldLantern(pos, 96, 96);
    expect(Number.isFinite(lantern.x)).toBe(true);
    expect(Number.isFinite(lantern.y)).toBe(true);
  });

  it('zero angle: lantern x equals bee x (horizontally centered)', () => {
    // When angle=0 and BEE_LANTERN_X_FRAC=0.5 (center x), lantern.x === pos.x
    const pos = { x: 400, y: 300, angle: 0, alpha: 1, scale: 1 };
    const lantern = beeWorldLantern(pos, 96, 96);
    expect(lantern.x).toBeCloseTo(400, 5);
  });
});
