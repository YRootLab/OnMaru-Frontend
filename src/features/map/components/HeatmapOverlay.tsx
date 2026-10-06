'use client';

import { useEffect, useRef } from 'react';
import { useMapStore } from '../hooks/useMapStore';
import type { ViewportItem } from '../types';

// count → fill opacity (밀집도 시각화)
function heatOpacity(count: number): number {
  if (count >= 51) return 0.42;
  if (count >= 21) return 0.28;
  if (count >= 6)  return 0.16;
  return 0.07;
}

function heatStrokeOpacity(count: number): number {
  return Math.min(0.55, heatOpacity(count) + 0.12);
}

function buildRectangle(item: ViewportItem, map: any): any | null {
  if (!item.bounds || !window.kakao?.maps) return null;
  const { west, south, east, north } = item.bounds;
  const count = item.count ?? 0;
  const sw = new window.kakao.maps.LatLng(south, west);
  const ne = new window.kakao.maps.LatLng(north, east);
  const bounds = new window.kakao.maps.LatLngBounds(sw, ne);

  const rect = new window.kakao.maps.Rectangle({
    bounds,
    strokeWeight: 1.5,
    strokeColor: '#2F68FF',
    strokeOpacity: heatStrokeOpacity(count),
    strokeStyle: 'solid',
    fillColor: '#2F68FF',
    fillOpacity: heatOpacity(count),
    zIndex: 1,
  });
  rect.setMap(map);
  return rect;
}

export default function HeatmapOverlay() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const viewportItems = useMapStore((s) => s.viewportItems);
  const viewportRenderMode = useMapStore((s) => s.viewportRenderMode);

  const rectsRef = useRef<any[]>([]);

  const clearRects = () => {
    rectsRef.current.forEach((r) => r.setMap(null));
    rectsRef.current = [];
  };

  useEffect(() => {
    clearRects();

    const active =
      map &&
      mode === 'info' &&
      window.kakao?.maps &&
      (viewportRenderMode === 'DISTRICT' || viewportRenderMode === 'REGION');

    if (!active) return;

    const items = viewportItems.filter((i) => i.bounds && (i.count ?? 0) > 0);
    rectsRef.current = items
      .map((item) => buildRectangle(item, map))
      .filter(Boolean);
  }, [map, mode, viewportItems, viewportRenderMode]);

  useEffect(() => () => clearRects(), []);

  return null;
}
