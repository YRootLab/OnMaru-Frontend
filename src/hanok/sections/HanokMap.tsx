'use client';

import React from 'react';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import { meok } from '@/design-system/tokens';
import SectionHeader from '@/hanok/components/SectionHeader';
import type { Village } from '@/hanok/types';

// Dynamic import for Leaflet map component (client side only)
const HanokInteractiveMapFrame = dynamic(() => import('./HanokInteractiveMapFrame'), {
  ssr: false,
  loading: () => (
    <MapLoadingState>
      지도를 불러오는 중입니다...
    </MapLoadingState>
  ),
});

const Section = styled.section``;

const MapLoadingState = styled.div`
  min-height: 580px;
  background: rgba(247, 241, 230, 0.5);
  border: 1px solid rgba(78, 89, 104, 0.12);
  border-radius: 28px;
  display: grid;
  place-items: center;
  color: ${meok[500]};
  font-size: 14px;
`;

const MapWrapper = styled.div`
  position: relative;
  height: 580px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: none;
`;

interface HanokMapProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

export default function HanokMap({ villages, onSelectVillage }: HanokMapProps) {
  return (
    <Section id="map" aria-labelledby="map-heading">
      <SectionHeader
        id="map-heading"
        title="전국 전통 한옥 시공간 지도 인터랙션"
        subtitle="지역 선택에 따라 좌측에 펼쳐지는 한옥 스토리와 대표 유산 큐레이션"
        actionLabel="전체 정보지도 열기 ↗"
        actionHref="/map"
      />

      <MapWrapper>
        <HanokInteractiveMapFrame villages={villages} onSelectVillage={onSelectVillage} />
      </MapWrapper>
    </Section>
  );
}
