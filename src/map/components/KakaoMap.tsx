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
   * 내 위치 플로팅 핀 & 펄스 리플
   * ------------------------------------------------------------ */
  .om-my-location-pin {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    animation: om-pin-drop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .om-my-location-pin:hover {
    transform: translateY(-4px) scale(1.08);
  }

  @keyframes om-pin-drop {
    0% {
      transform: translateY(-24px) scale(0.6);
      opacity: 0;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  .om-my-location-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    margin-bottom: 5px;
    border-radius: 9999px;
    font-size: 11.5px;
    font-weight: 800;
    white-space: nowrap;

    backdrop-filter: blur(6px);
  }

  [data-theme='light'] .om-my-location-label,
  :root:not([data-theme='dark']) .om-my-location-label {
    background: rgba(255, 255, 255, 0.96);
    color: #1a3898;

  }

  [data-theme='dark'] .om-my-location-label {
    background: rgba(32, 68, 164, 0.92);
    color: #ffffff;

  }

  .om-my-location-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: #2b5ce6;

  }

  [data-theme='dark'] .om-my-location-icon-wrap {
    background: #5a89f6;
    border-color: #1c1a17;

  }

  .om-my-location-icon-wrap svg {
    transform: rotate(45deg);
    width: 17px;
    height: 17px;
    color: #ffffff;
  }

  .om-my-location-ripple {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(43, 92, 230, 0.45);
    pointer-events: none;
    animation: om-my-ripple 2.2s ease-out infinite;
  }

  @keyframes om-my-ripple {
    0% {
      transform: translateX(-50%) scale(0.6);
      opacity: 0.9;
    }
    100% {
      transform: translateX(-50%) scale(3.4);
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

  const myLocationOverlayRef = useRef<any>(null);
  const myLocationCircleRef = useRef<any>(null);

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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>내 위치</span>
        </div>
        <div class="om-my-location-icon-wrap">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <div class="om-my-location-ripple"></div>
      `;
      el.addEventListener('click', () => {
        currentMap.setLevel(3, { animate: true });
        currentMap.panTo(latLng);
      });

      myLocationOverlayRef.current = new window.kakao.maps.CustomOverlay({
        position: latLng,
        content: el,
        yAnchor: 1.0,
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

