import type { LatLng } from '@/features/map/types';
import { distanceInMeters } from '@/features/map/utils/geo';

export const VIEWPORT_SETTLE_MS = 900;

const MIN_ZOOM_DELTA = 2;
const MIN_MOVE_METERS = 1_200;
const VIEWPORT_MOVE_RATIO = 0.2;

export type ViewportSnapshot = {
  center: LatLng;
  level: number;
  radius: number;
};

export function shouldCommitViewport(
  current: ViewportSnapshot,
  committed: ViewportSnapshot,
): boolean {
  const zoomChanged = Math.abs(current.level - committed.level) >= MIN_ZOOM_DELTA;
  const movementThreshold = Math.max(MIN_MOVE_METERS, current.radius * VIEWPORT_MOVE_RATIO);
  const moved = distanceInMeters(current.center, committed.center) >= movementThreshold;

  return zoomChanged || moved;
}
