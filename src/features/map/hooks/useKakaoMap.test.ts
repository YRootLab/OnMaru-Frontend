import { describe, expect, it } from 'vitest';
import { distanceInMeters } from './useKakaoMap';

describe('distanceInMeters', () => {
  it('같은 좌표는 0', () => {
    expect(distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 35.815, lng: 127.153 })).toBe(0);
  });

  it('재검색 임계(2km) 판정이 갈리는 지점 — 위도 0.01도 ≒ 1.1km', () => {
    const near = distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 35.825, lng: 127.153 });
    const far = distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 35.845, lng: 127.153 });
    expect(near).toBeLessThan(2000);
    expect(far).toBeGreaterThan(2000);
  });

  it('전주–안동 직선거리 약 169km', () => {
    const d = distanceInMeters({ lat: 35.815, lng: 127.153 }, { lat: 36.5388, lng: 128.8046 });
    expect(d).toBeGreaterThan(160_000);
    expect(d).toBeLessThan(175_000);
  });
});
