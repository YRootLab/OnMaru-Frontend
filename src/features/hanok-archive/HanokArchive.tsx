'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, surface, fontSize } from '@/design-system/tokens';
import HanokGrid from '@/features/hanok-archive/sections/HanokGrid';
import HanokStayAccordion from '@/features/hanok-archive/sections/HanokStayAccordion';
import HanokMap from '@/features/hanok-archive/sections/HanokMap';
import HanokPolaroidClothesline from '@/features/hanok-archive/sections/HanokPolaroidClothesline';
import KCultureThemeFeed from '@/features/hanok-archive/components/KCultureThemeFeed';
import HanokManifestoCta from '@/features/hanok-archive/sections/HanokManifestoCta';
import HanokStructureCards from '@/features/hanok-archive/structure/HanokStructureCards';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { decodeHanokArchivePayload } from '@/features/hanok-archive/data/hanokArchiveFallback';
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
// 이제 얇은 구분선이 섹션 경계를 표시해 주니, 그 역할까지 여백이 떠맡을 필요가 없어 줄였다.
const EditorialSection = styled.div`
  padding-top: clamp(40px, 5vh, 64px);
`;

// 큰 타이틀 바로 위에 놓는 얇은 회색 구분선 — 섹션이 여기서 나뉜다는 걸 여백 대신 선으로 보여준다
const SectionDivider = styled.hr`
  border: none;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 0 28px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

// 3. 챕터 대전환: 이달의 한옥 → 도감, 스테이 → 3D 구조, 부재 목록 → 지도
const ChapterBreak = styled.div`
  padding-top: clamp(56px, 7vh, 96px);
`;

// 4. 동일 아카이브 내 서브 챕터 연결: 도감 그리드 → 스테이 아코디언
const ArchiveSection = styled.div`
  padding-top: clamp(40px, 5vh, 64px);
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
  const [selectedDogamVillage, setSelectedDogamVillage] = useState<Village | null>(null);
  const [selectedStay, setSelectedStay] = useState<Village | null>(null);
  const [archiveData, setArchiveData] = useState(() => ({ villages, meta }));
  // 스냅샷 → 실데이터 교체는 방문당 딱 한 번이어야 한다. 개발 모드의 StrictMode
  // 이중 실행처럼 이 effect가 두 번 걸리면 archiveData가 다시 한번 바뀌어 regions
  // 참조도 또 바뀌고, 이미 끝난 분포 차트 입장 연출이 또 리셋된다 — "표가 나타났다가
  // 안 나타나"가 재발했던 원인. isActive 가드는 취소만 막을 뿐 두 번째로 실제 도착한
  // 응답까지는 못 막으므로, 교체 자체를 컴포넌트 생애주기당 한 번으로 못박는다.
  const hasSwappedRef = useRef(false);

  useEffect(() => {
    if (hasSwappedRef.current) return undefined;

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
        if (isActive && nextData && !hasSwappedRef.current) {
          hasSwappedRef.current = true;
          setArchiveData(nextData);
        }
      } catch {
        // Snapshot remains visible when the future backend is unavailable or changes shape.
      } finally {
        window.clearTimeout(timeoutId);
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
      <PageInner>
        {/* 진입부: 한국의 정취를 담은 히어로 */}
        <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.intro}>
          <IntroStage>
            <IntroContent>
              <Intro>
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
          <StyledVesselReveal id="hanok-kculture-themes">
            <SectionContainer>
              <SectionDivider />
              <KCultureThemeFeed
                onSelectContent={(contentId) => {
                  const target = archiveData.villages.find((v) => v.id === contentId);
                  if (target) {
                    if (target.type === '한옥스테이') setSelectedStay(target);
                    else setSelectedDogamVillage(target);
                  }
                }}
              />
            </SectionContainer>
          </StyledVesselReveal>
        </EditorialSection>

        {/* 4. 아카이브 덩어리: 전국 한옥 도감 ➔ 지역별 한옥 스테이 */}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.grid}>
            <SectionContainer>
              <SectionDivider />
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
                <SectionDivider />
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
              <SectionDivider />
              <HanokStructureCards />
            </SectionContainer>
          </StyledVesselReveal>
        </ChapterBreak>

        {/* 부재를 읽고 난 뒤 지도로 — 어느 채가 어디 있는지 짚어 준다 (구조에서 지도로의 대전환) */}
        <ChapterBreak>
          <StyledVesselReveal id={HANOK_REVEAL_SECTIONS.map}>
            <SectionContainer>
              <SectionDivider />
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
