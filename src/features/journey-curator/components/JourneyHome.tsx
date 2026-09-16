'use client';

/*
  홈 화면.

  검색 엔진의 첫 화면처럼, 들어오면 검색창 하나만 있다.
  지식 그래프와 여정 카드는 실제로 검색한 뒤에 나타난다 — 예전에는 서촌 예시 여정이
  처음부터 펼쳐져 있어서, 방문자가 자기 여정을 입력하기 전에 남의 결과부터 읽어야 했다.
*/

import styled from '@emotion/styled';

import { useJourneyStore } from '../store/useJourneyStore';
import JourneyHeroSearch from './JourneyHeroSearch';
import JourneyFlowRailSection from './JourneyFlowRailSection';
import JourneyEnrichmentSections from './JourneyEnrichmentSections';
import JourneyRefineBar from './JourneyRefineBar';
import JourneyAssemblyLoader from './JourneyAssemblyLoader';
import { HanjiDeckleEdge } from '@/shared/components/HanjiDeckleEdge';

/**
 * 검색 전에는 검색창을 화면 가운데에 세운다.
 * 헤더(66px)를 뺀 높이를 채우고, 그 안에서 세로 가운데로 모은다.
 */
const Landing = styled.div<{ $centered: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ $centered }) =>
    $centered
      ? `
    min-height: calc(100vh - 66px);
    justify-content: center;
    padding-bottom: 10vh;
  `
      : ''}

  @media (max-width: 767px) {
    min-height: 0;
    justify-content: flex-start;
    padding-bottom: 0;
  }
`;

export default function JourneyHome() {
  const hasSearched = useJourneyStore((s) => s.hasSearched);
  const isGenerating = useJourneyStore((s) => s.isGenerating);

  return (
    <main>
      <HanjiDeckleEdge />
      <JourneyAssemblyLoader />

      <Landing $centered={!hasSearched}>
        <JourneyHeroSearch />
      </Landing>

      {hasSearched && (
        <>
          <JourneyFlowRailSection />
          <JourneyEnrichmentSections />
          <JourneyRefineBar />
        </>
      )}
    </main>
  );
}
