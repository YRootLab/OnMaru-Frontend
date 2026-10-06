'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type RefObject,
  type UIEvent,
} from 'react';
import {
  useMapStore,
  type InfoListSurface,
} from '@/features/map/hooks/useMapStore';

export function useInfoListScrollRestoration(
  surface: InfoListSurface,
  externalRef?: RefObject<HTMLDivElement | null>,
) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = externalRef ?? internalRef;
  const restoreRequest = useMapStore((state) => state.infoListRestoreRequest);
  const lastAppliedRequestIdRef = useRef(0);

  useLayoutEffect(() => {
    if (!restoreRequest || restoreRequest.id === lastAppliedRequestIdRef.current) return;
    if (!ref.current) return;

    ref.current.scrollTop = restoreRequest.scrollTops[surface];
    lastAppliedRequestIdRef.current = restoreRequest.id;
  }, [restoreRequest, surface]);

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    useMapStore.getState().setInfoListScrollTop(surface, event.currentTarget.scrollTop);
  }, [surface]);

  return { ref, onScroll };
}
