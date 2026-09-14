'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, surface, fluidHeading, fontSize } from '@/design-system/tokens';
import HanokGrid from '@/features/hanok-archive/sections/HanokGrid';
import HanokDistribution from '@/features/hanok-archive/sections/HanokDistribution';
import HanokStayAccordion from '@/features/hanok-archive/sections/HanokStayAccordion';
import HanokMap from '@/features/hanok-archive/sections/HanokMap';
import HanokMonthly from '@/features/hanok-archive/sections/HanokMonthly';
import HanokManifestoCta from '@/features/hanok-archive/sections/HanokManifestoCta';
import HanokStructureCards from '@/features/hanok-archive/structure/HanokStructureCards';
import HanokParts from '@/features/hanok-archive/structure/HanokParts';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { decodeHanokArchivePayload } from '@/features/hanok-archive/data/hanokArchiveFallback';
import { HANOK_REVEAL_SECTIONS } from '@/features/hanok-archive/hanokSectionReveal';
import type { HanokFilterState } from '@/features/hanok-archive/sections/hanokFilterQuery';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { HanjiDeckleEdge } from '@/shared/components/HanjiDeckleEdge';
import { HanokAtmosphereBackground } from '@/shared/components/HanokBackground';

const loadDogamDetailModal = () => import('@/features/hanok-archive/components/HanokDogamDetailModal');
const HanokDogamDetailModal = dynamic(loadDogamDetailModal, { ssr: false });

const loadStayDetailModal = () => import('@/features/hanok-archive/components/HanokStayDetailModal');
const HanokStayDetailModal = dynamic(loadStayDetailModal, { ssr: false });

const INTRO_VIDEO_SRC = '/videos/hanok-neungsohwa-loop.mp4';

/* 급하지 않은 일감을 마운트 직후로 미룬다 — 모달 프리로드, 인트로 영상 지연 로드가 같은 모양이라 하나로 묶는다 */
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
  min-height: 100vh;
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
  padding: 0 0 clamp(64px, 8vh, 120px);
`;

const SectionContainer = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 72rem;
  padding: 0 1rem;

  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }
`;

const StyledVesselReveal = styled(VesselReveal)`
  width: 100%;
`;

// PageContainer 바깥까지 같은 바탕을 유지하고, route를 떠나면 Emotion이 자동 복원한다.
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

// 1. 중간 호흡: 통계(분포도) → 큐레이션(이달의 한옥), 구조 카드 → 부재 목록 등
const EditorialSection = styled.div`
  padding-top: clamp(56px, 7.5vh, 96px);
`;

// 2. 어두운 인트로 영상 배경 바로 다음 자리: 첫 본문으로 넘어올 때 서사적인 여유를 준다
const HeroLeadOutSection = styled.div`
  padding-top: clamp(64px, 8.5vh, 108px);
`;

// 3. 챕터 대전환: 이달의 한옥 → 도감, 스테이 → 3D 구조, 부재 목록 → 지도
const ChapterBreak = styled.div`
  padding-top: clamp(96px, 12vh, 160px);
`;

// 4. 동일 아카이브 내 서브 챕터 연결: 도감 그리드 → 스테이 아코디언
const ArchiveSection = styled.div`
  padding-top: clamp(56px, 7vh, 88px);
`;

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
  max-width: 1200px;
  margin: 12px auto 0;
  border-radius: 24px;
  min-height: clamp(260px, 32vh, 340px);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1120px) {
    margin: 8px 16px 0;
  }

  @media (max-width: 640px) {
    margin: 4px 8px 0;
    border-radius: 18px;
    min-height: 240px;
  }
`;

const IntroPoster = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(135deg, ${meok[900]} 0%, ${meok[700]} 100%);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.6s ease;
`;

const IntroVideo = styled.video<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.6s ease;
`;

/* 흰 텍스트 대비 및 중앙 텍스트 가독성을 위한 시네마틱 스크림 */
const IntroScrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    rgba(10, 9, 8, 0.5) 0%,
    rgba(10, 9, 8, 0.35) 60%,
    rgba(10, 9, 8, 0.65) 100%
  );
`;

const IntroContent = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: clamp(48px, 6vh, 72px) clamp(20px, 4vw, 40px) clamp(56px, 7vh, 80px);
`;

const Intro = styled.header`
  max-width: 980px;
  width: 100%;
  text-align: center;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PageTitle = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(1.6rem, 3.2vw, 2.75rem);
  font-weight: 300;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0 0 14px;
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.5);

  @media (max-width: 520px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

const Lead = styled.p`
  font-size: clamp(0.875rem, 1.25vw, 1.05rem);
  font-weight: 400;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
  margin: 0;
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);

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
    color: ${lightPalette.kobalt[500]};
  }
`;

interface HanokArchiveProps {
  villages: Village[];
  meta: VillageMeta;
  /** 주소창에 실려 온 도감 필터. 서버에서 읽어 내려온다. */
  initialFilters: HanokFilterState;
}

export default function HanokArchive({ villages, meta, initialFilters }: HanokArchiveProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [selectedDogamVillage, setSelectedDogamVillage] = useState<Village | null>(null);
  const [selectedStay, setSelectedStay] = useState<Village | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [archiveData, setArchiveData] = useState(() => ({ villages, meta }));
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [introVideoReady, setIntroVideoReady] = useState(false);
  // 목데이터 스냅샷이 실데이터로 교체되며 이달의 한옥 이미지가 눈에 띄게 스왑되는 걸 막기 위해,
  // 실데이터 확정 전까지는 스켈레톤을 보여준다.
  const [isFeaturedReady, setIsFeaturedReady] = useState(false);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    async function refreshArchive() {
      try {
        const response = await fetch('/api/tourapi', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;
        const nextData = decodeHanokArchivePayload(await response.json());
        if (nextData) setArchiveData(nextData);
      } catch {
        // Snapshot remains visible when the future backend is unavailable or changes shape.
      } finally {
        window.clearTimeout(timeoutId);
        if (isActive) setIsFeaturedReady(true);
      }
    }

    void refreshArchive();
    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(
    () =>
      scheduleIdle(() => {
        void loadDogamDetailModal();
        void loadStayDetailModal();
      }, 2000),
    []
  );

  // 인트로 뒷배경 영상 — 초기 렌더에는 CSS 그라디언트 포스터만 보이고,
  // 마운트 후 한가할 때 영상을 불러와 재생 준비가 되면 크로스페이드한다.
  // 모션을 줄이길 원하면 영상을 아예 요청하지 않고 포스터로 둔다.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    return scheduleIdle(() => setShowIntroVideo(true), 2000);
  }, [prefersReducedMotion]);

  return (
    <Root>
      <HanokAtmosphereBackground />
      <HanjiDeckleEdge />
      <Global styles={paperGround} />
      <PageInner>
        {/* 진입부: 한국의 정취를 담은 동영상 히어로 */}
        <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.intro}>
          <IntroStage>
            <IntroPoster aria-hidden="true" $visible={!introVideoReady} />
            {showIntroVideo && (
              <IntroVideo
                aria-hidden="true"
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                $visible={introVideoReady}
                onCanPlay={() => setIntroVideoReady(true)}
              >
                <source src={INTRO_VIDEO_SRC} type="video/mp4" />
              </IntroVideo>
            )}
            <IntroScrim aria-hidden="true" />
            <IntroContent>
              <Intro>
                <PageTitle>지금 한옥은 어디에 남아 있을까</PageTitle>
                <Lead>
                  궁궐과 고택, 서원과 전통마을, 하룻밤 머물 수 있는 집까지.
                  계절마다 한 곳씩 들여다봅니다.
                </Lead>
              </Intro>
            </IntroContent>
          </IntroStage>
        </StyledVesselReveal>

        {/* 감성적인 첫인상: 이 달의 한옥 대표 큐레이션 에디토리얼 화보 */}
        <EditorialSection>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.monthly}>
            <SectionContainer>
              <HanokMonthly
                villages={archiveData.villages}
                onSelectVillage={setSelectedDogamVillage}
                isFeaturedReady={isFeaturedReady}
              />
            </SectionContainer>
          </StyledVesselReveal>
        </EditorialSection>

        {/* 3. 데이터 탐색: 전국 한옥 분포 & 인터랙티브 지역 선택기 */}
        <HeroLeadOutSection>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.distribution}>
            <SectionContainer>
              <HanokDistribution
                villages={archiveData.villages}
                onSelectRegion={setSelectedRegion}
              />
            </SectionContainer>
          </StyledVesselReveal>
        </HeroLeadOutSection>

        {/* 4. 아카이브 덩어리: 전국 한옥 도감 ➔ 지역별 한옥 스테이 */}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.grid}>
            <SectionContainer>
              <HanokGrid
                villages={archiveData.villages}
                onSelectVillage={setSelectedDogamVillage}
                initialFilters={initialFilters}
                externalRegion={selectedRegion}
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

        {/*
          구조 챕터 — 절기에 따른 처마 그림자, 7단계 부재 조립.
          카드를 눌러야 3D 모달이 열리므로 도감 본문 스크롤은 그대로 둔다.
        */}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.structure}>
            <SectionContainer>
              <HanokStructureCards />
            </SectionContainer>
          </StyledVesselReveal>

          {/*
            카드는 3D로 들어가는 문이고, 이 목록은 문을 열지 않아도 읽히는 본문이다.
            같은 챕터라 여백을 크게 두지 않고 바로 잇는다.
          */}
          <EditorialSection>
            <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.parts}>
              <SectionContainer>
                <HanokParts />
              </SectionContainer>
            </StyledVesselReveal>
          </EditorialSection>
        </ChapterBreak>

        {/* 부재를 읽고 난 뒤 지도로 — 어느 채가 어디 있는지 짚어 준다 (구조에서 지도로의 대전환) */}
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

        {/* 온마루 한옥 매니페스토 (자체 상하 여백을 가지고 있다) */}
        <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.manifesto}>
          <SectionContainer>
            <HanokManifestoCta />
          </SectionContainer>
        </StyledVesselReveal>
      </PageInner>

      {/* 1. 전국 한옥 도감 상세 모달 (건축 및 역사 해설, 오디오 도슨트, 고즈넉 지수) */}
      {selectedDogamVillage && (
        <HanokDogamDetailModal
          key={selectedDogamVillage.id}
          village={selectedDogamVillage}
          onClose={() => setSelectedDogamVillage(null)}
        />
      )}

      {/* 2. 지역별 한옥 스테이 상세 모달 (숙박 이용 안내, 객실, 실시간 예약) */}
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
