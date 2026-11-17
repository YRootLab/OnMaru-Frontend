'use client';

import React, { useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { surface } from '@/design-system/tokens';

import JourneyHeroSearch from './JourneyHeroSearch';
import JourneyDiscoveryFeed from './JourneyDiscoveryFeed';
import JourneyAssemblyLoader from './JourneyAssemblyLoader';
import HomeBrandAurora from './HomeBrandAurora';
import JourneyChatPage from '../presentation/JourneyChatPage';
import { shouldShowJourneyConversation } from './homeConversationMode';

function readExplorationId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('exploration');
}

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
`;

export default function JourneyHome() {
  const [explorationId, setExplorationId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const moodChipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncFromUrl = () => setExplorationId(readExplorationId());
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const isConversationMode = shouldShowJourneyConversation({
    requested: false,
    explorationId,
  });

  if (isConversationMode) {
    return <JourneyChatPage />;
  }

  return (
    <MainWrapper ref={mainRef}>
      <JourneyAssemblyLoader />
      <HomeBrandAurora />

      <Landing $centered>
        <JourneyHeroSearch searchFormRef={searchFormRef} moodChipsRef={moodChipsRef} />
      </Landing>

      <ContentLayer>
        <JourneyDiscoveryFeed />
      </ContentLayer>
    </MainWrapper>
  );
}
