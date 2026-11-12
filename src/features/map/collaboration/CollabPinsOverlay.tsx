'use client';

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon, Cancel01Icon, UserMultiple02Icon, Login01Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { useMapStore } from '../hooks/useMapStore';
import { useCollab } from './MapCollabProvider';
import { ringShadow, palette } from '@/design-system/tokens';
import { escapeHtml } from '../utils/formatters';
import { mapIconSvg } from '../utils/mapIconSvg';
import type { CollabPin } from './types';

const USER_COLORS = [
  palette.kobalt[500],
  palette.danpung[500],
  palette.juhong[500],
  palette.jaha[500],
  palette.cheongrok[600],
  palette.jangmi[500],
] as const;

function colorForUser(memberId: string) {
  let hash = 0;
  for (const ch of memberId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return USER_COLORS[hash % USER_COLORS.length];
}

function buildPinEl(pin: CollabPin): HTMLElement {
  const color = colorForUser(pin.addedBy);
  const pinIcon = mapIconSvg('mapPin', 14);
  const el = document.createElement('div');
  el.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center; cursor: default; user-select: none; pointer-events: auto;';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:4px;background:${color};color:white;font-size:11px;font-weight:700;padding:4px 8px 4px 6px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);max-width:130px;overflow:hidden;text-overflow:ellipsis;">
      ${pinIcon}<span style="overflow:hidden;text-overflow:ellipsis">${escapeHtml(pin.placeName)}</span>
    </div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};"></div>
  `;
  el.title = escapeHtml(pin.placeName);
  return el;
}

const PinBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 8px 14px 8px 10px;
  border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 600;
  background: rgba(59, 130, 246, 0.9); color: white;
  backdrop-filter: blur(12px); box-shadow: ${ringShadow.light.card};
  pointer-events: auto; white-space: nowrap; transition: transform 0.15s ease;
  &:hover { transform: scale(1.04); } &:active { transform: scale(0.96); }
  [data-theme='dark'] & { box-shadow: ${ringShadow.dark.card}; }
`;

const RemoveBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 8px 14px 8px 10px;
  border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 600;
  background: rgba(239, 68, 68, 0.9); color: white;
  backdrop-filter: blur(12px); box-shadow: ${ringShadow.light.card};
  pointer-events: auto; white-space: nowrap; transition: transform 0.15s ease;
  &:hover { transform: scale(1.04); } &:active { transform: scale(0.96); }
`;

const ActionRow = styled.div`
  position: absolute;
  bottom: calc(max(12px, env(safe-area-inset-bottom)) + 58px + 8px);
  right: 14px; display: flex; gap: 8px; z-index: 40; pointer-events: none;
  @media (min-width: 1024px) { bottom: 14px; right: calc(14px + 68px + 14px); }
`;

export function CollabPinsOverlay() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const items = useMapStore((s) => s.items);
  const viewportItems = useMapStore((s) => s.viewportItems);
  const detailId = useMapStore((s) => s.detailId);
  const { isLoggedIn, loginWithKakao } = useAuth();
  const ctx = useCollab();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);
  const prevPinIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const pins = ctx?.pins ?? null;
  const myMemberId = ctx?.myMemberId ?? null;

  // Sync pins → Kakao CustomOverlay + Polyline
  useEffect(() => {
    if (!map || !pins) return;

    if (mode !== 'info') {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current.clear();
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
      return;
    }

    const nextIds = new Set(pins.map((p) => p.pinId));

    overlaysRef.current.forEach((overlay, key) => {
      if (!nextIds.has(key)) {
        overlay.setMap(null);
        overlaysRef.current.delete(key);
      }
    });

    pins.forEach((pin) => {
      if (overlaysRef.current.has(pin.pinId)) return;
      try {
        const el = buildPinEl(pin);
        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(pin.lat, pin.lng),
          content: el,
          yAnchor: 1.0,
          zIndex: 50,
        });
        overlay.setMap(map);
        overlaysRef.current.set(pin.pinId, overlay);
      } catch { /* skip malformed */ }
    });

    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    if (pins.length >= 2) {
      try {
        const path = pins.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng));
        const polyline = new window.kakao.maps.Polyline({ path, strokeWeight: 2, strokeColor: '#4B8BFF', strokeOpacity: 0.6, strokeStyle: 'dash' });
        polyline.setMap(map);
        polylineRef.current = polyline;
      } catch { /* kakao not ready */ }
    }
  }, [map, pins, mode]);

  // 다른 멤버가 핀 찍었을 때 toast
  useEffect(() => {
    if (!pins) return;
    const currentIds = new Set(pins.map((p) => p.pinId));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevPinIdsRef.current = currentIds;
      return;
    }

    for (const pin of pins) {
      if (!prevPinIdsRef.current.has(pin.pinId) && pin.addedBy !== myMemberId) {
        toast(pin.placeName, {
          icon: <HugeiconsIcon icon={UserMultiple02Icon} size={16} strokeWidth={1.8} />,
          description: '함께하는 친구가 핀을 찍었어요!',
          duration: 3000,
        });
      }
    }
    prevPinIdsRef.current = currentIds;
  }, [pins, myMemberId]);

  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current.clear();
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    };
  }, []);

  if (!map || mode !== 'info') return null;

  const selectedPlace = detailId ? (() => {
    const fromItems = items.find((i) => i.id === detailId);
    if (fromItems) return fromItems;
    const vp = viewportItems.find((v) => v.type === 'PLACE' && v.placeId === detailId);
    if (vp?.placeId && vp?.name) return { id: vp.placeId, name: vp.name, lat: vp.center.lat, lng: vp.center.lng };
    return null;
  })() : null;

  // 이슈 계약: 같은 placeId의 활성 핀은 방에 하나만 존재 (addedBy 무관)
  const existingPin = selectedPlace && pins
    ? pins.find((p) => p.placeId === selectedPlace.id)
    : null;

  function handleAddPin() {
    if (!selectedPlace || !ctx) return;
    if (!isLoggedIn) {
      toast('로그인이 필요해요', {
        icon: <HugeiconsIcon icon={Login01Icon} size={16} strokeWidth={1.8} />,
        description: '핀 공유는 로그인 후 사용할 수 있어요.',
        duration: 5000,
        action: { label: '로그인하기', onClick: loginWithKakao },
      });
      return;
    }
    ctx.addPin(selectedPlace.id);
    toast.success(`'${selectedPlace.name}' 핀을 공유했어요!`, {
      icon: <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={1.8} />,
    });
  }

  function handleRemovePin() {
    if (!existingPin || !ctx) return;
    ctx.removePin(existingPin.pinId);
    toast.info('핀을 제거했어요.', {
      icon: <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />,
    });
  }

  if (!selectedPlace) return null;

  return (
    <ActionRow>
      {existingPin ? (
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
