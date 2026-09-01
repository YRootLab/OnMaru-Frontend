'use client';

import { useEffect } from 'react';
import styled from '@emotion/styled';
import { useMapStore } from '../hooks/useMapStore';
import PlaceDetail from './PlaceDetail';
import PopularPlacesPanel from './warmth/PopularPlacesPanel';

const PANEL_WIDTH = 380;
const PANEL_WIDTH_COMPACT = 360;

/* ── 호갱노노 스타일: 리스트 우측에 둥글게 떠 있는 상세 정보 / 인기 장소 랭킹 플로팅 카드 ── */
const DetailAside = styled.aside<{ $open: boolean }>`
  position: relative;
  flex: none;
  width: ${({ $open }) => ($open ? `${PANEL_WIDTH}px` : '0px')};
  height: 100%;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 32px rgba(25, 31, 40, 0.12);
  z-index: 22;
  pointer-events: auto;
  overflow: hidden;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-16px)')};
  transition:
    width 0.28s cubic-bezier(0.32, 0.72, 0, 1),
    transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.28s cubic-bezier(0.32, 0.72, 0, 1);

  @media (min-width: 1024px) and (max-width: 1439px) {
    width: ${({ $open }) => ($open ? `${PANEL_WIDTH_COMPACT}px` : '0px')};
  }

  @media (max-width: 1023px) {
    display: none;
  }
`;

const Inner = styled.div`
  width: ${PANEL_WIDTH}px;
  height: 100%;
  overflow: hidden;

  @media (min-width: 1024px) and (max-width: 1439px) {
    width: ${PANEL_WIDTH_COMPACT}px;
  }
`;

export default function DetailPanel() {
  const map = useMapStore((s) => s.map);
  const detailId = useMapStore((s) => s.detailId);
  const popularPanelOpen = useMapStore((s) => s.popularPanelOpen);

  const isOpen = Boolean(detailId) || popularPanelOpen;

  // 패널이 열리거나 닫힌 후 카카오맵 뷰포트 relayout 재계산
  useEffect(() => {
    const timer = setTimeout(() => {
      if (map && window.kakao?.maps) {
        map.relayout();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, map]);

  return (
    <DetailAside $open={isOpen} aria-hidden={!isOpen}>
      <Inner>
        {popularPanelOpen ? (
          <PopularPlacesPanel />
        ) : detailId ? (
          <PlaceDetail />
        ) : null}
      </Inner>
    </DetailAside>
  );
}
