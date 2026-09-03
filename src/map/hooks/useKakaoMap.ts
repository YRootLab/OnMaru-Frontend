'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { distanceInMeters } from '@/map/utils/geo';
import { useMapStore } from './useMapStore';

/** autoload=false 필수 — kakao.maps.load()로 직접 초기화한다. */
export const KAKAO_SDK_SRC =
  `https://dapi.kakao.com/v2/maps/sdk.js` +
  `?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}` +
  `&libraries=services,clusterer&autoload=false`;

/** 지도를 이만큼 움직이면 자동으로 다시 불러온다. */
const REFETCH_DISTANCE = 400;

/** 지도가 멈춘 뒤 기다리는 시간. 드래그 중 연속 요청을 막는다. */
const IDLE_DEBOUNCE_MS = 320;

/*
  거리 계산은 utils/geo가 갖는다. 이 이름으로 부르던 곳이 여럿이라 여기서도 내보낸다.
*/
export { distanceInMeters };

/**
 * 지도 인스턴스를 만들어 스토어에 넣는다.
 * 반환값은 <Script onLoad>에 그대로 물릴 초기화 함수.
 */
export function useKakaoMap(containerRef: RefObject<HTMLDivElement | null>) {
  const createdRef = useRef(false);
  const disposeRef = useRef<(() => void) | null>(null);

  const initMap = useCallback(() => {
    const container = containerRef.current;
    if (createdRef.current || !container || !window.kakao?.maps) return;
    createdRef.current = true;

    window.kakao.maps.load(() => {
      const { center, level, setMap, setCenter } = useMapStore.getState();
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const onIdle = () => {
        const c = map.getCenter();
        const nextLevel = map.getLevel();
        const next = { lat: c.getLat(), lng: c.getLng() };

        /*
          줌 판정은 스토어를 건드리기 전에 끝낸다.
          예전에는 setCenter로 level을 먼저 덮어쓴 뒤 320ms 후에 그 값과 비교해서
          "줌이 바뀌었나" 조건이 항상 false였다 — 제자리 줌으로는 영영 갱신되지 않았다.
        */
        const prev = useMapStore.getState();
        const zoomChanged = nextLevel !== prev.level;
        const moved = distanceInMeters(next, prev.searchCenter) >= REFETCH_DISTANCE;

        setCenter(next, nextLevel);

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (zoomChanged || moved) useMapStore.getState().clearSearchDirty();
        }, IDLE_DEBOUNCE_MS);
      };

      window.kakao.maps.event.addListener(map, 'idle', onIdle);

      /*
        지도를 떠날 때 리스너와 타이머를 같이 걷는다.
        남겨두면 페이지를 나간 뒤 타이머가 한 번 더 깨어나 없는 지도의 상태를 흔든다.
      */
      disposeRef.current = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        window.kakao?.maps?.event?.removeListener(map, 'idle', onIdle);
      };

      setMap(map);
    });
  }, [containerRef]);

  // 클라이언트 라우팅으로 돌아왔을 땐 스크립트가 이미 있어 onLoad가 오지 않는다.
  useEffect(() => {
    initMap();
    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
      createdRef.current = false;
      useMapStore.getState().setMap(null);
    };
  }, [initMap]);

  return initMap;
}
