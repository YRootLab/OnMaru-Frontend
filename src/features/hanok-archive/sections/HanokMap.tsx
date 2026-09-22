'use client';

import React from 'react';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import { meok, surface , fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import type { Village } from '@/features/hanok-archive/types';
import { useViewportActivation } from '@/shared/hooks/useViewportActivation';


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
  min-height: clamp(360px, 60vh, 580px);
  background: #ffffff;
  border-radius: 28px;
  display: grid;
  place-items: center;
  color: ${meok[500]};
  font-size: ${fontSize.sm};

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    color: ${meok[400]};
  }
`;





const MapWrapper = styled.div`
  position: relative;
  height: clamp(360px, 60vh, 580px);
  border-radius: 28px;
  overflow: hidden;
`;

interface HanokMapProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

export default function HanokMap({ villages, onSelectVillage }: HanokMapProps) {
  const { ref: mapViewportRef, isActive: isMapActive } = useViewportActivation<HTMLDivElement>({
    rootMargin: '800px 0px',
  });

  return (
    <Section id="map" aria-labelledby="map-heading">
      <SectionHeader
        id="map-heading"
        title="어디 있는지 한눈에"
        actionLabel="전체 지도 열기 ↗"
        actionHref="/map"
      />

      <MapWrapper ref={mapViewportRef}>
        {isMapActive ? (
          <HanokInteractiveMapFrame villages={villages} onSelectVillage={onSelectVillage} />
        ) : (
          <MapLoadingState>지도를 불러오는 중</MapLoadingState>
        )}
      </MapWrapper>
    </Section>
  );
}
