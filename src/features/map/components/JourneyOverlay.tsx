'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useMapStore } from '../hooks/useMapStore';
import { distanceInMeters } from '../utils/geo';

type JourneyPlace = { id: string; name: string; lat: number; lng: number };

// ponytail: O(n²) nearest-neighbor — fine for ≤10 stops
function nearestNeighborOrder(places: JourneyPlace[], origin: { lat: number; lng: number } | null): JourneyPlace[] {
  if (places.length <= 1) return [...places];
  const unvisited = [...places];
  const result: JourneyPlace[] = [];
  let current: { lat: number; lng: number } = origin ?? unvisited[0];
  if (!origin) result.push(unvisited.shift()!), (current = result[0]);
  while (unvisited.length > 0) {
    let minDist = Infinity, minIdx = 0;
    unvisited.forEach((p, i) => {
      const d = distanceInMeters(current, p);
      if (d < minDist) { minDist = d; minIdx = i; }
    });
    result.push(unvisited.splice(minIdx, 1)[0]);
    current = result[result.length - 1];
  }
  return result;
}

function buildNumberEl(n: number): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = [
    'width:28px;height:28px;border-radius:50%;',
    'background:#2F68FF;color:#fff;',
    'font-size:12px;font-weight:700;font-family:inherit;',
    'display:flex;align-items:center;justify-content:center;',
    'border:2.5px solid #fff;',
    'box-shadow:0 3px 10px rgba(47,104,255,0.45);',
    'transform:translate(-50%,-50%);pointer-events:none;',
  ].join('');
  el.textContent = String(n);
  return el;
}

function buildNaviLinks(ordered: JourneyPlace[]): { app: string; web: string } {
  if (ordered.length === 0) return { app: '#', web: '#' };
  const last = ordered[ordered.length - 1];
  const vias = ordered.slice(0, -1);
  const web = `https://map.kakao.com/link/to/${encodeURIComponent(last.name)},${last.lat},${last.lng}`;
  if (vias.length === 0) {
    return { app: `kakaonavi://navigate?name=${encodeURIComponent(last.name)}&x=${last.lng}&y=${last.lat}`, web };
  }
  const viaName = vias.map((p) => encodeURIComponent(p.name)).join(';');
  const viaX = vias.map((p) => p.lng).join(';');
  const viaY = vias.map((p) => p.lat).join(';');
  return {
    app: `kakaonavi://navigate?name=${encodeURIComponent(last.name)}&x=${last.lng}&y=${last.lat}&via_name=${viaName}&via_x=${viaX}&via_y=${viaY}`,
    web,
  };
}

export default function JourneyOverlay() {
  const map = useMapStore((s) => s.map);
  const journeyPlaces = useMapStore((s) => s.journeyPlaces);
  const userLocation = useMapStore((s) => s.userLocation);
  const clearJourney = useMapStore((s) => s.clearJourney);

  const overlaysRef = useRef<any[]>([]);

  const ordered = useMemo(
    () => nearestNeighborOrder(journeyPlaces, userLocation),
    [journeyPlaces, userLocation],
  );

  useEffect(() => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    if (!map || !window.kakao?.maps || ordered.length === 0) return;
    ordered.forEach((place, i) => {
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(place.lat, place.lng),
        content: buildNumberEl(i + 1),
        zIndex: 200,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [map, ordered]);

  useEffect(() => () => { overlaysRef.current.forEach((o) => o.setMap(null)); }, []);

  if (ordered.length === 0) return null;

  const totalMeters = ordered.reduce((acc, p, i) => {
    if (i === 0) return userLocation ? acc + distanceInMeters(userLocation, p) : acc;
    return acc + distanceInMeters(ordered[i - 1], p);
  }, 0);
  const totalKm = (totalMeters / 1000).toFixed(1);
  const { app, web } = buildNaviLinks(ordered);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === 'undefined') return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      e.preventDefault();
      const t0 = Date.now();
      window.location.href = app;
      setTimeout(() => { if (Date.now() - t0 < 1500) window.open(web, '_blank'); }, 1000);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 150px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(47,104,255,0.18)',
        borderRadius: 18,
        padding: '10px 14px',
        boxShadow: '0 6px 28px rgba(25,31,40,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#4e5968', marginBottom: 2 }}>
          {ordered.length}곳 코스 · 총 {totalKm}km
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#191f28',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
          }}
        >
          {ordered.map((p) => p.name).join(' → ')}
        </div>
      </div>
      <a
        href={web}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleNavClick}
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          padding: '6px 13px',
          background: '#2F68FF',
          color: '#fff',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        길찾기
      </a>
      <button
        type="button"
        onClick={clearJourney}
        aria-label="코스 초기화"
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          border: 0,
          borderRadius: '50%',
          background: 'rgba(78,89,104,0.1)',
          color: '#4e5968',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
