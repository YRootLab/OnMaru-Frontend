'use client';

import { useEffect, useRef } from 'react';
import { isOnmaruApiError } from '@/lib/api/errors';
import { useMapStore } from './useMapStore';
import { listInfoPlaces, loadMapViewport } from '@/features/map/services/infoMap.service';
import type { KakaoMap, ViewportRenderMode } from '@/features/map/types';

const VIEWPORT_DEBOUNCE_MS = 700;
const BBOX_EXPAND_RATIO = 0.25;
const BBOX_EDGE_THRESHOLD = 0.20;

// Kakao level → render bucket
function renderBucket(level: number): ViewportRenderMode {
  if (level <= 5) return 'PLACE';
  if (level <= 7) return 'CLUSTER';
  if (level <= 10) return 'DISTRICT';
  return 'REGION';
}

function getBboxFromMap(map: KakaoMap): string {
  const bounds = map.getBounds?.();
  if (!bounds) return '';
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const minLng = sw.getLng();
  const minLat = sw.getLat();
  const maxLng = ne.getLng();
  const maxLat = ne.getLat();

  // Expand by 25% each direction for cache headroom
  const dLat = (maxLat - minLat) * BBOX_EXPAND_RATIO;
  const dLng = (maxLng - minLng) * BBOX_EXPAND_RATIO;
  const expandedMinLat = Math.max(-90, minLat - dLat);
  const expandedMaxLat = Math.min(90, maxLat + dLat);
  const expandedMinLng = Math.max(120, minLng - dLng);
  const expandedMaxLng = Math.min(132, maxLng + dLng);

  return `${expandedMinLng.toFixed(5)},${expandedMinLat.toFixed(5)},${expandedMaxLng.toFixed(5)},${expandedMaxLat.toFixed(5)}`;
}

// Returns true when the current viewport is still well inside the servedBbox
function isInsideServedBbox(map: KakaoMap, servedBbox: string): boolean {
  const bounds = map.getBounds?.();
  if (!bounds || !servedBbox) return false;

  const [minLng, minLat, maxLng, maxLat] = servedBbox.split(',').map(Number);
  if ([minLng, minLat, maxLng, maxLat].some(isNaN)) return false;

  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  const withinLat =
    sw.getLat() >= minLat + latRange * BBOX_EDGE_THRESHOLD &&
    ne.getLat() <= maxLat - latRange * BBOX_EDGE_THRESHOLD;
  const withinLng =
    sw.getLng() >= minLng + lngRange * BBOX_EDGE_THRESHOLD &&
    ne.getLng() <= maxLng - lngRange * BBOX_EDGE_THRESHOLD;

  return withinLat && withinLng;
}

export function useInfoMapData(enabled = true) {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const infoCategory = useMapStore((s) => s.infoCategory);
  const infoRegionCode = useMapStore((s) => s.infoRegionCode);
  const level = useMapStore((s) => s.level);
  const center = useMapStore((s) => s.center);
  const reloadNonce = useMapStore((s) => s.reloadNonce);

  // Track last issued viewport request key to dedupe cluster click + idle
  const lastViewportKeyRef = useRef<string>('');
  const lastViewportScopeRef = useRef<string>('');
  const snapshotRecoveryScopeRef = useRef<string>('');
  const lastReloadNonceRef = useRef(reloadNonce);
  const viewportControllerRef = useRef<AbortController | null>(null);
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Places list ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || mode !== 'info') return;

    const ctrl = new AbortController();
    const store = useMapStore.getState();
    store.setIsListLoading(true);
    store.setListError(null);

    listInfoPlaces({
      category: infoCategory,
      regionCode: infoRegionCode,
      signal: ctrl.signal,
    })
      .then((page) => {
        if (ctrl.signal.aborted) return;
        snapshotRecoveryScopeRef.current = '';
        const regionName = page.items[0]?.region?.name;
        if (infoRegionCode && regionName && !useMapStore.getState().infoRegionName) {
          store.setInfoRegionCode(infoRegionCode, regionName);
        }
        store.setListItems(page.items, page.totalCount, page.nextCursor, page.snapshot.id);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        if (isOnmaruApiError(err) && err.code === 'SNAPSHOT_EXPIRED') {
          const recoveryScope = `${infoCategory}__${infoRegionCode ?? ''}`;
          if (snapshotRecoveryScopeRef.current === recoveryScope) {
            store.setListError('목록 기준이 만료됐어요. 다시 시도해 주세요');
            return;
          }
          snapshotRecoveryScopeRef.current = recoveryScope;
          store.setListItems([], 0, null, null);
          store.reload();
          return;
        }
        if (isOnmaruApiError(err) && err.code === 'INVALID_REQUEST') {
          store.setListError('목록 요청 조건을 확인해 주세요');
          return;
        }
        if (isOnmaruApiError(err) && err.status === 503) {
          store.setListError('목록 서비스 연결이 원활하지 않아요. 다시 시도해 주세요');
          return;
        }
        store.setListError('장소 목록을 불러오지 못했어요');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) {
          store.setIsListLoading(false);
        }
      });

    return () => ctrl.abort();
  }, [enabled, mode, infoCategory, infoRegionCode, reloadNonce]);

  // ── Viewport ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || mode !== 'info' || !map) return;

    // reloadNonce forces a fresh fetch even if bbox/bucket didn't change
    if (lastReloadNonceRef.current !== reloadNonce) {
      lastReloadNonceRef.current = reloadNonce;
      lastViewportKeyRef.current = '';
      lastViewportScopeRef.current = '';
    }

    const store = useMapStore.getState();
    const bucket = renderBucket(level);
    const currentServedBbox = store.servedBbox;
    const currentSnapshotId = store.viewportSnapshotId;

    const cacheKey = `${currentSnapshotId}__${infoCategory}__${infoRegionCode ?? ''}__${bucket}`;
    const isSameBucket = cacheKey === lastViewportScopeRef.current;

    // Skip if viewport is still inside servedBbox with same bucket
    if (isSameBucket && currentServedBbox && isInsideServedBbox(map, currentServedBbox)) {
      return;
    }

    // Clear previous pending request
    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    viewportControllerRef.current?.abort();

    viewportTimerRef.current = setTimeout(() => {
      const bbox = getBboxFromMap(map);
      if (!bbox) return;

      const requestKey = `${bbox}__${infoCategory}__${infoRegionCode ?? ''}__${bucket}`;
      if (requestKey === lastViewportKeyRef.current) return;
      lastViewportKeyRef.current = requestKey;

      const ctrl = new AbortController();
      viewportControllerRef.current = ctrl;

      store.setIsViewportLoading(true);
      store.setViewportError(null);

      loadMapViewport({
        bbox,
        zoomLevel: level,
        category: infoCategory.toUpperCase(),
        ...(infoRegionCode ? { regionCode: infoRegionCode } : {}),
        signal: ctrl.signal,
      })
        .then((res) => {
          if (ctrl.signal.aborted) return;
          store.setViewportResponse(res);
          lastViewportScopeRef.current = `${res.snapshotId}__${infoCategory}__${infoRegionCode ?? ''}__${bucket}`;
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
          lastViewportKeyRef.current = '';
          lastViewportScopeRef.current = '';
          if (isOnmaruApiError(err) && err.code === 'SNAPSHOT_EXPIRED') {
            const recoveryScope = `${infoCategory}__${infoRegionCode ?? ''}`;
            if (snapshotRecoveryScopeRef.current === recoveryScope) {
              store.setViewportError('지도 기준이 만료됐어요. 다시 시도해 주세요');
              return;
            }
            snapshotRecoveryScopeRef.current = recoveryScope;
            store.setListItems([], 0, null, null);
            store.reload();
            return;
          }
          if (isOnmaruApiError(err) && err.code === 'INVALID_REQUEST') {
            store.setViewportError('지도 요청 조건을 확인해 주세요');
            return;
          }
          if (isOnmaruApiError(err) && err.status === 503) {
            store.setViewportError('지도 서비스 연결이 원활하지 않아요. 다시 시도해 주세요');
            return;
          }
          store.setViewportError('지도 데이터를 불러오지 못했어요');
        })
        .finally(() => {
          if (!ctrl.signal.aborted) {
            store.setIsViewportLoading(false);
          }
        });
    }, VIEWPORT_DEBOUNCE_MS);

    return () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      viewportControllerRef.current?.abort();
    };
  }, [enabled, map, mode, infoCategory, infoRegionCode, level, center.lat, center.lng, reloadNonce]);
}
