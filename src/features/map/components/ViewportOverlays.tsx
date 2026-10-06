'use client';

/**
 * BE viewport API 응답(CLUSTER / DISTRICT / REGION)을 Kakao CustomOverlay로 렌더링.
 * PLACE 타입은 PlaceMarkers가 담당.
 */

import { useEffect, useRef } from 'react';
import { useMapStore } from '../hooks/useMapStore';
import type { ViewportItem } from '../types';
import { useDelayedLoadingVisibility } from '../presentation/useDelayedLoadingVisibility';
import {
  fadeInEl,
  retireOverlays,
  cancelActiveAnimations,
  type ZoomDir,
} from '../presentation/overlayTransitionCoordinator';

const MAX_OVERLAYS = 60;

function countBadgeLabel(count: number): string {
  if (count >= 1000) return '999+';
  return String(count);
}

function buildAggregateEl(item: ViewportItem, onZoom: () => void): HTMLElement {
  const count = item.count ?? (item.type === 'PLACE' ? 1 : 0);
  const prominence = Math.min(1, Math.log2(Math.max(1, count)) / Math.log2(100));
  const verticalPadding = Math.round(5 + prominence * 2);
  const horizontalPadding = Math.round(10 + prominence * 3);
  const badgeSize = Math.round(18 + prominence * 8);
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'om-region-overlay';
  el.style.cssText = `
    padding:${verticalPadding}px ${horizontalPadding}px;border-radius:9999px;
    background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);
    border:1.5px solid rgba(47,104,255,0.25);
    box-shadow:0 4px 14px rgba(25,31,40,0.14);
    cursor:pointer;transform:translate(-50%,-50%);
    display:flex;align-items:center;gap:6px;
    font-size:12px;font-weight:700;color:#191F28;
    transition:box-shadow .15s ease;
    white-space:nowrap;
  `;
  el.style.setProperty('--aggregate-badge-size', `${badgeSize}px`);
  const nameSpan = document.createElement('span');
  nameSpan.style.cssText = 'max-width:96px;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:#222;';
  nameSpan.textContent = item.name;
  nameSpan.title = item.name;

  const countSpan = document.createElement('span');
  countSpan.style.cssText =
    'min-width:var(--aggregate-badge-size);height:var(--aggregate-badge-size);padding:0 5px;border-radius:9999px;background:#2F68FF;color:#fff;font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;justify-content:center;';
  countSpan.textContent = countBadgeLabel(count);

  el.appendChild(nameSpan);
  el.appendChild(countSpan);
  el.setAttribute('aria-label', `${item.name} ${count}곳. 클릭하면 해당 지역으로 이동`);

  el.addEventListener('mouseenter', () => {
    el.style.boxShadow = '0 6px 20px rgba(25,31,40,0.22)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.boxShadow = '0 4px 14px rgba(25,31,40,0.14)';
  });
  el.onclick = onZoom;

  return el;
}

type OverlayRef = { overlay: any; el: HTMLElement; map: any; signature: string };

export default function ViewportOverlays() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const viewportItems = useMapStore((s) => s.viewportItems);
  const viewportRenderMode = useMapStore((s) => s.viewportRenderMode);
  const infoCategory = useMapStore((s) => s.infoCategory);
  const committedLevel = useMapStore((s) => s.committedViewport.level);
  const isViewportLoading = useMapStore((s) => s.isViewportLoading);
  const viewportError = useMapStore((s) => s.viewportError);
  const retryInfoViewport = useMapStore((s) => s.retryInfoViewport);
  const showLoadingNotice = useDelayedLoadingVisibility(isViewportLoading, 2_000);

  const overlaysRef = useRef<Map<string, OverlayRef>>(new Map());
  const prevRenderModeRef = useRef<string | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const activeAnimsRef = useRef<Animation[]>([]);

  useEffect(() => {
    // Phase 3: detect mode boundary and zoom direction
    const prevRenderMode = prevRenderModeRef.current;
    const modeChanged = prevRenderMode !== null && prevRenderMode !== viewportRenderMode;
    const prevLevel = prevLevelRef.current;
    const zoomDir: ZoomDir =
      prevLevel === null ? 'none'
      : committedLevel < prevLevel ? 'in'
      : committedLevel > prevLevel ? 'out'
      : 'none';
    prevRenderModeRef.current = viewportRenderMode ?? prevRenderMode;
    prevLevelRef.current = committedLevel;

    if (!map || mode !== 'info' || !window.kakao?.maps || !viewportRenderMode || viewportRenderMode === 'PLACE' || viewportItems.length === 0) {
      if (modeChanged && overlaysRef.current.size > 0) {
        retireOverlays(Array.from(overlaysRef.current.values()));
      } else {
        overlaysRef.current.forEach((record) => record.overlay.setMap(null));
      }
      overlaysRef.current.clear();
      return;
    }

    if (modeChanged) {
      cancelActiveAnimations(activeAnimsRef.current);
      if (overlaysRef.current.size > 0) {
        const outAnims = retireOverlays(Array.from(overlaysRef.current.values()));
        activeAnimsRef.current.push(...outAnims);
        overlaysRef.current.clear();
      }
    }

    const displayed = viewportItems
      .filter((item) => viewportRenderMode === 'CLUSTER' || item.type !== 'PLACE')
      .slice(0, MAX_OVERLAYS);

    const seenKeys = new Map<string, number>();
    const keyed = displayed.map((item) => {
      const cellSize = viewportRenderMode === 'CLUSTER' ? 0.1 : 0.5;
      const spatialKey = `${Math.floor(item.center.lng / cellSize)}:${Math.floor(item.center.lat / cellSize)}`;
      const base = `${viewportRenderMode}:${item.type}:${item.placeId ?? item.clusterId ?? item.regionCode ?? `${item.name}:${spatialKey}`}`;
      const occurrence = seenKeys.get(base) ?? 0;
      seenKeys.set(base, occurrence + 1);
      return { item, key: `${base}:${occurrence}` };
    });
    const targetKeys = new Set(keyed.map(({ key }) => key));
    overlaysRef.current.forEach((record, key) => {
      if (record.map !== map || !targetKeys.has(key)) {
        record.overlay.setMap(null);
        overlaysRef.current.delete(key);
      }
    });

    keyed.forEach(({ item, key }) => {
      const { lat, lng } = item.center;
      const signature = `${viewportRenderMode}|${item.name}|${item.count}|${lat}|${lng}|${infoCategory}|${item.targetZoomLevel}|${JSON.stringify(item.bounds)}`;
      const existing = overlaysRef.current.get(key);
      if (existing?.signature === signature) return;

      const zoom = () => {
        if (!window.kakao?.maps) return;
        if (item.bounds && item.targetZoomLevel != null) {
          const bounds = new window.kakao.maps.LatLngBounds(
            new window.kakao.maps.LatLng(item.bounds.south, item.bounds.west),
            new window.kakao.maps.LatLng(item.bounds.north, item.bounds.east),
          );
          map.setBounds(bounds);
        } else {
          const target = item.targetZoomLevel ?? Math.max(1, map.getLevel() - 2);
          map.setLevel(target, { animate: true });
          map.panTo(new window.kakao.maps.LatLng(lat, lng));
        }

        if (item.regionCode) {
          const store = useMapStore.getState();
          store.captureInfoHomeSnapshot();
          store.setInfoRegionCode(item.regionCode, item.name ?? null);
        }
      };

      if (existing) {
        const updated = buildAggregateEl(item, zoom);
        existing.el.replaceChildren(...Array.from(updated.childNodes));
        existing.el.style.cssText = updated.style.cssText;
        existing.el.setAttribute('aria-label', updated.getAttribute('aria-label') ?? '');
        existing.el.onclick = zoom;
        existing.signature = signature;
        return;
      }
      const el = buildAggregateEl(item, zoom);
      if (modeChanged) {
        const inAnim = fadeInEl(el, zoomDir);
        if (inAnim) activeAnimsRef.current.push(inAnim);
      }

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lat, lng),
        content: el,
        yAnchor: 0.5,
        zIndex: 10,
      });
      overlay.setMap(map);
      overlaysRef.current.set(key, { overlay, el, map, signature });
    });
  }, [map, mode, viewportItems, viewportRenderMode, infoCategory, committedLevel]);

  useEffect(() => () => {
    cancelActiveAnimations(activeAnimsRef.current);
    overlaysRef.current.forEach((record) => record.overlay.setMap(null));
    overlaysRef.current.clear();
  }, []);

  if (!viewportError && mode === 'info' && showLoadingNotice) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          top: 86,
          left: '50%',
          zIndex: 30,
          padding: '7px 12px',
          borderRadius: 999,
          background: 'rgba(248, 248, 247, 0.94)',
          color: '#4e5968',
          fontSize: 12,
          boxShadow: '0 4px 14px rgba(25, 31, 40, 0.12)',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      >
        지도 장소를 업데이트하고 있어요
      </div>
    );
  }

  if (!viewportError) return null;

  return (
    <div
      role="status"
      style={{
        position: 'absolute',
        top: 86,
        left: '50%',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 'calc(100% - 32px)',
        padding: '9px 12px',
        border: '1px solid #d9d9d7',
        borderRadius: 12,
        background: 'rgba(248, 248, 247, 0.96)',
        color: '#4e5968',
        fontSize: 12,
        boxShadow: '0 4px 14px rgba(25, 31, 40, 0.12)',
        transform: 'translateX(-50%)',
      }}
    >
      <span>{viewportError}</span>
      <button
        type="button"
        aria-label="지도 다시 시도"
        onClick={retryInfoViewport}
        style={{
          flexShrink: 0,
          padding: '4px 9px',
          border: 0,
          borderRadius: 999,
          background: '#e5e5e3',
          color: '#333d4b',
          font: 'inherit',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
