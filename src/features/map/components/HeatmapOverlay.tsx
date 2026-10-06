'use client';

import { useEffect, useRef } from 'react';
import { useMapStore } from '../hooks/useMapStore';
import type { CongestionLevel } from '../types';

// 온기 레벨 → 색상 (hwanggeum/juhong 계열)
const CONGESTION_COLOR: Record<CongestionLevel, string> = {
  surge:    '#e85a18',
  busy:     '#f59e0b',
  moderate: '#fbbf24',
  relaxed:  '#4eb2b2',
};
const CONGESTION_OPACITY: Record<CongestionLevel, number> = {
  surge:    0.28,
  busy:     0.20,
  moderate: 0.14,
  relaxed:  0.09,
};

// 줌 레벨 → 원 반지름(m)
function circleRadius(level: number): number {
  if (level >= 10) return 55_000;
  if (level >= 8)  return 22_000;
  if (level >= 6)  return 8_000;
  return 3_000;
}

export default function HeatmapOverlay() {
  const map   = useMapStore((s) => s.map);
  const mode  = useMapStore((s) => s.mode);
  const level = useMapStore((s) => s.level);
  const heatSpots = useMapStore((s) => s.heatSpots);

  const circlesRef = useRef<any[]>([]);

  const clearCircles = () => {
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];
  };

  useEffect(() => {
    clearCircles();
    if (!map || mode !== 'warmth' || !window.kakao?.maps || heatSpots.length === 0) return;

    const radius = circleRadius(level);
    heatSpots.forEach((spot) => {
      const lvl = spot.congestionLevel;
      const circle = new window.kakao.maps.Circle({
        center:        new window.kakao.maps.LatLng(spot.lat, spot.lng),
        radius,
        strokeWeight:  0,
        fillColor:     CONGESTION_COLOR[lvl],
        fillOpacity:   CONGESTION_OPACITY[lvl] * Math.max(0.4, spot.intensity),
        zIndex:        1,
      });
      circle.setMap(map);
      circlesRef.current.push(circle);
    });
  }, [map, mode, level, heatSpots]);

  useEffect(() => () => clearCircles(), []);

  return null;
}
