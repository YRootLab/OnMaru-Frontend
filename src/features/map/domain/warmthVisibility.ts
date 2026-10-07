import type { HeatSpot } from '../types';

export function heatSpotClusterKey(spot: Pick<HeatSpot, 'regionCode' | 'placeId' | 'id' | 'lat' | 'lng'>): string {
  return spot.regionCode || spot.placeId || spot.id || `${spot.lat}:${spot.lng}`;
}

interface ViewRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface ProjectedWarmthPin {
  x: number;
  y: number;
  lat: number;
  lng: number;
}

export function warmthRevealTarget(
  currentLevel: number,
  visibleArea: ViewRect,
  pins: ProjectedWarmthPin[],
): { level: number } | { center: { lat: number; lng: number } } | null {
  if (pins.length === 0 || pins.some((pin) =>
    pin.x >= visibleArea.left && pin.x <= visibleArea.right &&
    pin.y >= visibleArea.top && pin.y <= visibleArea.bottom
  )) return null;

  if (currentLevel >= 9 && currentLevel < 11) return { level: 11 };

  const centerX = (visibleArea.left + visibleArea.right) / 2;
  const centerY = (visibleArea.top + visibleArea.bottom) / 2;
  const nearest = pins.reduce((closest, pin) =>
    (pin.x - centerX) ** 2 + (pin.y - centerY) ** 2 <
    (closest.x - centerX) ** 2 + (closest.y - centerY) ** 2 ? pin : closest
  );
  return { center: { lat: nearest.lat, lng: nearest.lng } };
}
