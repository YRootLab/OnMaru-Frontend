'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { meok } from '@/design-system/tokens';
import { DEFAULT_CENTER, useMapStore } from '@/map/hooks/useMapStore';
import type { LatLng } from '@/map/types';

const NEARBY = 'nearby';

/** 데이터가 붙기 전까지의 하드코딩 좌표. */
const REGIONS: { id: string; label: string; center?: LatLng }[] = [
  { id: NEARBY, label: '내 주변' },
  { id: 'jeonju', label: '전주', center: { lat: 35.815, lng: 127.153 } },
  { id: 'andong', label: '안동', center: { lat: 36.5388, lng: 128.8046 } },
  { id: 'gyeongju', label: '경주', center: { lat: 35.8356, lng: 129.2194 } },
  { id: 'damyang', label: '담양', center: { lat: 35.3213, lng: 126.9881 } },
  { id: 'asan', label: '아산', center: { lat: 36.7898, lng: 127.0018 } },
  { id: 'jeju', label: '제주', center: { lat: 33.4996, lng: 126.5312 } },
];

const Scroller = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Chip = styled.button<{ $active: boolean }>`
  flex: none;
  height: 32px;
  padding: 0 12px;

  border-radius: 9999px;
  background: ${({ $active }) => ($active ? meok[900] : 'transparent')};
  color: ${({ $active }) => ($active ? '#FFFFFF' : meok[700])};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease-out, color 0.2s ease-out;

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: 2px;
  }
`;

export default function RegionChips() {
  const [active, setActive] = useState<string | null>(null);
  const map = useMapStore((s) => s.map);

  const panTo = (center: LatLng) => {
    map?.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
    useMapStore.getState().setCenter(center);
    useMapStore.getState().clearSearchDirty();
  };

  const select = (id: string, center?: LatLng) => {
    setActive(id);
    if (center) {
      panTo(center);
      return;
    }
    // 내 주변 — 거부되거나 실패하면 전주로 폴백한다.
    if (!navigator.geolocation) {
      panTo(DEFAULT_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => panTo({ lat: coords.latitude, lng: coords.longitude }),
      () => panTo(DEFAULT_CENTER),
    );
  };

  return (
    <Scroller role="group" aria-label="지역 바로가기">
      {REGIONS.map(({ id, label, center }) => (
        <Chip
          key={id}
          type="button"
          aria-pressed={active === id}
          $active={active === id}
          onClick={() => select(id, center)}
        >
          {label}
        </Chip>
      ))}
    </Scroller>
  );
}
