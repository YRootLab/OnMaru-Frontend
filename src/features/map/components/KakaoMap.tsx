'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import {
  Plane,
  X,
  RotateCcw,
  LocateFixed,
  Sun,
  Moon,
  Plus,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { meok, lightPalette, surface, fontSize } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { KAKAO_SDK_SRC, useKakaoMap } from '@/features/map/hooks/useKakaoMap';
import { DEFAULT_CENTER, useMapStore } from '@/features/map/hooks/useMapStore';
import type { LatLng } from '@/features/map/types';

const mapGlobalStyles = css`



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
    transform: scale(1.08);
  }

  [data-theme='dark'] .om-my-location-pin {
    filter: invert(100%) hue-rotate(180deg) brightness(105%) contrast(95%);
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

  .om-my-location-bubble {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3.5px 10px;
    margin-bottom: 2px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    background: #ffffff;
    color: #171513;
    letter-spacing: -0.2px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
    border: 1px solid rgba(0, 0, 0, 0.08);
    position: relative;
    z-index: 5;
    transition: all 0.2s ease;
  }

  .om-my-location-bubble::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: #ffffff transparent transparent transparent;
  }

  [data-theme='dark'] .om-my-location-bubble {
    background: #1c1a17;
    color: #f8f8f7;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }

  [data-theme='dark'] .om-my-location-bubble::after {
    border-color: #1c1a17 transparent transparent transparent;
  }

  .om-my-location-oni-wrap {
    position: relative;
    width: 108px;
    height: 108px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    pointer-events: none;
    margin-bottom: -18px;
  }

  .om-my-location-oni-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.32));
    pointer-events: none;
    user-select: none;
  }

  .om-my-location-ground-shadow {
    width: 48px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0) 75%);
    margin-top: -12px;
    pointer-events: none;
    z-index: 1;
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }

  [data-theme='dark'] .om-my-location-ground-shadow {
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.32) 45%, rgba(255, 255, 255, 0) 75%);
    box-shadow: 0 0 16px rgba(255, 255, 255, 0.65);
  }

  @media (max-width: 640px) {
    .om-my-location-oni-wrap {
      width: 86px;
      height: 86px;
      margin-bottom: -14px;
    }
    .om-my-location-bubble {
      font-size: 10.5px;
      padding: 3px 8px;
      margin-bottom: 2px;
    }
    .om-my-location-ground-shadow {
      width: 38px;
      height: 8px;
      margin-top: -10px;
    }
  }
`;

const Frame = styled.div`
  position: absolute;
  inset: 0;
`;

const Canvas = styled.div<{ $isNight: boolean }>`
  width: 100%;
  height: 100%;
  background: #f2ece1;
  transition: filter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  filter: ${({ $isNight }) =>
    $isNight
      ? 'invert(92%) hue-rotate(180deg) brightness(92%) contrast(112%) saturate(85%)'
      : 'none'};
`;












const WarmTint = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  mix-blend-mode: multiply;
  background: #f6ecd9;
  opacity: ${({ $active }) => ($active ? 0.06 : 0)};
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;

const FlightBanner = styled.div`
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 45;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 8px 12px;
  background: #191f28;
  color: #ffffff;
  border-radius: 9999px;
  animation: flight-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;

  @keyframes flight-in {
    from {
      opacity: 0;
      transform: translate(-50%, -14px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
    }
  }

  span.hub-name {
    font-size: ${fontSize.xs};
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.2px;
  }

  span.step-badge {
    padding: 2px 7px;
    border-radius: 9999px;
    background: ${lightPalette.juhong[500]};
    font-size: ${fontSize.micro};
    font-weight: 700;
  }

  button.stop-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    font-size: ${fontSize.xs};
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
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
  border: none;

  color: ${meok[900]};
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  animation: research-in 0.24s ease-out both;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    color: ${meok[100]};
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  }

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
    bottom: 136px;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;

  background: ${({ $active }) => ($active ? '#191F28' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#FFFFFF' : meok[700])};
  cursor: pointer;
  transition: all 0.15s ease;

  & + & {
    border-top: 1px solid rgba(78, 89, 104, 0.1);
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#191F28' : 'rgba(25, 31, 40, 0.04)')};
    color: ${({ $active }) => ($active ? '#FFFFFF' : meok[900])};
  }

  &:active {
    transform: scale(0.94);
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
    color: ${({ $active }) => ($active ? meok[900] : meok[200])};

    & + & {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    &:hover {
      background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.08)')};
      color: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
    }
  }
`;


const FLIGHT_STOPS = [
  { name: '서울 북촌 한옥마을', lat: 37.5826, lng: 126.9848, level: 4 },
  { name: '전주 한옥마을', lat: 35.8150, lng: 127.1530, level: 4 },
  { name: '안동 하회마을', lat: 36.5392, lng: 128.5185, level: 4 },
  { name: '경주 양동마을', lat: 35.9985, lng: 129.2520, level: 4 },
];

export default function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initMap = useKakaoMap(containerRef);
  const { mode: themeMode, setMode: setThemePreference } = useOnmaruTheme();
  const isEffectiveNight = themeMode === 'dark';
  const map = useMapStore((s) => s.map);
  const isSearchDirty = useMapStore((s) => s.isSearchDirty);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const [isLocating, setIsLocating] = useState(false);
  const [flightState, setFlightState] = useState<{ active: boolean; step: number }>({
    active: false,
    step: 0,
  });

  const flightTimerRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (!map) return;
    const id = setTimeout(() => map.relayout(), 320);
    return () => clearTimeout(id);
  }, [map, panelOpen]);

  const hasAutoLocatedRef = useRef(false);
  const myLocationOverlayRef = useRef<any>(null);
  const myLocationCircleRef = useRef<any>(null);

  const searchParams = useSearchParams();
  const queryLat = searchParams?.get('lat');
  const queryLng = searchParams?.get('lng');
  const parsedQueryLat = parseFloat(queryLat || '');
  const parsedQueryLng = parseFloat(queryLng || '');
  const hasQueryCoords =
    !isNaN(parsedQueryLat) &&
    !isNaN(parsedQueryLng) &&
    parsedQueryLat >= 33 &&
    parsedQueryLat <= 39 &&
    parsedQueryLng >= 124 &&
    parsedQueryLng <= 132;


  useEffect(() => {
    if (!map || !hasQueryCoords || !window.kakao?.maps) return;
    hasAutoLocatedRef.current = true;
    map.setLevel(4, { animate: false });
    map.setCenter(new window.kakao.maps.LatLng(parsedQueryLat, parsedQueryLng));
  }, [map, hasQueryCoords, parsedQueryLat, parsedQueryLng]);


  useEffect(() => {
    if (!map || hasAutoLocatedRef.current || hasQueryCoords) return;
    hasAutoLocatedRef.current = true;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const level = useMapStore.getState().mode === 'info' ? 7 : 5;
          moveTo(currentPos, level, pos.coords.accuracy);
        },
        () => {

          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              const fallbackCoord = { lat: fallbackPos.coords.latitude, lng: fallbackPos.coords.longitude };
              const level = useMapStore.getState().mode === 'info' ? 7 : 5;
              moveTo(fallbackCoord, level, fallbackPos.coords.accuracy);
            },
            () => {

            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
          );
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 120000 },
      );
    }
  }, [map, hasQueryCoords]);

  const moveTo = (target: LatLng, targetLevel = 3, accuracy?: number) => {
    const currentMap = useMapStore.getState().map;
    if (!currentMap || !window.kakao?.maps) return;
    const latLng = new window.kakao.maps.LatLng(target.lat, target.lng);


    currentMap.setLevel(targetLevel, { animate: true });
    currentMap.setCenter(latLng);


    const buildOniPinElement = () => {
      const el = document.createElement('div');
      el.className = 'om-my-location-pin';
      el.innerHTML = `
        <div class="om-my-location-bubble">
          <span>내 위치 👋</span>
        </div>
        <div class="om-my-location-oni-wrap">
          <video autoplay loop muted playsinline preload="auto" class="om-my-location-oni-video">
            <source src="/videos/Oni_hi.webm" type="video/webm" />
          </video>
        </div>
        <div class="om-my-location-ground-shadow"></div>
      `;
      el.addEventListener('click', () => {
        currentMap.setLevel(3, { animate: true });
        currentMap.panTo(latLng);
      });
      const vid = el.querySelector('video');
      if (vid) {
        vid.muted = true;
        vid.play().catch(() => {});
        vid.addEventListener('error', () => {
          const img = document.createElement('img');
          img.src = '/images/character/Oni_hi.png';
          img.className = vid.className;
          img.style.cssText = vid.style.cssText;
          vid.replaceWith(img);
        });
      }
      return el;
    };

    if (myLocationOverlayRef.current) {
      myLocationOverlayRef.current.setMap(null);
      myLocationOverlayRef.current = null;
    }

    const pinEl = buildOniPinElement();
    myLocationOverlayRef.current = new window.kakao.maps.CustomOverlay({
      position: latLng,
      content: pinEl,
      yAnchor: 0.94,
      xAnchor: 0.5,
      zIndex: 35,
    });
    myLocationOverlayRef.current.setMap(currentMap);

    if (myLocationCircleRef.current) {
      myLocationCircleRef.current.setMap(null);
      myLocationCircleRef.current = null;
    }

    if (accuracy && accuracy > 0 && accuracy <= 3000) {
      myLocationCircleRef.current = new window.kakao.maps.Circle({
        map: currentMap,
        center: latLng,
        radius: accuracy,
        strokeWeight: 1,
        strokeColor: '#4A90D9',
        strokeOpacity: 0.35,
        fillColor: '#4A90D9',
        fillOpacity: 0.07,
      });
    }

    const store = useMapStore.getState();
    store.setUserLocation(target);
    store.setCenter(target, targetLevel);
    store.clearSearchDirty();
  };

  const zoom = (delta: number) => {
    const currentMap = useMapStore.getState().map;
    if (currentMap) currentMap.setLevel(currentMap.getLevel() + delta, { animate: true });
  };

  const locate = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('현재 환경에서는 위치 정보를 지원하지 않아요.');
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
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (fallbackErr) => {
          setIsLocating(false);
          if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
            toast.error('브라우저 상단 주소창 왼쪽의 위치 권한을 [허용]으로 변경해 주세요.');
          } else {
            toast.error('현재 위치를 가져올 수 없어요. 기본 위치로 보여드릴게요.');
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    });
  };


  const stopFlight = useCallback(() => {
    if (flightTimerRef.current) clearInterval(flightTimerRef.current);
    flightTimerRef.current = null;
    setFlightState({ active: false, step: 0 });
  }, []);

  const startFlight = useCallback(() => {
    if (!map || !window.kakao?.maps) return;

    if (flightState.active) {
      stopFlight();
      return;
    }

    let currentStep = 0;
    const executeStep = (step: number) => {
      const stop = FLIGHT_STOPS[step];
      if (!stop) {
        stopFlight();
        return;
      }

      setFlightState({ active: true, step });
      const latLng = new window.kakao.maps.LatLng(stop.lat, stop.lng);
      map.setLevel(stop.level, { animate: true });
      map.panTo(latLng);

      const store = useMapStore.getState();
      store.setCenter({ lat: stop.lat, lng: stop.lng }, stop.level);
    };

    executeStep(0);

    flightTimerRef.current = setInterval(() => {
      currentStep += 1;
      if (currentStep >= FLIGHT_STOPS.length) {
        stopFlight();
      } else {
        executeStep(currentStep);
      }
    }, 4800);
  }, [map, flightState.active, stopFlight]);

  useEffect(() => {
    return () => {
      if (flightTimerRef.current) clearInterval(flightTimerRef.current);
    };
  }, []);

  const currentFlightStop = FLIGHT_STOPS[flightState.step];

  return (
    <Frame>
      <Global styles={mapGlobalStyles} />
      <Script strategy="afterInteractive" src={KAKAO_SDK_SRC} onLoad={initMap} />

      <Canvas
        ref={containerRef}
        role="application"
        aria-label="한옥 위치 지도"
        $isNight={isEffectiveNight}
      />
      <WarmTint $active={!isEffectiveNight} aria-hidden="true" />

      {}
      {flightState.active && currentFlightStop && (
        <FlightBanner>
          <span className="step-badge">{flightState.step + 1} / {FLIGHT_STOPS.length}</span>
          <span className="hub-name flex items-center gap-1">
            <Plane size={14} strokeWidth={2} />
            <span>시네마틱 투어 중: {currentFlightStop.name}</span>
          </span>
          <button type="button" className="stop-btn" onClick={stopFlight}>
            <X size={14} strokeWidth={2} />
            <span>종료</span>
          </button>
        </FlightBanner>
      )}

      {isSearchDirty && !flightState.active && (
        <Research type="button" onClick={() => useMapStore.getState().clearSearchDirty()}>
          <RotateCcw size={16} strokeWidth={2} aria-hidden />
          이 지역 재검색
        </Research>
      )}

      <Controls>
        {}
        <Stack>
          <ControlButton
            type="button"
            aria-label="현위치로 이동"
            onClick={locate}
            $active={isLocating}
            title="내 현재 위치로 이동"
          >
            {isLocating ? (
              <RotateCcw size={18} strokeWidth={2} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <LocateFixed size={18} strokeWidth={2} />
            )}
          </ControlButton>
          <ControlButton
            type="button"
            aria-label="시네마틱 한옥 스카이뷰 비행 투어"
            onClick={startFlight}
            $active={flightState.active}
            title={flightState.active ? '스카이뷰 비행 투어 중지' : '전국 4대 한옥 스카이뷰 비행 투어'}
          >
            <Plane size={18} strokeWidth={2} />
          </ControlButton>
        </Stack>

        {}
        <Stack>
          <ControlButton type="button" aria-label="확대" onClick={() => zoom(-1)}>
            <Plus size={18} strokeWidth={2} />
          </ControlButton>
          <ControlButton type="button" aria-label="축소" onClick={() => zoom(1)}>
            <Minus size={18} strokeWidth={2} />
          </ControlButton>
        </Stack>
      </Controls>
    </Frame>
  );
}
