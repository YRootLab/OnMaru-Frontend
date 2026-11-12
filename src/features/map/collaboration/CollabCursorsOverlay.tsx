'use client';

import { useEffect, useRef } from 'react';
import { useMapStore } from '../hooks/useMapStore';
import { useCollab } from './MapCollabProvider';
import { escapeHtml } from '../utils/formatters';
import { mapIconSvg } from '../utils/mapIconSvg';
import { palette } from '@/design-system/tokens';

const USER_COLORS = [
  palette.kobalt[500],
  palette.danpung[500],
  palette.juhong[500],
  palette.jaha[500],
  palette.cheongrok[600],
  palette.jangmi[500],
] as const;

function colorForUser(memberId: string) {
  let hash = 0;
  for (const ch of memberId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return USER_COLORS[hash % USER_COLORS.length];
}

function buildCursorEl(displayName: string, memberId: string): HTMLElement {
  const color = colorForUser(memberId);
  const pinIcon = mapIconSvg('mapPin', 12);
  const el = document.createElement('div');
  el.style.cssText = 'pointer-events: none; user-select: none; position: relative;';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:4px;background:${color};color:white;font-size:11px;font-weight:600;padding:3px 8px 3px 5px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);transform:translate(8px,-50%);">
      ${pinIcon}${escapeHtml(displayName)}
    </div>
  `;
  return el;
}

export function CollabCursorsOverlay() {
  const map = useMapStore((s) => s.map);
  const ctx = useCollab();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<Map<string, any>>(new Map());

  // 내 마우스 → sendCursor
  useEffect(() => {
    if (!map || !ctx) return;
    const container = document.querySelector<HTMLElement>('[role="application"][aria-label="한옥 위치 지도"]');
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      try {
        const proj = map.getProjection();
        const coords = proj.coordsFromContainerPoint(
          new window.kakao.maps.Point(e.clientX - rect.left, e.clientY - rect.top),
        );
        ctx.sendCursor(coords.getLat(), coords.getLng());
      } catch { /* map not ready */ }
    };
    const handleMouseLeave = () => ctx.sendCursor(null, null);

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [map, ctx]);

  // 다른 멤버 커서 → CustomOverlay
  useEffect(() => {
    if (!map || !ctx) return;
    const myId = ctx.myMemberId;
    const cursors = ctx.cursors.filter((c) => c.memberId !== myId);
    const activeIds = new Set<string>();

    cursors.forEach(({ memberId, displayName, lat, lng }) => {
      if (lat === null || lng === null) {
        const existing = overlaysRef.current.get(memberId);
        if (existing) { existing.setMap(null); overlaysRef.current.delete(memberId); }
        return;
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      activeIds.add(memberId);

      const existing = overlaysRef.current.get(memberId);
      if (existing) {
        existing.setPosition(new window.kakao.maps.LatLng(lat, lng));
      } else {
        try {
          const el = buildCursorEl(displayName.slice(0, 20), memberId);
          const overlay = new window.kakao.maps.CustomOverlay({
            position: new window.kakao.maps.LatLng(lat, lng),
            content: el,
            yAnchor: 0.5,
            zIndex: 60,
          });
          overlay.setMap(map);
          overlaysRef.current.set(memberId, overlay);
        } catch { /* skip */ }
      }
    });

    overlaysRef.current.forEach((overlay, key) => {
      if (!activeIds.has(key)) { overlay.setMap(null); overlaysRef.current.delete(key); }
    });
  }, [map, ctx, ctx?.cursors]);

  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current.clear();
    };
  }, []);

  return null;
}
