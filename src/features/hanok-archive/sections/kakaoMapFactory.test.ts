// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import {
  createKakaoMap,
  fitKakaoMapBounds,
  KAKAO_CLUSTER_STYLES,
} from './kakaoMapFactory';

describe('createKakaoMap', () => {
  it('constructs the Kakao map with maps.Map rather than an icon constructor', () => {
    const mapInstance = { relayout: vi.fn() };
    const Map = vi.fn(function Map() {
      return mapInstance;
    });
    const MapIcon = vi.fn();
    const container = document.createElement('div');
    const options = { center: { lat: 36.25, lng: 127.6 }, level: 11 };

    const result = createKakaoMap({ Map, MapIcon }, container, options);

    expect(result).toBe(mapInstance);
    expect(Map).toHaveBeenCalledWith(container, options);
    expect(MapIcon).not.toHaveBeenCalled();
  });

  it('zooms the nationwide bounds in by one level for the initial 64km-scale view', () => {
    const map = {
      getLevel: vi.fn(() => 12),
      setBounds: vi.fn(),
      setLevel: vi.fn(),
    };
    const bounds = { id: 'nationwide' };

    fitKakaoMapBounds(map, bounds, 1);

    expect(map.setBounds).toHaveBeenCalledWith(bounds, 32, 32, 32, 32);
    expect(map.setLevel).toHaveBeenCalledWith(11, { animate: false });
  });

  it('centers cluster counts in both circle sizes', () => {
    KAKAO_CLUSTER_STYLES.forEach((style) => {
      expect(style.display).toBe('flex');
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      expect(style.lineHeight).toBe('normal');
    });
  });
});
