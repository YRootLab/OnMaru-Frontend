'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon, Cancel01Icon, UserMultiple02Icon, Login01Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { useSelf } from '@liveblocks/react';
import { useAuth } from '@/features/auth';
import { useMapStore } from '../hooks/useMapStore';
import { useCollabPins } from './useCollabPins';
import { ringShadow, palette } from '@/design-system/tokens';
import { escapeHtml } from '../utils/formatters';
import { mapIconSvg } from '../utils/mapIconSvg';
import type { CollabPin } from './liveblocks.config';

const USER_COLORS = [
  palette.kobalt[500],
  palette.danpung[500],
  palette.juhong[500],
  palette.jaha[500],
  palette.cheongrok[600],
  palette.jangmi[500],
] as const;

function colorForUser(userId: string) {
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return USER_COLORS[hash % USER_COLORS.length];
}

const PLACE_NAME_MAX = 80;

function isValidPin(pin: CollabPin): boolean {
  return (
    typeof pin.placeId === 'string' && pin.placeId.length > 0 &&
    typeof pin.placeName === 'string' && pin.placeName.length > 0 && pin.placeName.length <= PLACE_NAME_MAX &&
    typeof pin.userId === 'string' && pin.userId.length > 0 &&
    Number.isFinite(pin.lat) && pin.lat >= -90 && pin.lat <= 90 &&
    Number.isFinite(pin.lng) && pin.lng >= -180 && pin.lng <= 180
  );
}

function buildPinEl(pin: CollabPin): HTMLElement {
  const color = colorForUser(pin.userId);
  const pinIcon = mapIconSvg('mapPin', 14);
  const el = document.createElement('div');
  el.style.cssText = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: default;
    user-select: none;
    pointer-events: auto;
  `;
  el.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 4px;
      background: ${color};
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px 4px 6px;
      border-radius: 10px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      max-width: 130px;
      overflow: hidden;
      text-overflow: ellipsis;
    ">${pinIcon}<span style="overflow:hidden;text-overflow:ellipsis">${escapeHtml(pin.placeName)}</span></div>
    <div style="
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid ${color};
    "></div>
  `;
  el.title = escapeHtml(pin.placeName);
  return el;
}

const PinBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 8px 10px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  backdrop-filter: blur(12px);
  box-shadow: ${ringShadow.light.card};
  pointer-events: auto;
  white-space: nowrap;
  transition: transform 0.15s ease;

  &:hover { transform: scale(1.04); }
  &:active { transform: scale(0.96); }

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.card};
  }
`;

const RemoveBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 8px 10px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  backdrop-filter: blur(12px);
  box-shadow: ${ringShadow.light.card};
  pointer-events: auto;
  white-space: nowrap;
  transition: transform 0.15s ease;

  &:hover { transform: scale(1.04); }
  &:active { transform: scale(0.96); }
`;

const ActionRow = styled.div`
  position: absolute;
  bottom: calc(max(12px, env(safe-area-inset-bottom)) + 58px + 8px);
  right: 14px;
  display: flex;
  gap: 8px;
  z-index: 40;
  pointer-events: none;

  @media (min-width: 1024px) {
    bottom: 14px;
    right: calc(14px + 68px + 14px);
  }
`;

export function CollabPinsOverlay() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const items = useMapStore((s) => s.items);
  const viewportItems = useMapStore((s) => s.viewportItems);
  const detailId = useMapStore((s) => s.detailId);
  const me = useSelf();
  const { isLoggedIn, loginWithKakao } = useAuth();
  const { pins, addPin, removePin } = useCollabPins();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);
  const prevPinKeysRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Sync Liveblocks pins → Kakao CustomOverlay instances + Polyline
  useEffect(() => {
    if (!map || !pins) return;

    if (mode !== 'info') {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current.clear();
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
      return;
    }

    const nextIds = new Set(pins.map((p) => `${p.placeId}-${p.userId}`));

    // Remove stale overlays
    overlaysRef.current.forEach((overlay, key) => {
      if (!nextIds.has(key)) {
        overlay.setMap(null);
        overlaysRef.current.delete(key);
      }
    });

    // Add new overlays — validate each pin before rendering (untrusted shared state)
    pins.forEach((pin) => {
      if (!isValidPin(pin)) return;

      const key = `${pin.placeId}-${pin.userId}`;
      if (overlaysRef.current.has(key)) return;

      try {
        const el = buildPinEl(pin);
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(pin.lat, pin.lng),
          content: el,
          yAnchor: 1.0,
          zIndex: 50,
        });
        overlay.setMap(map);
        overlaysRef.current.set(key, overlay);
      } catch {
        // Malformed pin — skip silently
      }
    });

    // Draw polyline connecting all pins when 2+
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    const validPins = pins.filter(isValidPin);
    if (validPins.length >= 2) {
      try {
        const path = validPins.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng));
        const polyline = new window.kakao.maps.Polyline({
          path,
          strokeWeight: 2,
          strokeColor: '#4B8BFF',
          strokeOpacity: 0.6,
          strokeStyle: 'dash',
        });
        polyline.setMap(map);
        polylineRef.current = polyline;
      } catch { /* kakao not ready */ }
    }
  }, [map, pins, mode]);

  // Notify other participants when someone adds a new pin
  useEffect(() => {
    if (pins === null) return;

    const myUserId = me?.presence?.userId ?? 'guest';
    const currentKeys = new Set(pins.map((p) => `${p.placeId}-${p.userId}`));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevPinKeysRef.current = currentKeys;
      return;
    }

    for (const pin of pins) {
      const key = `${pin.placeId}-${pin.userId}`;
      if (!prevPinKeysRef.current.has(key) && pin.userId !== myUserId && isValidPin(pin)) {
        toast(pin.placeName, {
          icon: <HugeiconsIcon icon={UserMultiple02Icon} size={16} strokeWidth={1.8} />,
          description: '함께하는 친구가 핀을 찍었어요!',
          duration: 3000,
        });
      }
    }

    prevPinKeysRef.current = currentKeys;
  }, [pins, me?.presence?.userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current.clear();
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    };
  }, []);

  if (!map || mode !== 'info') return null;

  // Find selected place from both items (non-info) and viewportItems (info mode)
  const selectedPlace = detailId ? (() => {
    const fromItems = items.find((i) => i.id === detailId);
    if (fromItems) return fromItems;

    const vp = viewportItems.find((v) => v.type === 'PLACE' && v.placeId === detailId);
    if (vp && vp.placeId && vp.name) {
      return { id: vp.placeId, name: vp.name, lat: vp.center.lat, lng: vp.center.lng };
    }
    return null;
  })() : null;

  const myUserId = me?.presence?.userId ?? 'guest';
  const alreadyPinned = selectedPlace
    ? (pins ?? []).some((p) => p.placeId === selectedPlace.id && p.userId === myUserId)
    : false;

  function handleAddPin() {
    if (!selectedPlace) return;
    if (pins === null) return; // storage not yet loaded
    if (!isLoggedIn) {
      toast('로그인이 필요해요', {
        icon: <HugeiconsIcon icon={Login01Icon} size={16} strokeWidth={1.8} />,
        description: '핀 공유는 로그인 후 사용할 수 있어요.',
        duration: 5000,
        action: { label: '로그인하기', onClick: loginWithKakao },
      });
      return;
    }
    const pin: CollabPin = {
      placeId: selectedPlace.id,
      placeName: selectedPlace.name,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      userId: myUserId,
    };
    addPin(pin);
    toast.success(`'${selectedPlace.name}' 핀을 공유했어요!`, {
      icon: <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={1.8} />,
    });
  }

  function handleRemovePin() {
    if (!selectedPlace) return;
    if (pins === null) return;
    removePin(selectedPlace.id);
    toast.info(`핀을 제거했어요.`, {
      icon: <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />,
    });
  }

  if (!selectedPlace) return null;

  return (
    <ActionRow>
      {alreadyPinned ? (
        <RemoveBtn type="button" onClick={handleRemovePin}>
          <HugeiconsIcon icon={Location01Icon} size={15} strokeWidth={2} />
          핀 취소
        </RemoveBtn>
      ) : (
        <PinBtn type="button" onClick={handleAddPin}>
          <HugeiconsIcon icon={Location01Icon} size={15} strokeWidth={2} />
          친구와 핀 공유
        </PinBtn>
      )}
    </ActionRow>
  );
}
