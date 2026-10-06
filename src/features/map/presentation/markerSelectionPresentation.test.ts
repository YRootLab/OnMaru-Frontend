import { describe, expect, it } from 'vitest';
import { getSelectedMarkerVisualStyle } from './markerSelectionPresentation';

describe('getSelectedMarkerVisualStyle', () => {
  it('uses a light neutral selection without movement in light mode', () => {
    expect(getSelectedMarkerVisualStyle('light')).toEqual({
      background: '#f5f5f4',
      foreground: '#191f28',
      border: '#ff5a1f',
      transform: 'translateY(-2px)',
      animation: 'none',
    });
  });

  it('uses a softer charcoal selection without movement in dark mode', () => {
    expect(getSelectedMarkerVisualStyle('dark')).toEqual({
      background: '#3a4352',
      foreground: '#ffffff',
      border: '#ff8a5c',
      transform: 'translateY(-2px)',
      animation: 'none',
    });
  });
});
