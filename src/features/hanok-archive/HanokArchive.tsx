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
// 예전엔 얇은 구분선이 섹션 경계를 표시해 줘서 여백을 줄여 뒀는데, 선을 지운 뒤로는
// 여백이 그 구분 역할을 다시 떠맡아야 해서 되돌렸다.
const EditorialSection = styled.div`
  padding-top: clamp(32px, 3.5vh, 46px);
`;

// 3. 챕터 대전환: 이달의 한옥 → 도감, 스테이 → 3D 구조, 부재 목록 → 지도
const ChapterBreak = styled.div`
  padding-top: clamp(80px, 9vh, 124px);
`;

// 4. 동일 아카이브 내 서브 챕터 연결: 도감 그리드 → 스테이 아코디언
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

// 히어로 안, 제목과 리드 문구 사이에 폴라로이드 빨랫줄을 끼워 넣는 자리
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
  /** 주소창에 실려 온 도감 필터. 서버에서 읽어 내려온다. */
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

  // 탭이 백그라운드로 갔다 돌아오면 브라우저가 그동안 안 그린 화면을 그대로 들고 있다가
  // 어색하게 멈춰 보일 때가 있다. 탭이 다시 보일 때 한 번 리플로우를 강제해 최신 상태로
  // 다시 그리게 한다 — 비용은 거의 없고, 문제가 없을 땐 그냥 아무 변화도 없다.
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
      {/* <HanjiDeckleEdge /> */}
      <Global styles={paperGround} />
      <HanokSideIndex />
      <PageInner>
        {/* 진입부: 한국의 정취를 담은 히어로 */}
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

        {/* K-컬처 & 웰니스 테마 큐레이션: K-드라마, 촌캉스, 야간기행, 종가 미식 (토스/당근 스타일) */}
        <EditorialSection>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.kculture}>
            <KCultureSectionContainer>
              <KCultureThemeFeed />
            </KCultureSectionContainer>
          </StyledVesselReveal>
        </EditorialSection>

        {/*
          구조 챕터 — 절기에 따른 처마 그림자, 7단계 부재 조립.
          "왜 이렇게 지어졌는가"를 먼저 답해야 뒤이은 도감·스테이가 설득력을 갖는다.
          카드를 눌러야 3D 모달이 열리므로 도감 본문 스크롤은 그대로 둔다.
        */}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.structure}>
            <SectionContainer>
              <HanokStructureCards />
            </SectionContainer>
          </StyledVesselReveal>
        </ChapterBreak>

        {/* 구조를 이해했으니 실물로 — 전국 한옥 도감 ➔ 지역별 한옥 스테이 */}
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

        {/* 도감과 스테이를 둘러봤으니 지도로 — 어느 채가 어디 있는지 짚어 준다 */}
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
        {/*
          exitThresholdRatio 기본값(0.67)을 쓴다. 0.9로 두면 접힘 경계가
          뷰포트 하단 10% 지점이 되어, 위로 스크롤해 섹션이 사라질 때
          접히는 애니메이션이 화면에 거의 보이지 않은 채 끝나버린다.
        */}
        <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.manifesto}>
          <HanokManifestoCta />
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
