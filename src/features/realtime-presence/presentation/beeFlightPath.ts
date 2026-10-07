export type BeeSide = 'me' | 'other';

export interface Viewport {
  w: number;
  h: number;
}

export interface BeePosition {
  x: number;     // CSS pixels
  y: number;     // CSS pixels
  angle: number; // radians, clockwise rotation from "up"
  alpha: number; // 0–1 opacity
  scale: number; // 0–1 sprite scale (ease-in on spawn)
}

export const BEE_DISPLAY_H = 96;          // CSS px target height
export const BEE_MAX_CONCURRENT = 3;
export const BEE_FLIGHT_MS = 2_000;

// Lantern position relative to sprite top-left (fraction of cssW / cssH)
// 0.5 = horizontally centered; 0.78 = near bottom (firefly tail area)
export const BEE_LANTERN_X_FRAC = 0.5;
export const BEE_LANTERN_Y_FRAC = 0.78;

const MAX_TILT_RAD = (15 * Math.PI) / 180;

/**
 * Quadratic Bezier position for a bee at normalized time t ∈ [0, 1].
 * 'me'    → starts at (startX × w, bottom), arcs to upper-right.
 * 'other' → starts at (startX × w, bottom), arcs to upper-left.
 * Pure function — no side effects, no imports from React or browser APIs.
 */
export function getBeePosition(
  t: number,
  startX: number, // 0–1 normalized viewport x
  side: BeeSide,
  viewport: Viewport,
): BeePosition {
  const { w, h } = viewport;

  const p0x = startX * w;
  const p0y = h * 0.88;

  const p2x = side === 'me' ? w * 0.82 : w * 0.18;
  const p2y = h * 0.08;

  // Control point bulges outward for a gentle arc
  const p1x = side === 'me' ? w * 0.75 : w * 0.25;
  const p1y = h * 0.50;

  const u = 1 - t;
  const x = u * u * p0x + 2 * u * t * p1x + t * t * p2x;
  const y = u * u * p0y + 2 * u * t * p1y + t * t * p2y;

  // Bezier tangent for tilt direction
  const dx = 2 * u * (p1x - p0x) + 2 * t * (p2x - p1x);
  const dy = 2 * u * (p1y - p0y) + 2 * t * (p2y - p1y);
  const rawAngle = Math.atan2(dx, -dy); // angle from vertical axis
  const damping = Math.max(0, 1 - t * 0.8);
  const angle = Math.max(-MAX_TILT_RAD, Math.min(MAX_TILT_RAD, rawAngle)) * damping;

  // Scale-in: 0 → 1 during first 15% of flight
  const scale = t < 0.15 ? t / 0.15 : 1;

  // Fade-out: 1 → 0 during last 20% of flight
  const alpha = t > 0.8 ? Math.max(0, (1 - t) / 0.2) : 1;

  return { x, y, angle, alpha, scale };
}

/** Returns true when a new bee can be queued given the current active count. */
export function canSpawnBee(activeBeeCount: number): boolean {
  return activeBeeCount < BEE_MAX_CONCURRENT;
}

/**
 * Lantern world position given bee draw state.
 * Properly rotates the sprite-local offset into world space.
 */
export function beeWorldLantern(
  pos: BeePosition,
  cssW: number,
  cssH: number,
): { x: number; y: number } {
  // Sprite-local offset from center, before scale & rotation
  const lx0 = (BEE_LANTERN_X_FRAC - 0.5) * cssW * pos.scale;
  const ly0 = (BEE_LANTERN_Y_FRAC - 0.5) * cssH * pos.scale;
  const cos = Math.cos(pos.angle);
  const sin = Math.sin(pos.angle);
  return {
    x: pos.x + lx0 * cos - ly0 * sin,
    y: pos.y + lx0 * sin + ly0 * cos,
  };
}
