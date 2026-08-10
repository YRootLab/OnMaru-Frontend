'use client';

import React from 'react';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import { meok } from '@/design-system/tokens';
import SectionHeader from '@/hanok/components/SectionHeader';
import type { Village } from '@/hanok/types';

// Dynamic import for Kakao map component (client side only)
const HanokInteractiveMapFrame = dynamic(() => import('./HanokInteractiveMapFrame'), {
  ssr: false,
  loading: () => (
    <MapLoadingState>
      지도를 불러오는 중
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
        title="전국 지도"
        subtitle="지역을 선택하면 그곳의 한옥 이야기와 대표 유산을 보여드립니다"
        actionLabel="전체 지도 열기 ↗"
        actionHref="/map"
      />

      <MapWrapper>
        <HanokInteractiveMapFrame villages={villages} onSelectVillage={onSelectVillage} />
      </MapWrapper>
    </Section>
  );
}
