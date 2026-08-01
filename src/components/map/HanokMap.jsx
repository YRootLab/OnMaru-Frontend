'use client';

/*
  =============================================================
  ⚠️ [주의 / NOTICE] 여 기 는  임 시  파 일 입 니 다 !
  =============================================================
  - 이 파일(HanokMap.jsx)은 지도 프리뷰용 임시 프로토타입 파일입니다.
  - 추후 정식 지도 서비스 구현 시 수정을 하거나 대체될 수 있습니다.
  =============================================================
*/

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import styled from '@emotion/styled';

import 'leaflet/dist/leaflet.css';

import { lightPalette, meok } from '@/design-system/tokens';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

/** 남해까지 담기는 대한민국 전체 구도. */
const KOREA_CENTER = [36.4, 127.8];
const KOREA_ZOOM = 7;

/**
 * 기본 마커 아이콘은 번들러를 거치면 이미지 경로가 깨진다.
 * CircleMarker는 SVG라 그 문제가 통째로 없고, 점 하나가 이 화면에 더 맞기도 하다.
 */
const DOT_RADIUS = 7;
const DOT_RADIUS_ACTIVE = 11;

const Frame = styled.div`
  position: absolute;
  inset: 0;

  .leaflet-container {
    width: 100%;
    height: 100%;
    background: #f2ece1;
    font-family: ${FONT};
  }

  /* 기본 팝업이 파란 링크와 각진 그림자를 갖고 있어 화면 톤과 어긋난다 */
  .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 8px 28px rgba(25, 31, 40, 0.16);
  }

  .leaflet-popup-content {
    margin: 12px 14px;
    font-family: ${FONT};
  }

  .leaflet-control-attribution {
    font-family: ${FONT};
    font-size: 10px;
  }
`;

const PopupName = styled.strong`
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};
`;

const PopupMeta = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: ${meok[500]};
`;

/** 필터가 바뀌면 남은 점들이 다 보이도록 지도를 다시 맞춘다. */
function FitToPlaces({ places }) {
  const map = useMap();

  useEffect(() => {
    if (places.length === 0) return;

    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 11, { animate: true });
      return;
    }

    map.fitBounds(
      places.map((place) => [place.lat, place.lng]),
      { padding: [64, 64], animate: true },
    );
  }, [map, places]);

  return null;
}

export default function HanokMap({ places, activeId, onSelect }) {
  return (
    <Frame>
      <MapContainer center={KOREA_CENTER} zoom={KOREA_ZOOM} scrollWheelZoom minZoom={6} maxZoom={16}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToPlaces places={places} />

        {places.map((place) => {
          const active = place.id === activeId;

          return (
            <CircleMarker
              key={place.id}
              center={[place.lat, place.lng]}
              radius={active ? DOT_RADIUS_ACTIVE : DOT_RADIUS}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: lightPalette.juhong[500],
                fillOpacity: active ? 1 : 0.82,
              }}
              eventHandlers={{ click: () => onSelect(place.id) }}
            >
              <Popup>
                <PopupName>{place.name}</PopupName>
                <PopupMeta>{place.region}</PopupMeta>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Frame>
  );
}
