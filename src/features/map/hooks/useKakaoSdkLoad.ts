'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KakaoMap } from '@/features/map/types';
import { MapLoadError } from '@/features/map/application/mapLoadError';
import { MAP_LOAD_TIMEOUT_MS } from '@/features/map/infrastructure/fetchMapPlaces';

interface UseKakaoSdkLoadOptions {
  map: KakaoMap | null;
  initMap: () => void;
  resetMapInitialization: () => void;
}

export function useKakaoSdkLoad({
  map,
  initMap,
  resetMapInitialization,
}: UseKakaoSdkLoadOptions) {
  const [sdkAttempt, setSdkAttempt] = useState(0);
  const [mapLoadError, setMapLoadError] = useState<MapLoadError | null>(null);
  const invalidAttemptsRef = useRef(new Set<number>());

  useEffect(() => {
    if (map || mapLoadError) return;
    const attempt = sdkAttempt;
    const timeoutId = window.setTimeout(() => {
      invalidAttemptsRef.current.add(attempt);
      resetMapInitialization();
      setMapLoadError(
        new MapLoadError('timeout', 408, 'Kakao Maps SDK initialization timed out'),
      );
    }, MAP_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [map, mapLoadError, resetMapInitialization, sdkAttempt]);

  const handleSdkLoad = useCallback(() => {
    const attempt = sdkAttempt;
    if (invalidAttemptsRef.current.has(attempt)) return;
    setMapLoadError(null);
    initMap();
  }, [initMap, sdkAttempt]);

  const handleSdkError = useCallback(() => {
    invalidAttemptsRef.current.add(sdkAttempt);
    resetMapInitialization();
    setMapLoadError(new MapLoadError('network', null, 'Kakao Maps SDK failed to load'));
  }, [resetMapInitialization, sdkAttempt]);

  const retryMapLoad = useCallback(() => {
    invalidAttemptsRef.current.add(sdkAttempt);
    resetMapInitialization();
    setMapLoadError(null);
    setSdkAttempt((attempt) => attempt + 1);
  }, [resetMapInitialization, sdkAttempt]);

  return {
    sdkAttempt,
    mapLoadError,
    handleSdkLoad,
    handleSdkError,
    retryMapLoad,
  };
}
