import type { TargetAndTransition } from 'framer-motion';

export const SOUND_CONSTELLATION_API_ROOT_MARGIN = '0px';

interface RegionPathMotionInput {
  active: boolean;
  hovered: boolean;
  listHovered: boolean;
}

export function getRegionPathMotion({
  active,
  hovered,
  listHovered,
}: RegionPathMotionInput): TargetAndTransition {
  return {
    fill: active ? 'url(#sorimaruRegionGradient)' : hovered ? '#e4e4e2' : '#f8f8f7',
    fillOpacity: active ? 0.95 : 1,
    filter: active
      ? (listHovered
          ? 'drop-shadow(0 4px 14px rgba(255,120,48,0.38))'
          : 'drop-shadow(0 2px 8px rgba(255,120,48,0.22))')
      : 'drop-shadow(0 0px 0px rgba(0,0,0,0))',
  };
}
