'use client';

/**
 * BE viewport API 응답(CLUSTER / DISTRICT / REGION)을 Kakao CustomOverlay로 렌더링.
 * PLACE 타입은 PlaceMarkers가 담당.
 */

import { useEffect, useRef } from 'react';
import { useMapStore } from '../hooks/useMapStore';
import type { ViewportItem } from '../types';

const MAX_OVERLAYS = 60;

function countBadgeLabel(count: number): string {
  if (count >= 200) return '200+';
  return String(count);
}

function buildClusterEl(item: ViewportItem, onZoom: () => void): HTMLElement {
  const count = item.count ?? 0;
  const size =
    count >= 200 ? 52 :
    count >= 50  ? 44 :
    count >= 10  ? 38 :
                   32;

  const el = document.createElement('button');
  el.type = 'button';
  el.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    background:rgba(47,104,255,0.88);backdrop-filter:blur(6px);
    color:#fff;font-size:${count>=200?10:12}px;font-weight:700;
    border:2px solid rgba(255,255,255,0.6);
    box-shadow:0 4px 12px rgba(47,104,255,0.35);
    cursor:pointer;transform:translate(-50%,-50%);
    display:flex;align-items:center;justify-content:center;
    transition:transform .15s ease,box-shadow .15s ease;
    white-space:nowrap;
  `;
  el.textContent = countBadgeLabel(count);
  el.setAttribute('aria-label', `${item.name ?? '클러스터'} ${count}곳. 확대해서 보기`);

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'translate(-50%,-50%) scale(1.15)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(-50%,-50%)';
  });
  el.addEventListener('click', onZoom);

  return el;
}

function buildRegionEl(item: ViewportItem, onZoom: () => void): HTMLElement {
  const count = item.count ?? 0;
  const el = document.createElement('button');
  el.type = 'button';
  el.style.cssText = `
    padding:5px 10px;border-radius:9999px;
    background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);
    border:1.5px solid rgba(47,104,255,0.25);
    box-shadow:0 4px 14px rgba(25,31,40,0.14);
    cursor:pointer;transform:translate(-50%,-50%);
    display:flex;align-items:center;gap:6px;
    font-size:12px;font-weight:700;color:#191F28;
    transition:transform .15s ease,box-shadow .15s ease;
    white-space:nowrap;
  `;
  const nameSpan = document.createElement('span');
  nameSpan.style.cssText = 'font-size:11px;color:#222;';
  nameSpan.textContent = item.name;

  const countSpan = document.createElement('span');
  countSpan.style.cssText =
    'min-width:18px;height:18px;padding:0 5px;border-radius:9999px;background:#2F68FF;color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;';
  countSpan.textContent = countBadgeLabel(count);

  el.appendChild(nameSpan);
  el.appendChild(countSpan);
  el.setAttribute('aria-label', `${item.name} ${count}곳. 클릭하면 해당 지역으로 이동`);

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'translate(-50%,-50%) scale(1.08)';
    el.style.boxShadow = '0 6px 20px rgba(25,31,40,0.22)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(-50%,-50%)';
    el.style.boxShadow = '0 4px 14px rgba(25,31,40,0.14)';
  });
  el.addEventListener('click', onZoom);

  return el;
}

type OverlayRef = { overlay: any; el: HTMLElement };

export default function ViewportOverlays() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const viewportItems = useMapStore((s) => s.viewportItems);
  const viewportRenderMode = useMapStore((s) => s.viewportRenderMode);

  const overlaysRef = useRef<OverlayRef[]>([]);

  useEffect(() => {
    overlaysRef.current.forEach((r) => r.overlay.setMap(null));
    overlaysRef.current = [];

    if (!map || mode !== 'info' || !window.kakao?.maps) return;
    if (!viewportRenderMode || viewportRenderMode === 'PLACE') return;
    if (viewportItems.length === 0) return;

    const displayed = viewportItems.slice(0, MAX_OVERLAYS);

    displayed.forEach((item) => {
      const { lat, lng } = item.center;

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
          useMapStore.getState().setInfoRegionCode(item.regionCode);
        }
      };

      const isCluster = viewportRenderMode === 'CLUSTER';
      const el = isCluster ? buildClusterEl(item, zoom) : buildRegionEl(item, zoom);

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lat, lng),
        content: el,
        yAnchor: 0.5,
        zIndex: 10,
      });
      overlay.setMap(map);
      overlaysRef.current.push({ overlay, el });
    });

    return () => {
      overlaysRef.current.forEach((r) => r.overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [map, mode, viewportItems, viewportRenderMode]);

  return null;
}
