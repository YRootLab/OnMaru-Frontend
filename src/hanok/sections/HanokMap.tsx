'use client';

import React from 'react';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import { meok } from '@/design-system/tokens';
import SectionHeader from '@/hanok/components/SectionHeader';
import type { Village } from '@/hanok/types';
import { useViewportActivation } from '@/shared/hooks/useViewportActivation';

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

/* 프레임과 같은 높이여야 지도가 뜨는 순간 아래 내용이 튀지 않는다. */
const MapLoadingState = styled.div`
  min-height: clamp(360px, 60vh, 580px);
  background: #ffffff;
  border-radius: 28px;
  display: grid;
  place-items: center;
  color: ${meok[500]};
  font-size: 14px;
`;

/*
  580px 고정이었다. 375×667 기기에서 지도 하나가 뷰포트의 87%를 먹어, 스크롤을 해도
  지도만 보이는 구간이 길었다. 큰 화면에서는 그대로 두고 작은 화면에서만 줄인다.
*/
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
        title="전국 지도"
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
