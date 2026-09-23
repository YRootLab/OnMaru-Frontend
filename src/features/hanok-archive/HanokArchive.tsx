'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, surface, fontSize } from '@/design-system/tokens';
import HanokGrid from '@/features/hanok-archive/sections/HanokGrid';
import HanokStayAccordion from '@/features/hanok-archive/sections/HanokStayAccordion';
import HanokMap from '@/features/hanok-archive/sections/HanokMap';
import HanokPolaroidClothesline from '@/features/hanok-archive/sections/HanokPolaroidClothesline';
import HanokSideIndex from '@/features/hanok-archive/components/HanokSideIndex';
import KCultureThemeFeed from '@/features/hanok-archive/components/KCultureThemeFeed';
import HanokManifestoCta from '@/features/hanok-archive/sections/HanokManifestoCta';
import HanokStructureCards from '@/features/hanok-archive/structure/HanokStructureCards';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { useArchiveData } from '@/features/hanok-archive/hooks/useArchiveData';
import { HANOK_REVEAL_SECTIONS } from '@/features/hanok-archive/hanokSectionReveal';
import type { HanokFilterState } from '@/features/hanok-archive/sections/hanokFilterQuery';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import { HanjiDeckleEdge } from '@/shared/components/HanjiDeckleEdge';
import { HanokAtmosphereBackground } from '@/shared/components/HanokBackground';

const loadDogamDetailModal = () => import('@/features/hanok-archive/components/HanokDogamDetailModal');
const HanokDogamDetailModal = dynamic(loadDogamDetailModal, { ssr: false });

const loadStayDetailModal = () => import('@/features/hanok-archive/components/HanokStayDetailModal');
const HanokStayDetailModal = dynamic(loadStayDetailModal, { ssr: false });


function scheduleIdle(callback: () => void, timeout = 2000): () => void {
  const browserWindow = window as Window & {
    requestIdleCallback?: (cb: () => void, options: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (browserWindow.requestIdleCallback) {
    const idleId = browserWindow.requestIdleCallback(callback, { timeout });
    return () => browserWindow.cancelIdleCallback?.(idleId);
  }
  const timeoutId = window.setTimeout(callback, Math.min(timeout, 600));
  return () => window.clearTimeout(timeoutId);
}

const Root = styled.div`
  min-height: 100dvh;
  font-family: var(--font-hanok);
  color: ${meok[900]};
  background: transparent;

  [data-theme='dark'] & {
    color: ${meok[100]};
    background: transparent;
  }
`;

const PageInner = styled.div`
  width: 100%;
  margin: 0;
  padding-top: 76px;
  padding-bottom: clamp(64px, 8vh, 120px);

  @media (max-width: 767px) {
    padding-top: 20px;
  }
`;

const SectionContainer = styled.div`
  margin: 0 auto;
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  padding: clamp(28px, 4vw, 48px) 0;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    padding: clamp(24px, 4vw, 40px) 0;
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    padding: clamp(20px, 4vw, 32px) 0;
  }
`;

const KCultureSectionContainer = styled(SectionContainer)`
  padding-top: clamp(14px, 2vw, 24px);
  padding-bottom: clamp(14px, 2vw, 24px);

  @media (max-width: 1024px) {
    padding-top: clamp(12px, 2vw, 20px);
    padding-bottom: clamp(12px, 2vw, 20px);
  }

  @media (max-width: 640px) {
    padding-top: clamp(10px, 2vw, 16px);
    padding-bottom: clamp(10px, 2vw, 16px);
  }
`;

const StyledVesselReveal = styled(VesselReveal)`
  width: 100%;
`;


const paperGround = css`
  body {
    background: #ffffff;
  }

  [data-theme='dark'] body,
  html[data-theme='dark'],
  html[data-theme='dark'] body {
    background: ${surface.dark.app} !important;
  }
`;




const EditorialSection = styled.div`
  padding-top: clamp(32px, 3.5vh, 46px);
`;


const ChapterBreak = styled.div`
  padding-top: clamp(80px, 9vh, 124px);
`;


const ArchiveSection = styled.div`
  padding-top: clamp(64px, 7vh, 92px);
`;

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  border-radius: 24px;
  min-height: clamp(220px, 24vh, 280px);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    margin: 0 auto;
    border-radius: 18px;
    min-height: 240px;
  }
`;

const IntroContent = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding: clamp(24px, 4vh, 40px) 0;
`;

const Intro = styled.header`
  width: 100%;
  text-align: left;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;


const HeroClothesline = styled.div`
  width: 100%;
  margin: 22px 0;
`;

const Kicker = styled.p`
  font-size: ${fontSize.xs};
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${lightPalette.juhong[500]};
  margin: 0 0 10px;

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

const PageTitle = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(1.6rem, 3.2vw, 2.75rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: ${meok[900]};
  margin: 0 0 14px;
  text-align: left;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }

  @media (max-width: 520px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

const Lead = styled.p`
  font-size: clamp(0.875rem, 1.25vw, 1.05rem);
  font-weight: 400;
  line-height: 1.7;
  color: ${meok[600]};
  margin: 0;
  text-align: left;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }

  @media (max-width: 860px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

const SourceNote = styled.p`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  margin: 0;

  strong {
    font-weight: 700;
    color: ${lightPalette.juhong[500]};
  }
`;

interface HanokArchiveProps {
  villages: Village[];
  meta: VillageMeta;

  initialFilters: HanokFilterState;
}

export default function HanokArchive({ villages, meta, initialFilters }: HanokArchiveProps) {
  const [selectedDogamVillage, setSelectedDogamVillage] = useState<Village | null>(null);
  const [selectedStay, setSelectedStay] = useState<Village | null>(null);
  const archiveData = useArchiveData(villages, meta);

  useEffect(
    () =>
      scheduleIdle(() => {
        void loadDogamDetailModal();
        void loadStayDetailModal();
      }, 2000),
    []
  );




  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void document.body.offsetHeight;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <Root>
      <HanokAtmosphereBackground />
      {}
      <Global styles={paperGround} />
      <HanokSideIndex />
      <PageInner>
        {}
        <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.intro}>
          <IntroStage>
            <IntroContent>
              <Intro>
                <Kicker>사라지기 전에 기록한다 · 전국 {archiveData.meta.total}곳</Kicker>
                <PageTitle>지금 한옥은 어디에 남아 있을까?</PageTitle>
                <HeroClothesline>
                  <HanokPolaroidClothesline
                    villages={archiveData.villages}
                    onSelectVillage={setSelectedDogamVillage}
                  />
                </HeroClothesline>
                <Lead>
                  궁궐과 고택, 서원과 전통마을, 하룻밤 머물 수 있는 집까지.
                  계절마다 한 곳씩 들여다봅니다.
                </Lead>
              </Intro>
            </IntroContent>
          </IntroStage>
        </StyledVesselReveal>

        {}
        <EditorialSection>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.kculture}>
            <KCultureSectionContainer>
              <KCultureThemeFeed />
            </KCultureSectionContainer>
          </StyledVesselReveal>
        </EditorialSection>

        {



}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.structure}>
            <SectionContainer>
              <HanokStructureCards />
            </SectionContainer>
          </StyledVesselReveal>
        </ChapterBreak>

        {}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.grid}>
            <SectionContainer>
              <HanokGrid
                villages={archiveData.villages}
                onSelectVillage={setSelectedDogamVillage}
                initialFilters={initialFilters}
              />
            </SectionContainer>
          </StyledVesselReveal>

          <ArchiveSection>
            <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.stay}>
              <SectionContainer>
                <HanokStayAccordion
                  villages={archiveData.villages}
                  onSelectStay={setSelectedStay}
                />
              </SectionContainer>
            </StyledVesselReveal>
          </ArchiveSection>
        </ChapterBreak>

        {}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.map}>
            <SectionContainer>
              <HanokMap
                villages={archiveData.villages}
                onSelectVillage={(v) => {
                  if (v.type === '한옥스테이') {
                    setSelectedStay(v);
                  } else {
                    setSelectedDogamVillage(v);
                  }
                }}
              />
            </SectionContainer>
          </StyledVesselReveal>
        </ChapterBreak>

        {}
        {



}
        <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.manifesto}>
          <HanokManifestoCta />
        </StyledVesselReveal>
      </PageInner>

      {}
      {selectedDogamVillage && (
        <HanokDogamDetailModal
          key={selectedDogamVillage.id}
          village={selectedDogamVillage}
          onClose={() => setSelectedDogamVillage(null)}
        />
      )}

      {}
      {selectedStay && (
        <HanokStayDetailModal
          key={selectedStay.id}
          stay={selectedStay}
          onClose={() => setSelectedStay(null)}
        />
      )}
    </Root>
  );
}
