'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { Loader2, LocateFixed, Minus, Plus, RotateCw } from 'lucide-react';
import { meok, lightPalette } from '@/design-system/tokens';
import { KAKAO_SDK_SRC, useKakaoMap } from '@/map/hooks/useKakaoMap';
import { DEFAULT_CENTER, useMapStore } from '@/map/hooks/useMapStore';
import type { LatLng } from '@/map/types';

const mapGlobalStyles = css`
  /* ------------------------------------------------------------
   * 내 위치 (My Location) 모던 펄스 레이더 마커
   * ------------------------------------------------------------ */
  .om-my-location-pin {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    animation: om-my-location-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .om-my-location-pin:hover {
    transform: scale(1.1);
  }

  @keyframes om-my-location-appear {
    0% {
      transform: scale(0.4);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .om-my-location-label {
    display: inline-flex;
    align-items: center;
    gap: 4.5px;
    padding: 3.5px 10px;
    margin-bottom: 6px;
    border-radius: 9999px;
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
    background: #ffffff;
    color: #2b5ce6;
    letter-spacing: -0.2px;
  }

  [data-theme='dark'] .om-my-location-label {
    background: #1c1a17;
    color: #5a89f6;
  }

  .om-my-location-beacon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
  }

  .om-my-location-core {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #2b5ce6;
  }

  .om-my-location-core-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ffffff;
  }

  .om-my-location-pulse-1,
  .om-my-location-pulse-2 {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(43, 92, 230, 0.45);
    pointer-events: none;
    animation: om-my-pulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }

  .om-my-location-pulse-2 {
    animation-delay: 1.1s;
  }

  @keyframes om-my-pulse {
    0% {
      transform: scale(0.6);
      opacity: 0.8;
    }
    100% {
      transform: scale(2.6);
      opacity: 0;
    }
  }
`;

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

  border-radius: 9999px;
  background: #ffffff;

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

  overflow: hidden;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;

  background: #ffffff;
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  & + & {
    border-top: 1px solid rgba(78, 89, 104, 0.1);
  }

  &:hover {
    background: rgba(25, 31, 40, 0.04);
    color: ${meok[900]};
  }

  &:active {
    background: rgba(25, 31, 40, 0.08);
  }

  &[data-active='true'] {
    color: ${lightPalette.cheongrok[500]};
  }
`;

export default function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initMap = useKakaoMap(containerRef);
  const map = useMapStore((s) => s.map);
  const isSearchDirty = useMapStore((s) => s.isSearchDirty);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const [isLocating, setIsLocating] = useState(false);

  // 패널이 접히면 지도 컨테이너 크기가 바뀐다. 카카오는 relayout을 직접 불러줘야 한다.
  useEffect(() => {
    if (!map) return;
    const id = setTimeout(() => map.relayout(), 320);
    return () => clearTimeout(id);
  }, [map, panelOpen]);

  const hasAutoLocatedRef = useRef(false);
  const myLocationOverlayRef = useRef<any>(null);
  const myLocationCircleRef = useRef<any>(null);

  // 지도 페이지 진입 시 사용자 현재 위치로 자동 이동 및 주변 장소 탐색
  useEffect(() => {
    if (!map || hasAutoLocatedRef.current) return;
    hasAutoLocatedRef.current = true;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          moveTo(currentPos, 5, pos.coords.accuracy);
        },
        () => {
          // 저정밀도(네트워크/IP) 2차 시도
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              const fallbackCoord = { lat: fallbackPos.coords.latitude, lng: fallbackPos.coords.longitude };
              moveTo(fallbackCoord, 5, fallbackPos.coords.accuracy);
            },
            () => {
              // 위치 권한 미허용 시 기본 전국 시점 유지
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
          );
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 120000 },
      );
    }
  }, [map]);

  const moveTo = (target: LatLng, targetLevel = 3, accuracy?: number) => {
    const currentMap = useMapStore.getState().map;
    if (!currentMap || !window.kakao?.maps) return;
    const latLng = new window.kakao.maps.LatLng(target.lat, target.lng);

    // 1. 내 위치로 확대 및 이동
    currentMap.setLevel(targetLevel, { animate: true });
    currentMap.setCenter(latLng);

    // 2. 내 위치 핀 & 라벨 표시
    if (!myLocationOverlayRef.current) {
      const el = document.createElement('div');
      el.className = 'om-my-location-pin';
      el.innerHTML = `
        <div class="om-my-location-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:2px;">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <span>내 위치</span>
        </div>
        <div class="om-my-location-beacon-wrap">
          <div class="om-my-location-pulse-1"></div>
          <div class="om-my-location-pulse-2"></div>
          <div class="om-my-location-core">
            <div class="om-my-location-core-inner"></div>
          </div>
        </div>
      `;
      el.addEventListener('click', () => {
        currentMap.setLevel(3, { animate: true });
        currentMap.panTo(latLng);
      });

      myLocationOverlayRef.current = new window.kakao.maps.CustomOverlay({
        position: latLng,
        content: el,
        yAnchor: 0.75,
        xAnchor: 0.5,
        zIndex: 35,
      });
      myLocationOverlayRef.current.setMap(currentMap);
    } else {
      myLocationOverlayRef.current.setPosition(latLng);
      myLocationOverlayRef.current.setMap(currentMap);
    }

    // 3. GPS 정확도 오차 반경 서클 (Accuracy Circle)
    if (accuracy && accuracy > 0 && accuracy <= 3000) {
      if (!myLocationCircleRef.current) {
        myLocationCircleRef.current = new window.kakao.maps.Circle({
          center: latLng,
          radius: Math.min(accuracy, 600),
          strokeWeight: 1.5,
          strokeColor: '#2B5CE6',
          strokeOpacity: 0.5,
          strokeStyle: 'dashed',
          fillColor: '#2B5CE6',
          fillOpacity: 0.08,
          zIndex: 10,
        });
        myLocationCircleRef.current.setMap(currentMap);
      } else {
        myLocationCircleRef.current.setPosition(latLng);
        myLocationCircleRef.current.setRadius(Math.min(accuracy, 600));
        myLocationCircleRef.current.setMap(currentMap);
      }
    }

    const store = useMapStore.getState();
    store.setCenter(target, targetLevel);
    store.clearSearchDirty();
  };

  const zoom = (delta: number) => {
    const currentMap = useMapStore.getState().map;
    if (currentMap) currentMap.setLevel(currentMap.getLevel() + delta, { animate: true });
  };

  const locate = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('현재 환경에서 위치 정보를 지원하지 않습니다.');
      return;
    }

    setIsLocating(true);

    const onSuccess = (pos: GeolocationPosition) => {
      setIsLocating(false);
      const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      moveTo(currentPos, 3, pos.coords.accuracy);
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn('GPS 고정밀도 조회 실패, 일반 위치로 재시도:', err.message);
      // 고정밀도 실패 시 저정밀도(네트워크/IP 기반)로 2차 시도
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (fallbackErr) => {
          setIsLocating(false);
          if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
            alert('브라우저 상단 주소창 왼쪽의 위치 권한을 [허용]으로 변경해 주세요.');
          } else {
            alert('현재 위치 정보를 가져올 수 없습니다. 기본 위치로 유지됩니다.');
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    };

    // 항상 캐시를 배제(maximumAge: 0)하고 고정밀도 센서를 최대한 활용
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    });
  };

  return (
    <Frame>
      <Global styles={mapGlobalStyles} />
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
          <ControlButton
            type="button"
            aria-label="현위치로 이동"
            onClick={locate}
            data-active={isLocating}
            title="내 현재 위치로 이동"
          >
            {isLocating ? (
              <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <LocateFixed size={18} />
            )}
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

