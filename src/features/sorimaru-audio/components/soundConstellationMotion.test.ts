import { describe, expect, it } from 'vitest';
import {
  SOUND_CONSTELLATION_API_ROOT_MARGIN,
  getRegionPathMotion,
} from './soundConstellationMotion';

describe('sound constellation motion', () => {
  it('provides a complete initial state for active and inactive paths', () => {
    expect(getRegionPathMotion({ active: true, hovered: false, listHovered: false })).toEqual({
      fill: 'url(#sorimaruRegionGradient)',
      fillOpacity: 0.95,
      filter: 'drop-shadow(0 2px 8px rgba(255,120,48,0.22))',
    });
    expect(getRegionPathMotion({ active: false, hovered: false, listHovered: false }).fillOpacity).toBe(1);
  });

  it('does not activate the regional API before the section enters the viewport', () => {
    expect(SOUND_CONSTELLATION_API_ROOT_MARGIN).toBe('0px');
  });
});
