'use client';

import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { surface } from '@/design-system/tokens';

import { useJourneyStore } from '../store/useJourneyStore';
import JourneyHeroSearch from './JourneyHeroSearch';
import JourneyDiscoveryFeed from './JourneyDiscoveryFeed';
import JourneyFlowRailSection from './JourneyFlowRailSection';
import JourneyEnrichmentSections from './JourneyEnrichmentSections';
import JourneyAssemblyLoader from './JourneyAssemblyLoader';
import HomeBrandAurora from './HomeBrandAurora';

const MainWrapper = styled.main`
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background-color: ${surface.light.card};
  transition: background-color 0.3s ease;

  [data-theme='dark'] & {
    background-color: ${surface.dark.app};
  }
`;

const Landing = styled.div<{ $centered: boolean }>`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  ${({ $centered }) =>
    $centered
      ? `
    min-height: 74vh;
    justify-content: center;
    padding-top: 40px;
    padding-bottom: 24px;
  `
      : `
    padding-top: 80px;
    padding-bottom: 12px;
  `}

  @media (max-width: 767px) {
    min-height: 0;
    justify-content: flex-start;
    padding-top: ${({ $centered }) => ($centered ? '32px' : '72px')};
    padding-bottom: 0;
  }
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  background-color: ${surface.light.card};

  [data-theme='dark'] & {
    background-color: ${surface.dark.app};
  }
`;

export default function JourneyHome() {
  const hasSearched = useJourneyStore((s) => s.hasSearched);
  const mainRef = useRef<HTMLElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const moodChipsRef = useRef<HTMLDivElement>(null);

  return (
    <MainWrapper ref={mainRef}>
      <JourneyAssemblyLoader />
      <HomeBrandAurora />

      <Landing $centered={!hasSearched}>
        <JourneyHeroSearch searchFormRef={searchFormRef} moodChipsRef={moodChipsRef} />
      </Landing>

      {!hasSearched && (
        <ContentLayer>
          <JourneyDiscoveryFeed />
        </ContentLayer>
      )}

      {hasSearched && (
        <ContentLayer>
          <JourneyFlowRailSection />
          <JourneyEnrichmentSections />
        </ContentLayer>
      )}
    </MainWrapper>
  );
}
