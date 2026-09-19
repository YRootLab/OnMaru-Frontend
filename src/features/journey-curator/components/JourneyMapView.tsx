'use client';

/**
 * "지도는 위치, 관계 뷰는 이유" (fe-experience-api-implementation-report.md §2).
 * 여기는 실제 지리 위치만 표현한다 — 추천 동선이나 도보 경로가 아니다.
 *
 * 기존 /map의 KakaoMap.tsx는 전국 지도 페이지 전용 useMapStore(전역 싱글턴)에 강하게
 * 묶여 있어 재사용하면 실제 지도 페이지와 상태가 충돌한다. 여기는 좌표 1~3개만 찍으면
 * 되므로 같은 Kakao SDK만 재사용하고 지도 인스턴스는 이 컴포넌트가 로컬로 갖는다.
 */

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import styled from '@emotion/styled';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { KAKAO_SDK_SRC } from '@/features/map/hooks/useKakaoMap';
import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';

const MapFrame = styled.div`
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: 6px;
  overflow: hidden;
  background: ${meok[100]};
`;

const Canvas = styled.div`
  width: 100%;
  height: 100%;
`;

const NoCoords = styled.p`
  padding: 40px 0;
  text-align: center;
  font-size: ${fontSize.sm};
  color: ${meok[500]};
`;

function findPlace(board: JourneyBoard, ref: ResourceRef): PlaceResource | undefined {
  return board.resources.find(
    (r): r is PlaceResource => r.ref.type === 'PLACE' && r.ref.id === ref.id,
  );
}

interface JourneyMapViewProps {
  board: JourneyBoard;
  focusedRef: ResourceRef | null;
  onFocus: (ref: ResourceRef) => void;
}

export default function JourneyMapView({ board, focusedRef, onFocus }: JourneyMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const overlaysRef = useRef<any[]>([]);
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  const places = board.candidates
    .map((c) => findPlace(board, c.placeRef))
    .filter((p): p is PlaceResource => !!p && !!p.location);

  /**
   * onLoad(Script)와 mount effect가 거의 동시에 build()를 부를 수 있다 — Next.js는
   * 같은 src의 <Script>가 이미 로드돼 있으면 새로 마운트된 컴포넌트의 onLoad도
   * 바로 불러준다. map은 한 번만 만들고, 마커는 매번 지운 뒤 다시 그려 중복을 막는다.
   */
  function build() {
    const container = containerRef.current;
    if (!container || !window.kakao?.maps || places.length === 0) return;

    window.kakao.maps.load(() => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      markersRef.current.clear();

      const first = places[0].location!;
      if (!mapRef.current) {
        mapRef.current = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(first.latitude, first.longitude),
          level: 4,
        });
      }
      const map = mapRef.current;

      const bounds = new window.kakao.maps.LatLngBounds();

      places.forEach((place, idx) => {
        const loc = place.location!;
        const position = new window.kakao.maps.LatLng(loc.latitude, loc.longitude);
        bounds.extend(position);

        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', `${idx + 1}. ${place.title}`);
        el.style.cssText =
          'display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;' +
          `background:${palette.juhong[500]};color:#fff;font-size:12px;font-weight:600;border:2px solid #fff;` +
          'box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer;';
        el.textContent = String(idx + 1);
        el.addEventListener('click', () => onFocusRef.current(place.ref));

        const overlay = new window.kakao.maps.CustomOverlay({
          position,
          content: el,
          yAnchor: 0.5,
          xAnchor: 0.5,
        });
        overlay.setMap(map);
        overlaysRef.current.push(overlay);
        markersRef.current.set(place.ref.id, el);
      });

      if (places.length > 1) map.setBounds(bounds, 40, 40, 40, 40);
      else map.setCenter(new window.kakao.maps.LatLng(first.latitude, first.longitude));
    });
  }

  useEffect(() => {
    if (window.kakao?.maps) build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  useEffect(() => {
    markersRef.current.forEach((el, id) => {
      const focused = focusedRef?.id === id;
      el.style.transform = focused ? 'scale(1.25)' : 'scale(1)';
      el.style.zIndex = focused ? '10' : '1';
    });
  }, [focusedRef]);

  if (places.length === 0) {
    return <NoCoords>좌표가 확인된 장소가 없어 지도를 표시할 수 없어요.</NoCoords>;
  }

  return (
    <MapFrame>
      <Script strategy="afterInteractive" src={KAKAO_SDK_SRC} onLoad={build} />
      <Canvas ref={containerRef} role="application" aria-label="선택한 장소 지도" />
    </MapFrame>
  );
}
