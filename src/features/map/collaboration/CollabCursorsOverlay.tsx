'use client';

import { useEffect, useRef } from 'react';
import { useMyPresence, useOthers } from './liveblocks.config';
import { useMapStore } from '../hooks/useMapStore';
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

function colorForUser(userId: string) {
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return USER_COLORS[hash % USER_COLORS.length];
}

function buildCursorEl(nickname: string, userId: string): HTMLElement {
  const color = colorForUser(userId);
  const pinIcon = mapIconSvg('mapPin', 12);
  const el = document.createElement('div');
  el.style.cssText = 'pointer-events: none; user-select: none; position: relative;';
  el.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 4px;
      background: ${color};
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px 3px 5px;
      border-radius: 10px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      transform: translate(8px, -50%);
    ">
      ${pinIcon}
      ${escapeHtml(nickname)}
    </div>
  `;
  return el;
}

export function CollabCursorsOverlay() {
  const map = useMapStore((s) => s.map);
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<Map<string, any>>(new Map());

  // Track my mouse position → update presence cursor as lat/lng
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer() as HTMLElement;

    function handleMouseMove(e: MouseEvent) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      try {
        const proj = map.getProjection();
        const coords = proj.coordsFromContainerPoint(new window.kakao.maps.Point(x, y));
        updateMyPresence({ cursor: { lat: coords.getLat(), lng: coords.getLng() } });
      } catch {
        // map not ready
      }
    }

    function handleMouseLeave() {
      updateMyPresence({ cursor: null });
    }

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [map, updateMyPresence]);

  // Sync others' cursors → CustomOverlay instances
  useEffect(() => {
    if (!map) return;

    const activeIds = new Set<string>();

    others.forEach(({ presence, id }) => {
      if (!presence.cursor) {
        // Cursor left the map — remove overlay if present
        const existing = overlaysRef.current.get(String(id));
        if (existing) {
          existing.setMap(null);
          overlaysRef.current.delete(String(id));
        }
        return;
      }

      const { lat, lng } = presence.cursor;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      activeIds.add(String(id));
      const existing = overlaysRef.current.get(String(id));

      // Sanitise presence strings — untrusted from other clients
      const nickname = String(presence.nickname || '익명').slice(0, 30);
      const userId = String(presence.userId || id).slice(0, 64);

      if (existing) {
        // Update position
        existing.setPosition(new window.kakao.maps.LatLng(lat, lng));
      } else {
        // Create new overlay
        try {
          const el = buildCursorEl(nickname, userId);
          const overlay = new window.kakao.maps.CustomOverlay({
            position: new window.kakao.maps.LatLng(lat, lng),
            content: el,
            yAnchor: 0.5,
            zIndex: 60,
          });
          overlay.setMap(map);
          overlaysRef.current.set(String(id), overlay);
        } catch {
          // skip
        }
      }
    });

    // Remove overlays for users who left
    overlaysRef.current.forEach((overlay, key) => {
      if (!activeIds.has(key)) {
        overlay.setMap(null);
        overlaysRef.current.delete(key);
      }
    });
  }, [map, others]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current.clear();
    };
  }, []);

  return null;
}
