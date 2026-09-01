'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useMapStore } from './useMapStore';
import type { LatLng } from '../types';

/** autoload=false 필수 — kakao.maps.load()로 직접 초기화한다. */
export const KAKAO_SDK_SRC =
  `//dapi.kakao.com/v2/maps/sdk.js` +
  `?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}` +
  `&libraries=services,clusterer&autoload=false`;

/** 재검색 버튼이 뜨는 거리(m). */
const SEARCH_DIRTY_DISTANCE = 2000;

/** 두 좌표 사이 거리(m). geometry 라이브러리를 더 싣지 않으려고 직접 계산한다. */
export function distanceInMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 지도 인스턴스를 만들어 스토어에 넣는다.
 * 반환값은 <Script onLoad>에 그대로 물릴 초기화 함수.
 */
export function useKakaoMap(containerRef: RefObject<HTMLDivElement | null>) {
  const createdRef = useRef(false);

  const initMap = useCallback(() => {
    const container = containerRef.current;
    if (createdRef.current || !container || !window.kakao?.maps) return;
    createdRef.current = true;

    window.kakao.maps.load(() => {
      const { center, level, setMap, setCenter, markSearchDirty } = useMapStore.getState();
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });

      // idle에서만 중심을 되받는다. 드래그 중 매 프레임 스토어를 때리지 않기 위해서.
      window.kakao.maps.event.addListener(map, 'idle', () => {
        const c = map.getCenter();
        const next = { lat: c.getLat(), lng: c.getLng() };
        setCenter(next, map.getLevel());
        if (distanceInMeters(next, useMapStore.getState().searchCenter) >= SEARCH_DIRTY_DISTANCE) {
          markSearchDirty();
        }
      });

      setMap(map);
    });
  }, [containerRef]);

  // 클라이언트 라우팅으로 돌아왔을 땐 스크립트가 이미 있어 onLoad가 오지 않는다.
  useEffect(() => {
    initMap();
    return () => {
      createdRef.current = false;
      useMapStore.getState().setMap(null);
    };
  }, [initMap]);

  return initMap;
}
