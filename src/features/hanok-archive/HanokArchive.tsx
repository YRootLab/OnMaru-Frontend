'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { meok, surface, spacingLayout, mq } from '@/design-system/tokens';
import HanokGrid from '@/features/hanok-archive/sections/HanokGrid';
import HanokStayAccordion from '@/features/hanok-archive/sections/HanokStayAccordion';
import HanokMap from '@/features/hanok-archive/sections/HanokMap';
import HanokPolaroidClothesline from '@/features/hanok-archive/sections/HanokPolaroidClothesline';
import HanokSideIndex from '@/features/hanok-archive/components/HanokSideIndex';
import HanokManifestoCta from '@/features/hanok-archive/sections/HanokManifestoCta';
import HanokHero from '@/features/hanok-archive/sections/HanokHero';
import HanokStructureCards from '@/features/hanok-archive/structure/HanokStructureCards';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { useArchiveData } from '@/features/hanok-archive/hooks/useArchiveData';
import { useHanokSection1 } from '@/features/hanok-archive/hooks/useHanokSection1';
import { HANOK_REVEAL_SECTIONS } from '@/features/hanok-archive/hanokSectionReveal';
import type { HanokFilterState } from '@/features/hanok-archive/sections/hanokFilterQuery';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import { HanokAtmosphereBackground } from '@/shared/components/HanokBackground';
import { OniSearchEmpty } from '@/shared/components/OniSearchEmpty';
import HanokArchiveIntroHeading from '@/features/hanok-archive/components/HanokArchiveIntroHeading';
import SeasonGateway, { type SeasonGatewayData } from '@/features/seasons/presentation/SeasonGateway';

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
  padding-bottom: ${spacingLayout.sectionGap};

  ${mq.mobile} {
    padding-top: 20px;
  }
`;

const SectionContainer = styled.div`
  margin: 0 auto;
  width: min(calc(100% - 32px), 1140px);
  max-width: 1140px;
  padding: ${spacingLayout.sectionGap} 0;

  @media (max-width: 1023px) {
    width: calc(100% - 32px);
    padding: ${spacingLayout.sectionGap} 0;
  }

  ${mq.mobile} {
    width: calc(100% - 32px);
  }
`;

const StyledVesselReveal = styled(VesselReveal)`
  width: 100%;
`;


const paperGround = css`
  body {
    background: ${surface.light.base};
  }

  [data-theme='dark'] body,
  html[data-theme='dark'],
  html[data-theme='dark'] body {
    background: ${surface.dark.app} !important;
  }
`;





const ChapterBreak = styled.div`
  padding-top: ${spacingLayout.sectionGap};
`;


const ArchiveSection = styled.div`
  padding-top: ${spacingLayout.sectionGap};
`;

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
  width: min(calc(100% - 32px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  border-radius: 24px;
  min-height: clamp(220px, 24vh, 280px);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1023px) {
    width: calc(100% - 32px);
    margin: 0 auto;
  }

  ${mq.mobile} {
    width: calc(100% - 32px);
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

interface HanokArchiveProps {
  villages: Village[];
  meta: VillageMeta;

  initialFilters: HanokFilterState;
  seasonGateway: SeasonGatewayData | null;
}

export default function HanokArchive({
  villages,
  meta,
  initialFilters,
  seasonGateway,
}: HanokArchiveProps) {
  const searchParams = useSearchParams();
  const [selectedDogamVillage, setSelectedDogamVillage] = useState<Village | null>(null);
  const [selectedStay, setSelectedStay] = useState<Village | null>(null);
  const archiveData = useArchiveData(villages, meta);
  const section1 = useHanokSection1();
  const rawSection1Villages = section1.error
    ? null
    : section1.villages.length > 0
      ? section1.villages
      : archiveData.villages;
  const section1Villages = rawSection1Villages
    ? rawSection1Villages.filter((v) => Boolean(v.image && v.hasImage !== false))
    : null;

  const pushModal = useCallback((key: 'hanok' | 'stay', id: string | null) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('hanok');
    url.searchParams.delete('stay');
    if (id) url.searchParams.set(key, id);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const openDogam = useCallback((v: Village | null) => {
    setSelectedDogamVillage(v);
    pushModal('hanok', v?.id ?? null);
  }, [pushModal]);

  const openStay = useCallback((v: Village | null) => {
    setSelectedStay(v);
    pushModal('stay', v?.id ?? null);
  }, [pushModal]);

  useEffect(() => {
    const hanokId = searchParams.get('hanok');
    const stayId = searchParams.get('stay');
    if (!hanokId && !stayId) {
      setSelectedDogamVillage(null);
      setSelectedStay(null);
      return;
    }
    const all = archiveData.villages;
    if (all.length === 0) return;
    if (hanokId) {
      const found = all.find((v) => v.id === hanokId);
      if (found) {
        setSelectedDogamVillage(found);
        setSelectedStay(null);
      }
    } else if (stayId) {
      const found = all.find((v) => v.id === stayId);
      if (found) {
        setSelectedStay(found);
        setSelectedDogamVillage(null);
      }
    }
  }, [searchParams, archiveData.villages]);

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
                <HanokArchiveIntroHeading total={archiveData.meta.total} />
                <HeroClothesline>
                  {section1Villages ? (
                    <HanokPolaroidClothesline
                      villages={section1Villages}
                      onSelectVillage={openDogam}
                    />
                  ) : (
                    <OniSearchEmpty
                      size="md"
                      title="한옥 목록을 불러오지 못했어요"
                      description="잠시 후 다시 시도해 주세요."
                    />
                  )}
                </HeroClothesline>
                <Lead>
                  궁궐과 고택, 서원과 전통마을, 하룻밤 머물 수 있는 집까지.
                  계절마다 한 곳씩 들여다봅니다.
                </Lead>
              </Intro>
            </IntroContent>
          </IntroStage>
        </StyledVesselReveal>

        {section1Villages && section1Villages.length >= 2 && (
          <ChapterBreak>
            <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.hero}>
              <SectionContainer>
                <HanokHero
                  villages={section1Villages}
                  onSelectVillage={openDogam}
                />
              </SectionContainer>
            </StyledVesselReveal>
          </ChapterBreak>
        )}

        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.grid}>
            <SectionContainer>
              <HanokGrid
                villages={archiveData.villages}
                onSelectVillage={openDogam}
                initialFilters={initialFilters}
              />
            </SectionContainer>
          </StyledVesselReveal>

          {seasonGateway && (
            <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.seasons}>
              <SeasonGateway season={seasonGateway} />
            </StyledVesselReveal>
          )}

          <ArchiveSection>
            <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.stay}>
              <SectionContainer>
                <HanokStayAccordion
                  villages={archiveData.villages}
                  onSelectStay={openStay}
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
                    openStay(v);
                  } else {
                    openDogam(v);
                  }
                }}
              />
            </SectionContainer>
          </StyledVesselReveal>
        </ChapterBreak>

        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.structure}>
            <SectionContainer>
              <HanokStructureCards />
            </SectionContainer>
          </StyledVesselReveal>
        </ChapterBreak>

        <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.manifesto}>
          <HanokManifestoCta />
        </StyledVesselReveal>
      </PageInner>

      {}
      {selectedDogamVillage && (
        <HanokDogamDetailModal
          key={selectedDogamVillage.id}
          village={selectedDogamVillage}
          onClose={() => openDogam(null)}
        />
      )}

      {}
      {selectedStay && (
        <HanokStayDetailModal
          key={selectedStay.id}
          stay={selectedStay}
          onClose={() => openStay(null)}
        />
      )}
    </Root>
  );
}
