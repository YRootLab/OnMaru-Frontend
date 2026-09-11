'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, surface } from '@/design-system/tokens';
import HanokGrid from '@/hanok/sections/HanokGrid';
import HanokDistribution from '@/hanok/sections/HanokDistribution';
import HanokStayAccordion from '@/hanok/sections/HanokStayAccordion';
import HanokMap from '@/hanok/sections/HanokMap';
import HanokMonthly from '@/hanok/sections/HanokMonthly';
import HanokManifestoCta from '@/hanok/sections/HanokManifestoCta';
import HanokStructureCards from '@/hanok/structure/HanokStructureCards';
import HanokParts from '@/hanok/structure/HanokParts';
import type { Village, VillageMeta } from '@/hanok/types';
import { decodeHanokArchivePayload } from '@/hanok/data/hanokArchiveFallback';
import { HANOK_REVEAL_SECTIONS } from '@/hanok/hanokSectionReveal';
import type { HanokFilterState } from '@/hanok/sections/hanokFilterQuery';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const loadVillageDetailModal = () => import('@/hanok/components/VillageDetailModal');
const VillageDetailModal = dynamic(loadVillageDetailModal, { ssr: false });

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
  background: #ffffff;

  [data-theme='dark'] & {
    color: ${meok[100]};
    background: ${surface.dark.app};
  }
`;

const PageInner = styled.div`
  width: 100%;
  margin: 0;
  padding: 0;
`;

// PageContainer 바깥까지 같은 바탕을 유지하고, route를 떠나면 Emotion이 자동 복원한다.
const paperGround = css`
  body {
    background: #ffffff;
  }

  [data-theme='dark'] body {
    background: ${surface.dark.app};
  }
`;

// 섹션 완급: 매거진(이달의 한옥·매니페스토)은 넓게 비우고,
// 아카이브 3종(도감·스테이·지도)은 붙여서 한 덩어리로 읽히게 한다.
const EditorialSection = styled.div`
  padding-top: clamp(28px, 4vh, 52px);
`;

// 챕터가 갈리는 자리. 아카이브 덩어리로 들어갈 때와 거기서 빠져나올 때 크게 비운다.
const ChapterBreak = styled.div`
  padding-top: clamp(88px, 12vh, 160px);
`;

const ArchiveSection = styled.div`
  padding-top: clamp(36px, 4.5vh, 60px);
`;

const IntroStage = styled.div`
  position: relative;
  overflow: hidden;
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

/* 흰 텍스트 대비를 위해 살짝만 어둡게 — 영상 자체는 잘 보이게 둔다 */
const IntroScrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(10, 9, 8, 0.42) 0%,
    rgba(10, 9, 8, 0.18) 45%,
    rgba(10, 9, 8, 0.45) 100%
  );
`;

const IntroContent = styled.div`
  position: relative;
  z-index: 2;
`;

const Intro = styled.header`
  padding: clamp(56px, 10vh, 112px) 0 clamp(28px, 5vh, 56px);
  max-width: 760px;
`;

const PageTitle = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(32px, 5.2vw, 56px);
  font-weight: 300;
  line-height: 1.22;
  letter-spacing: -0.02em;
  color: ${meok[100]};
  margin: 0 0 18px;
  word-break: keep-all;
`;

const Lead = styled.p`
  font-size: clamp(15px, 1.6vw, 17px);
  font-weight: 400;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.78);
  margin: 0 0 20px;
  word-break: keep-all;
`;

const SourceNote = styled.p`
  font-size: 13px;
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
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
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

  useEffect(() => scheduleIdle(() => void loadVillageDetailModal(), 2000), []);

  // 인트로 뒷배경 영상 — 초기 렌더에는 CSS 그라디언트 포스터만 보이고,
  // 마운트 후 한가할 때 영상을 불러와 재생 준비가 되면 크로스페이드한다.
  // 모션을 줄이길 원하면 영상을 아예 요청하지 않고 포스터로 둔다.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    return scheduleIdle(() => setShowIntroVideo(true), 2000);
  }, [prefersReducedMotion]);

  return (
    <Root>
      <Global styles={paperGround} />
      <PageInner>
        {/* 진입부는 질문을 던지고, 답(왜 한옥인가)은 맨 아래 매니페스토가 한다 */}
        <VesselReveal id={HANOK_REVEAL_SECTIONS.intro} className="w-full">
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
            <IntroContent className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <Intro>
                <PageTitle>지금 한옥은 어디에 남아 있을까</PageTitle>
                <Lead>
                  궁궐과 고택, 서원과 전통마을, 하룻밤 머물 수 있는 집까지.
                  계절마다 한 곳씩 들여다봅니다.
                </Lead>
                {/* <SourceNote>
                  한국관광공사 관광정보 API(TourAPI)에서 실시간으로 가져옵니다 · 지금{' '}
                  <strong>{archiveData.meta.total}곳</strong>
                </SourceNote> */}
              </Intro>
            </IntroContent>
          </IntroStage>
        </VesselReveal>

        {/*
          진입부가 던진 "어디에 남아 있을까"에 숫자로 곧장 답한다.

          전에는 이 섹션이 네 번째였다 — 질문과 답 사이에 구조 챕터와 이달의 한옥이
          끼어 있어서, 답이 나올 때쯤 독자는 질문을 이미 놓친 뒤였다.
        */}
        <EditorialSection>
          <VesselReveal id={HANOK_REVEAL_SECTIONS.distribution} className="w-full">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <HanokDistribution villages={archiveData.villages} />
            </div>
          </VesselReveal>
        </EditorialSection>

        {/* 전체 규모를 본 눈을 한 채로 좁힌다 — 이 달의 한옥 큐레이션 */}
        <EditorialSection>
          <VesselReveal id={HANOK_REVEAL_SECTIONS.monthly} className="w-full">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <HanokMonthly villages={archiveData.villages} onSelectVillage={setSelectedVillage} isFeaturedReady={isFeaturedReady} />
            </div>
          </VesselReveal>
        </EditorialSection>

        {/* 아카이브 한 덩어리: 도감 → 스테이 */}
        <ChapterBreak>
          <VesselReveal id={HANOK_REVEAL_SECTIONS.grid} className="w-full">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <HanokGrid
                villages={archiveData.villages}
                onSelectVillage={setSelectedVillage}
                initialFilters={initialFilters}
              />
            </div>
          </VesselReveal>

          <ArchiveSection>
            <VesselReveal id={HANOK_REVEAL_SECTIONS.stay} className="w-full">
              <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <HanokStayAccordion villages={archiveData.villages} onSelectVillage={setSelectedVillage} />
              </div>
            </VesselReveal>
          </ArchiveSection>
        </ChapterBreak>

        {/*
          구조 챕터 — 절기에 따른 처마 그림자, 7단계 부재 조립.
          카드를 눌러야 3D 모달이 열리므로 도감 본문 스크롤은 그대로 둔다.
        */}
        <ChapterBreak>
          <VesselReveal id={HANOK_REVEAL_SECTIONS.structure} className="w-full">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <HanokStructureCards />
            </div>
          </VesselReveal>

          {/*
            카드는 3D로 들어가는 문이고, 이 목록은 문을 열지 않아도 읽히는 본문이다.
            같은 챕터라 여백을 크게 두지 않고 바로 잇는다.
          */}
          <EditorialSection>
            <VesselReveal id={HANOK_REVEAL_SECTIONS.parts} className="w-full">
              <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <HanokParts />
              </div>
            </VesselReveal>
          </EditorialSection>
        </ChapterBreak>

        {/* 부재를 읽고 난 뒤 지도로 — 어느 채가 어디 있는지 짚어 준다 */}
        <EditorialSection>
          <VesselReveal id={HANOK_REVEAL_SECTIONS.map} className="w-full">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <HanokMap villages={archiveData.villages} onSelectVillage={setSelectedVillage} />
            </div>
          </VesselReveal>
        </EditorialSection>

        {/* 온마루 한옥 매니페스토 (자체 상하 여백을 가지고 있다) */}
        <VesselReveal id={HANOK_REVEAL_SECTIONS.manifesto} className="w-full">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <HanokManifestoCta />
          </div>
        </VesselReveal>
      </PageInner>

      {/* 마을 상세 인터랙티브 모달 */}
      {selectedVillage && (
        <VillageDetailModal
          key={selectedVillage.id}
          village={selectedVillage}
          onClose={() => setSelectedVillage(null)}
        />
      )}
    </Root>
  );
}
