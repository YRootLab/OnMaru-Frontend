'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { meok, lightPalette } from '@/design-system/tokens';
import HanokGrid from '@/hanok/sections/HanokGrid';
import HanokMap from '@/hanok/sections/HanokMap';
import HanokStayAccordion from '@/hanok/sections/HanokStayAccordion';
import HanokMonthly from '@/hanok/sections/HanokMonthly';
import HanokManifestoCta from '@/hanok/sections/HanokManifestoCta';
import HanokStructureCards from '@/hanok/structure/HanokStructureCards';
import type { Village, VillageMeta } from '@/hanok/types';
import { decodeHanokArchivePayload } from '@/hanok/data/hanokArchiveFallback';
import { HANOK_REVEAL_SECTIONS } from '@/hanok/hanokSectionReveal';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';

const loadVillageDetailModal = () => import('@/hanok/components/VillageDetailModal');
const VillageDetailModal = dynamic(loadVillageDetailModal, { ssr: false });

const Root = styled.div`
  min-height: 100vh;
  font-family: var(--font-hanok);
  color: ${meok[900]};
  background: #ffffff;
`;

const PageInner = styled.div`
  width: 100%;
  margin: 0;
  padding: 0;
`;

// PageContainer 바깥까지 같은 흰색을 유지하고, route를 떠나면 Emotion이 자동 복원한다.
const paperGround = css`
  body {
    background: #ffffff;
  }
`;

// 섹션 완급: 매거진(이달의 한옥·매니페스토)은 넓게 비우고,
// 아카이브 3종(도감·스테이·지도)은 붙여서 한 덩어리로 읽히게 한다.
const EditorialSection = styled.div`
  padding-top: clamp(28px, 4vh, 52px);
`;

const ArchiveGroup = styled.div`
  padding-top: clamp(88px, 12vh, 160px);
`;

const ArchiveSection = styled.div`
  padding-top: clamp(36px, 4.5vh, 60px);
`;

const Intro = styled.header`
  padding: clamp(40px, 7vh, 88px) 0 clamp(8px, 2vh, 20px);
  max-width: 760px;
`;

const Eyebrow = styled.p`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${lightPalette.kobalt[500]};
  margin: 0 0 14px;
`;

const PageTitle = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(32px, 5.2vw, 56px);
  font-weight: 300;
  line-height: 1.22;
  letter-spacing: -0.02em;
  color: ${meok[900]};
  margin: 0 0 18px;
  word-break: keep-all;
`;

const Lead = styled.p`
  font-size: clamp(15px, 1.6vw, 17px);
  font-weight: 400;
  line-height: 1.75;
  color: ${meok[700]};
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
}

export default function HanokArchive({ villages, meta }: HanokArchiveProps) {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [archiveData, setArchiveData] = useState(() => ({ villages, meta }));
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

  useEffect(() => {
    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (browserWindow.requestIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(() => void loadVillageDetailModal(), { timeout: 2000 });
      return () => browserWindow.cancelIdleCallback?.(idleId);
    }
    const timeoutId = window.setTimeout(() => void loadVillageDetailModal(), 600);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <Root>
      <Global styles={paperGround} />
      <PageInner>
        {/* 진입부는 질문을 던지고, 답(왜 한옥인가)은 맨 아래 매니페스토가 한다 */}
        <VesselReveal id={HANOK_REVEAL_SECTIONS.intro} className="w-full py-6 sm:py-8 lg:py-10">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <Intro>
              <Eyebrow>온마루 한옥도감</Eyebrow>
              <PageTitle>지금 한옥은 어디에 남아 있을까</PageTitle>
              <Lead>
                궁궐과 고택, 서원과 전통마을, 하룻밤 머물 수 있는 집까지.
                계절마다 한 곳씩 들여다봅니다.
              </Lead>
              <SourceNote>
                한국관광공사 관광정보 API(TourAPI)에서 실시간으로 가져옵니다 · 지금{' '}
                <strong>{archiveData.meta.total}곳</strong>
              </SourceNote>
            </Intro>
          </div>
        </VesselReveal>

        {/*
          구조 챕터 — 절기에 따른 처마 그림자, 7단계 부재 조립.
          카드를 눌러야 3D 모달이 열리므로 도감 본문 스크롤은 그대로 둔다.
          (랜딩에서 옮겨 왔다. 원본은 src/temp/landing/)
        */}
        <EditorialSection>
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <HanokStructureCards />
          </div>
        </EditorialSection>

        {/* 이 달의 한옥 큐레이션 */}
        <EditorialSection>
          <VesselReveal id={HANOK_REVEAL_SECTIONS.monthly} className="w-full py-6 sm:py-8 lg:py-10">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <HanokMonthly villages={archiveData.villages} onSelectVillage={setSelectedVillage} isFeaturedReady={isFeaturedReady} />
            </div>
          </VesselReveal>
        </EditorialSection>

        {/* 아카이브 한 덩어리: 도감 → 스테이 → 지도 */}
        <ArchiveGroup>
          <VesselReveal id={HANOK_REVEAL_SECTIONS.grid} className="w-full py-6 sm:py-8 lg:py-10">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <HanokGrid villages={archiveData.villages} onSelectVillage={setSelectedVillage} />
            </div>
          </VesselReveal>

          <ArchiveSection>
            <VesselReveal id={HANOK_REVEAL_SECTIONS.stay} className="w-full py-6 sm:py-8 lg:py-10">
              <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <HanokStayAccordion villages={archiveData.villages} onSelectVillage={setSelectedVillage} />
              </div>
            </VesselReveal>
          </ArchiveSection>

          <ArchiveSection>
            <VesselReveal id={HANOK_REVEAL_SECTIONS.map} className="w-full py-6 sm:py-8 lg:py-10">
              <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <HanokMap villages={archiveData.villages} onSelectVillage={setSelectedVillage} />
              </div>
            </VesselReveal>
          </ArchiveSection>
        </ArchiveGroup>

        {/* 온마루 한옥 매니페스토 (자체 상하 여백을 가지고 있다) */}
        <VesselReveal id={HANOK_REVEAL_SECTIONS.manifesto} className="w-full py-6 sm:py-8 lg:py-10">
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
