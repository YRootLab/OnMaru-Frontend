'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import styled from '@emotion/styled';
import { LocateFixed, Minus, Plus, RotateCw } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { KAKAO_SDK_SRC, useKakaoMap } from '../hooks/useKakaoMap';
import { DEFAULT_CENTER, useMapStore } from '../hooks/useMapStore';
import type { LatLng } from '../types';

const Frame = styled.div`
  position: absolute;
  inset: 0;
`;

const Canvas = styled.div`
  width: 100%;
  height: 100%;
  background: #f2ece1;
`;

const Research = styled.button`
  position: absolute;
  top: 68px;
  left: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(25, 31, 40, 0.16);
  color: ${meok[900]};
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  animation: research-in 0.24s ease-out both;

  @keyframes research-in {
    from {
      opacity: 0;
      transform: translate(-50%, -8px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  /* 모바일은 상단에 검색바+모드토글이 떠 있어 그 아래로 내린다. */
  @media (max-width: 1023px) {
    top: 108px;
  }
`;

const Controls = styled.div`
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 1023px) {
    bottom: 136px; /* peek 시트(120px) 위 */
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(25, 31, 40, 0.14);
  overflow: hidden;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: #ffffff;
  color: ${meok[700]};
  cursor: pointer;

  & + & {
    border-top: 1px solid rgba(78, 89, 104, 0.1);
  }

  &:hover {
    background: rgba(25, 31, 40, 0.04);
  }
`;

export default function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initMap = useKakaoMap(containerRef);
  const map = useMapStore((s) => s.map);
  const isSearchDirty = useMapStore((s) => s.isSearchDirty);
  const panelOpen = useMapStore((s) => s.panelOpen);

  // 패널이 접히면 지도 컨테이너 크기가 바뀐다. 카카오는 relayout을 직접 불러줘야 한다.
  useEffect(() => {
    if (!map) return;
    const id = setTimeout(() => map.relayout(), 320);
    return () => clearTimeout(id);
  }, [map, panelOpen]);

  const panTo = (center: LatLng) => {
    map?.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
  };

  const zoom = (delta: number) => {
    if (map) map.setLevel(map.getLevel() + delta, { animate: true });
  };

  const locate = () => {
    if (!navigator.geolocation) return panTo(DEFAULT_CENTER);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => panTo({ lat: coords.latitude, lng: coords.longitude }),
      () => panTo(DEFAULT_CENTER),
    );
  };

  return (
    <Frame>
      <Script strategy="afterInteractive" src={KAKAO_SDK_SRC} onLoad={initMap} />

      <Canvas ref={containerRef} role="application" aria-label="한옥 위치 지도" />

      {isSearchDirty && (
        <Research type="button" onClick={() => useMapStore.getState().clearSearchDirty()}>
          <RotateCw size={16} aria-hidden />
          이 지역 재검색
        </Research>
      )}

      <Controls>
        <Stack>
          <ControlButton type="button" aria-label="현위치로 이동" onClick={locate}>
            <LocateFixed size={18} />
          </ControlButton>
        </Stack>
        <Stack>
          <ControlButton type="button" aria-label="확대" onClick={() => zoom(-1)}>
            <Plus size={18} />
          </ControlButton>
          <ControlButton type="button" aria-label="축소" onClick={() => zoom(1)}>
            <Minus size={18} />
          </ControlButton>
        </Stack>
      </Controls>
    </Frame>
  );
}
