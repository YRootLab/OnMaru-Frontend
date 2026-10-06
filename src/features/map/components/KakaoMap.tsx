'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, LocateFixedIcon, MinusSignIcon, Moon01Icon, PlusSignIcon, RotateCcwIcon, Sun01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner';
import { meok, lightPalette, surface, fontSize, palette } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { KAKAO_SDK_SRC, snapshotFromMap, useKakaoMap } from '@/features/map/hooks/useKakaoMap';
import { useKakaoSdkLoad } from '@/features/map/hooks/useKakaoSdkLoad';
import { DEFAULT_CENTER, useMapStore } from '@/features/map/hooks/useMapStore';
import type { LatLng } from '@/features/map/types';
import { isAppleOrSafari } from '@/shared/hooks/useIsAppleDevice';
import { OniSearchEmpty } from '@/shared/components/OniSearchEmpty/OniSearchEmpty';
import { getMapLoadErrorCopy } from '@/features/map/presentation/mapLoadErrorCopy';

const LOC_PERMISSION_KEY = 'om_location_permission_granted';

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
    margin-bottom: -4px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #171513;
    letter-spacing: -0.2px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.13);
    border: 1px solid rgba(0, 0, 0, 0.06);
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
    background: rgba(20, 22, 30, 0.78);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #f8f8f7;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  }

  [data-theme='dark'] .om-my-location-bubble::after {
    border-color: rgba(20, 22, 30, 0.78) transparent transparent transparent;
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
    margin-top: -2px;
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
      margin-top: -2px;
    }
    .om-my-location-bubble {
      font-size: 10.5px;
      padding: 3px 8px;
      margin-bottom: -4px;
    }
    .om-my-location-ground-shadow {
      width: 38px;
      height: 8px;
      margin-top: -10px;
    }
  }

  /* ── 소고 춤 로딩 애니메이션 ─────────────────────────────────────────── */
  @keyframes sogo-card-in {
    from { opacity: 0; transform: translateY(12px) scale(0.9); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }

  @keyframes sogo-shimmer {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
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

const MapFailureOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 19;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 248, 247, 0.96);
  backdrop-filter: blur(8px);

  [data-theme='dark'] & {
    background: rgba(23, 30, 43, 0.96);
  }
`;

const MapRetryButton = styled.button`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid rgba(78, 89, 104, 0.22);
  border-radius: 9999px;
  background: #ffffff;
  padding: 0 16px;
  color: ${meok[800]};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-action-secondary);
    outline-offset: 2px;
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.16);
    background: ${surface.dark.card};
    color: ${meok[100]};
  }
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

// ── Location Permission Modal ────────────────────────────────────────────────
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(14, 16, 22, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: modal-fade-in 0.22s ease;

  @keyframes modal-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalCard = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 28px 24px 24px;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.1);
  animation: modal-slide-up 0.28s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: #1e2028;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  }

  @keyframes modal-slide-up {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const ModalEmoji = styled.div`
  font-size: 40px;
  text-align: center;
  margin-bottom: 14px;
  line-height: 1;
`;

const ModalTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #171513;
  text-align: center;
  margin: 0 0 8px;
  letter-spacing: -0.03em;

  [data-theme='dark'] & {
    color: #f5f5f4;
  }
`;

const ModalDesc = styled.p`
  font-size: 13.5px;
  color: #6b7280;
  text-align: center;
  line-height: 1.6;
  margin: 0 0 22px;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: #9ca3af;
  }
`;

const ModalButtonRow = styled.div`
  display: flex;
  gap: 8px;
`;

const ModalDenyBtn = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(25, 31, 40, 0.12);
  background: #f5f5f4;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;

  &:hover {
    background: #e5e5e3;
    color: #374151;
  }

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.1);
    color: #9ca3af;
    &:hover { background: rgba(255,255,255,0.1); color: #d1d5db; }
  }
`;

const ModalAllowBtn = styled.button`
  flex: 2;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: ${meok[900]};
  color: var(--color-bg-app);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  letter-spacing: -0.01em;

  &:hover {
    background: ${meok[800]};
    color: var(--color-bg-app);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.18);
  }

  &:active { transform: scale(0.97); }

  [data-theme='dark'] & {
    background: var(--color-action-secondary);
    color: var(--color-bg-app);
    &:hover { background: var(--color-action-secondary-hover); }
  }
`;

// ── Sogo Dance Loading Overlay ─────────────────────────────────────────────
const LocatingOverlay = styled.div`
  position: absolute;
  right: 72px;
  bottom: 16px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  animation: sogo-card-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (max-width: 1023px) {
    right: 50%;
    transform: translateX(50%);
    bottom: 160px;
  }
`;

const SogoBubble = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  margin-bottom: -6px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #171513;
  letter-spacing: -0.2px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.07);
  position: relative;
  animation: sogo-shimmer 1s ease-in-out infinite;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.92) transparent transparent transparent;
  }

  [data-theme='dark'] & {
    background: rgba(18, 20, 28, 0.9);
    color: #f8f8f7;
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    &::after {
      border-color: rgba(18, 20, 28, 0.9) transparent transparent transparent;
    }
  }
`;

const SogoOniWrap = styled.div`
  width: 160px;
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  @media (max-width: 1023px) {
    width: 140px;
    height: 140px;
  }
`;

const SogoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.32));
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
    display: none;
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



export default function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { initMap, resetMapInitialization } = useKakaoMap(containerRef);
  const { mode: themeMode, setMode: setThemePreference } = useOnmaruTheme();
  const isEffectiveNight = themeMode === 'dark';
  const map = useMapStore((s) => s.map);
  const isSearchDirty = useMapStore((s) => s.isSearchDirty);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const detailId = useMapStore((s) => s.detailId);
  const sheetSnap = useMapStore((s) => s.sheetSnap);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { sdkAttempt, mapLoadError, handleSdkLoad, handleSdkError, retryMapLoad } =
    useKakaoSdkLoad({ map, initMap, resetMapInitialization });

  const mapErrorCopy = mapLoadError ? getMapLoadErrorCopy(mapLoadError) : null;


  useEffect(() => {
    if (!map) return;
    const id = setTimeout(() => map.relayout(), 320);
    return () => clearTimeout(id);
  }, [map, panelOpen]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const hasAutoLocatedRef = useRef(false);
  const myLocationOverlayRef = useRef<any>(null);
  const myLocationCircleRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  // Track current level for overlay visibility
  const currentLevelRef = useRef<number>(useMapStore.getState().level);

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


  // ── Auto-locate on mount with permission flow ───────────────────────────────
  const doAutoLocate = () => {
    if (!navigator.geolocation) return;
    useMapStore.getState().setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        useMapStore.getState().setIsLocating(false);
        const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const level = useMapStore.getState().mode === 'info' ? 7 : 5;
        moveTo(currentPos, level, pos.coords.accuracy);
        localStorage.setItem(LOC_PERMISSION_KEY, 'granted');
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            useMapStore.getState().setIsLocating(false);
            const fallbackCoord = { lat: fallbackPos.coords.latitude, lng: fallbackPos.coords.longitude };
            const level = useMapStore.getState().mode === 'info' ? 7 : 5;
            moveTo(fallbackCoord, level, fallbackPos.coords.accuracy);
            localStorage.setItem(LOC_PERMISSION_KEY, 'granted');
          },
          (err) => {
            useMapStore.getState().setIsLocating(false);
            if (err.code === err.PERMISSION_DENIED) {
              toast.error('브라우저 상단 주소창 왼쪽의 위치 권한을 [허용]으로 변경해 주세요.');
            }
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 120000 },
    );
  };

  useEffect(() => {
    if (!map || hasAutoLocatedRef.current || hasQueryCoords) return;
    hasAutoLocatedRef.current = true;

    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const alreadyGranted = localStorage.getItem(LOC_PERMISSION_KEY) === 'granted';
    if (alreadyGranted) {
      // Silently auto-locate
      doAutoLocate();
    } else {
      // Check actual permission state first (no prompt yet)
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            localStorage.setItem(LOC_PERMISSION_KEY, 'granted');
            doAutoLocate();
          } else if (result.state === 'denied') {
            // Don't show modal if already denied at browser level
          } else {
            // 'prompt' state – show our custom modal
            setShowLocationModal(true);
          }
        }).catch(() => {
          setShowLocationModal(true);
        });
      } else {
        setShowLocationModal(true);
      }
    }
  }, [map, hasQueryCoords]);

  const myLocationNonce = useMapStore((s) => s.myLocationNonce);
  const myLocationNonceInitRef = useRef(myLocationNonce);
  useEffect(() => {
    if (myLocationNonce === myLocationNonceInitRef.current) return;
    if (!map) return;
    doAutoLocate();
  }, [myLocationNonce, map]);

  // ── Zoom-level based overlay visibility ─────────────────────────────────────
  // Kakao level: 1=최대확대, 14=최대축소. level >= 9 이면 아이콘 숨김
  const MY_LOCATION_HIDE_LEVEL = 9;

  const updateOverlayVisibility = (level: number) => {
    currentLevelRef.current = level;
    const overlay = myLocationOverlayRef.current;
    if (!overlay) return;
    const shouldShow = level < MY_LOCATION_HIDE_LEVEL;
    overlay.setMap(shouldShow ? useMapStore.getState().map : null);
  };

  // Listen to map zoom changes
  useEffect(() => {
    if (!map || !window.kakao?.maps) return;
    const onZoomChanged = () => {
      const level = map.getLevel();
      updateOverlayVisibility(level);
    };
    window.kakao.maps.event.addListener(map, 'zoom_changed', onZoomChanged);
    return () => {
      window.kakao?.maps?.event?.removeListener(map, 'zoom_changed', onZoomChanged);
    };
  }, [map]);

  // ── Mobile map padding: pan marker into visible area above BottomSheet ──────
  useEffect(() => {
    if (!map || !detailId || !window.kakao?.maps) return;
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;

    const { items, listItems } = useMapStore.getState();
    let lat: number | null = null;
    let lng: number | null = null;
    const item = items.find((i) => i.id === detailId);
    if (item) { lat = item.lat; lng = item.lng; }
    else {
      const infoItem = listItems.find((i) => i.placeId === detailId);
      if (infoItem) { lat = infoItem.coordinates.lat; lng = infoItem.coordinates.lng; }
    }
    if (lat === null || lng === null) return;

    const vh = window.innerHeight;
    const sheetH =
      sheetSnap === 'full' ? vh * 0.86
      : sheetSnap === 'half' ? vh * 0.46
      : 110; // peek ≈ 58px tabbar + 12px + 40px

    // Shift target center down by half sheet height → marker appears in center of visible area
    const markerLatLng = new window.kakao.maps.LatLng(lat, lng);
    const proj = map.getProjection();
    const markerPt = proj.pointFromCoords(markerLatLng);
    const targetPt = new window.kakao.maps.Point(markerPt.x, markerPt.y + sheetH / 2);
    const targetLatLng = proj.coordsFromPoint(targetPt);
    map.panTo(targetLatLng);
  }, [detailId, sheetSnap, map]);

  useEffect(() => {
    if (!map || !window.kakao?.maps) return;
    const clearPlaceFocus = () => {
      const store = useMapStore.getState();
      store.setSelectedId(null);
      store.setHoveredId(null);
      store.setDetailId(null);
    };
    window.kakao.maps.event.addListener(map, 'click', clearPlaceFocus);
    return () => {
      window.kakao?.maps?.event?.removeListener(map, 'click', clearPlaceFocus);
    };
  }, [map]);

  const moveTo = (target: LatLng, targetLevel = 3, accuracy?: number) => {
    const currentMap = useMapStore.getState().map;
    if (!currentMap || !window.kakao?.maps) return;
    const latLng = new window.kakao.maps.LatLng(target.lat, target.lng);


    currentMap.setLevel(targetLevel, { animate: true });
    currentMap.setCenter(latLng);


    const buildOniPinElement = () => {
      const isApple = isAppleOrSafari();
      const el = document.createElement('div');
      el.className = 'om-my-location-pin';
      el.innerHTML = `
        <div class="om-my-location-bubble">
          <span>내 위치 </span>
        </div>
        <div class="om-my-location-oni-wrap">
          ${
            isApple
              ? '<img src="/images/character/Oni_hi.png" alt="" class="om-my-location-oni-video" />'
              : `<video autoplay loop muted playsinline preload="auto" class="om-my-location-oni-video">
                  <source src="/videos/Oni_hi.webm" type="video/webm" />
                </video>`
          }
        </div>
        <div class="om-my-location-ground-shadow"></div>
      `;
      el.addEventListener('click', () => {
        currentMap.setLevel(3, { animate: true });
        // Use live position from ref so click always pans to current location
        const livePos = myLocationOverlayRef.current?.getPosition() ?? latLng;
        currentMap.panTo(livePos);
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
    // Only show overlay if current zoom level is close enough
    const currentLevel = currentLevelRef.current;
    if (currentLevel < MY_LOCATION_HIDE_LEVEL) {
      myLocationOverlayRef.current.setMap(currentMap);
    }

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
        strokeColor: palette.cheongrok[500],
        strokeOpacity: 0.35,
        fillColor: palette.cheongrok[500],
        fillOpacity: 0.08,
      });
    }

    const store = useMapStore.getState();
    store.setUserLocation(target);
    store.setCenter(target, targetLevel);
    store.commitViewportSearch(snapshotFromMap(currentMap, { center: target, level: targetLevel }));

    startLocationWatch();
  };

  // ── Continuous location tracking ─────────────────────────────────────────────
  const startLocationWatch = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!window.kakao?.maps) return;
        const newLatLng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        if (myLocationOverlayRef.current) {
          myLocationOverlayRef.current.setPosition(newLatLng);
        }
        if (myLocationCircleRef.current) {
          const oldCircle = myLocationCircleRef.current;
          if (typeof oldCircle.setPosition === 'function') {
            oldCircle.setPosition(newLatLng);
          } else {
            const radius = oldCircle.getRadius?.() ?? 60;
            oldCircle.setMap(null);
            const m = useMapStore.getState().map;
            if (m) {
              myLocationCircleRef.current = new window.kakao.maps.Circle({
                map: m,
                center: newLatLng,
                radius,
                strokeWeight: 1,
                strokeColor: palette.cheongrok[500],
                strokeOpacity: 0.35,
                fillColor: palette.cheongrok[500],
                fillOpacity: 0.08,
              });
            } else {
              myLocationCircleRef.current = null;
            }
          }
        }
        useMapStore.getState().setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED && watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
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


  // ── Modal handlers ──────────────────────────────────────────────────────────
  const handleLocationAllow = () => {
    setShowLocationModal(false);
    doAutoLocate();
  };

  const handleLocationDeny = () => {
    setShowLocationModal(false);
  };

  return (
    <Frame>
      <Global styles={mapGlobalStyles} />
      <Script
        key={sdkAttempt}
        strategy="afterInteractive"
        src={sdkAttempt === 0 ? KAKAO_SDK_SRC : `${KAKAO_SDK_SRC}&omRetry=${sdkAttempt}`}
        onReady={handleSdkLoad}
        onError={handleSdkError}
      />

      {/* Location Permission Modal */}
      {showLocationModal && (
        <ModalBackdrop
          role="dialog"
          aria-modal="true"
          aria-labelledby="loc-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleLocationDeny(); }}
        >
          <ModalCard>
            <ModalEmoji>📍</ModalEmoji>
            <ModalTitle id="loc-modal-title">내 주변 한옥을 찾아드릴게요</ModalTitle>
            <ModalDesc>
              현재 위치를 이용하면 가까운 한옥 숙소·명소를<br />
              바로 지도에서 확인할 수 있어요.
            </ModalDesc>
            <ModalButtonRow>
              <ModalDenyBtn type="button" onClick={handleLocationDeny}>
                나중에
              </ModalDenyBtn>
              <ModalAllowBtn type="button" onClick={handleLocationAllow}>
                내 위치 허용하기
              </ModalAllowBtn>
            </ModalButtonRow>
          </ModalCard>
        </ModalBackdrop>
      )}

      <Canvas
        ref={containerRef}
        role="application"
        aria-label="한옥 위치 지도"
        $isNight={isEffectiveNight}
      />
      <WarmTint $active={!isEffectiveNight} aria-hidden="true" />

      {mapLoadError && mapErrorCopy && (
        <MapFailureOverlay>
          <OniSearchEmpty
            size="md"
            compact
            role="alert"
            videoSrc=""
            imageSrc="/images/character/Oni_server_error.png"
            title="지도를 지금 불러올 수 없어요"
            description={mapErrorCopy.description}
            action={(
              <MapRetryButton type="button" onClick={retryMapLoad}>
                <HugeiconsIcon icon={RotateCcwIcon} size={15} aria-hidden="true" />
                지도 다시 불러오기
              </MapRetryButton>
            )}
          />
        </MapFailureOverlay>
      )}

      {isSearchDirty && (
        <Research
          type="button"
          onClick={() => {
            const store = useMapStore.getState();
            if (store.map) store.commitViewportSearch(snapshotFromMap(store.map));
          }}
        >
          <HugeiconsIcon icon={RotateCcwIcon} size={16} strokeWidth={2} aria-hidden />
          이 지역 재검색
        </Research>
      )}

      {/* 소고 춤 로딩 오버레이 — Controls 바깥에 포지셔닝 (Frame 직소) */}
      {isLocating && (
        <LocatingOverlay aria-live="polite" aria-label="현재 위치 찾는 중">
          <SogoBubble>
            <span>📍</span>
            <span>위치 찾는 중...</span>
          </SogoBubble>
          <SogoOniWrap>
            <SogoImg
              src="/images/character/Oni_loading.png"
              alt="위치를 찾고 있는 온니"
              draggable={false}
            />
          </SogoOniWrap>
        </LocatingOverlay>
      )}

      <Controls>
        <Stack>
          <ControlButton
            type="button"
            aria-label="현위치로 이동"
            onClick={locate}
            $active={isLocating}
            title="내 현재 위치로 이동"
          >
            <HugeiconsIcon icon={LocateFixedIcon} size={18} strokeWidth={2} />
          </ControlButton>
        </Stack>

        {}
        <Stack>
          <ControlButton type="button" aria-label="확대" onClick={() => zoom(-1)}>
            <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={2} />
          </ControlButton>
          <ControlButton type="button" aria-label="축소" onClick={() => zoom(1)}>
            <HugeiconsIcon icon={MinusSignIcon} size={18} strokeWidth={2} />
          </ControlButton>
        </Stack>
      </Controls>
    </Frame>
  );
}
