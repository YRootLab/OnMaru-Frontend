import { describe, expect, it } from 'vitest';
import {
  VIEWPORT_SETTLE_MS,
  shouldCommitViewport,
  type ViewportSnapshot,
} from './viewportRefreshPolicy';

const committed: ViewportSnapshot = {
  center: { lat: 36.35, lng: 127.75 },
  level: 7,
  radius: 10_000,
};

describe('viewport refresh policy', () => {
  it('settles a map interaction within 200ms', () => {
    expect(VIEWPORT_SETTLE_MS).toBeLessThanOrEqual(200);
  });

  it('commits a one-level zoom so the map can request the new aggregate', () => {
    expect(shouldCommitViewport({ ...committed, level: 8 }, committed)).toBe(true);
  });

  it('commits after a cumulative two-level zoom', () => {
    expect(shouldCommitViewport({ ...committed, level: 9 }, committed)).toBe(true);
  });

  it('uses at least 1.2km as the movement threshold', () => {
    const narrow = { ...committed, radius: 2_000 };
    expect(
      shouldCommitViewport(
        { ...narrow, center: { lat: 36.355, lng: 127.75 } },
        narrow,
      ),
    ).toBe(false);
    expect(
      shouldCommitViewport(
        { ...narrow, center: { lat: 36.365, lng: 127.75 } },
        narrow,
      ),
    ).toBe(true);
  });

  it('uses 20% of a wide viewport radius as the movement threshold', () => {
    const wide = { ...committed, radius: 100_000 };
    expect(
      shouldCommitViewport(
        { ...wide, center: { lat: 36.48, lng: 127.75 } },
        wide,
      ),
    ).toBe(false);
    expect(
      shouldCommitViewport(
        { ...wide, center: { lat: 36.55, lng: 127.75 } },
        wide,
      ),
    ).toBe(true);
  });
});
