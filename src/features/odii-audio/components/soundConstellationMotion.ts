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
    fill: active ? '#f84e76' : hovered ? '#e4e4e2' : '#f8f8f7',
    fillOpacity: active ? 0.92 : 1,
    filter: active
      ? (listHovered
          ? 'drop-shadow(0 5px 16px rgba(248,78,118,0.45))'
          : 'drop-shadow(0 3px 8px rgba(248,78,118,0.22))')
      : 'drop-shadow(0 0px 0px rgba(0,0,0,0))',
  };
}
