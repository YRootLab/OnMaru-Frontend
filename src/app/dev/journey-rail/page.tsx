'use client';

/**
 * 새 이야기길 계약 미리보기 (개발용, /dev/journey-rail)
 *
 * seven-day-mvp-fe-handoff.md의 새 JourneyBoard/JourneyCandidate/JourneyLeg 계약을
 * 실제 화면에서 눈으로 확인하기 위한 페이지. 서촌 파일럿 fixture(이상의 집 →
 * 수성동계곡 → 통인시장)로 최초 보드를, "시장 빼고 역사 넣어줘" 수정 요청으로
 * 만들어진 변경안(유지/제외/추가)을 함께 보여준다.
 *
 * 아직 실제 /discover에는 연결하지 않았다 — BentoJourneyGrid는 그대로 두고
 * 새 컴포넌트만 여기서 먼저 검증한다.
 */

import { useState } from 'react';
import styled from '@emotion/styled';
import { meok, palette, fontSize } from '@/design-system/tokens';
import JourneyFlowRail from '@/features/journey-curator/components/JourneyFlowRail';
import JourneyPlaceCard from '@/features/journey-curator/components/JourneyPlaceCard';
import {
  JOURNEY_BOARD_INITIAL,
  JOURNEY_PROPOSAL,
  PLACE_YISANG,
  PLACE_SUSEONGDONG,
  PLACE_TONGIN,
  PLACE_DILKUSHA,
} from '@/features/journey-curator/data/seochonExplorationFixtures';
import type { JourneyBoard, ResourceRef } from '@/features/journey-curator/types/exploration.types';

const Page = styled.main`
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 20px 100px;
`;

const Title = styled.h1`
  font-family: var(--font-hanok);
  font-size: ${fontSize['3xl']};
  font-weight: 400;
  color: ${meok[900]};
  margin: 0 0 8px;
  letter-spacing: -0.02em;
`;

const Lead = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[600]};
  line-height: 1.6;
  margin: 0 0 32px;
  max-width: 640px;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize.xl};
  font-weight: 500;
  color: ${meok[900]};
  margin: 0 0 4px;
`;

const QuerySummary = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0 0 16px;

  &::before {
    content: '"';
  }
  &::after {
    content: '"';
  }
`;

const Section = styled.section`
  margin-bottom: 56px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 28px;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 8px 2px;
  margin-right: 20px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${({ $active }) => ($active ? meok[900] : meok[400])};
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? palette.juhong[500] : 'transparent')};
`;

const DiffRow = styled.div`
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding: 4px 4px 12px;
`;

const EvidencePanel = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid ${meok[200]};
`;

const EvidenceItem = styled.p`
  font-size: ${fontSize.xs};
  color: ${meok[600]};
  line-height: 1.7;
  margin: 0 0 6px;

  b {
    color: ${meok[800]};
    font-weight: 500;
  }
`;

const SearchForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  font-size: ${fontSize.sm};
  border: 1px solid ${meok[300]};
  border-radius: 8px;
  background: #fff;
  color: ${meok[900]};

  &:focus {
    outline: none;
    border-color: ${palette.juhong[500]};
  }
`;

const SearchButton = styled.button`
  padding: 10px 20px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: #fff;
  background: ${meok[900]};
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:disabled {
    background: ${meok[400]};
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
`;

const DEMO_QUERY = '서촌에서 한옥과 역사 이야기를 조용히 만나고 싶어';

export default function JourneyRailPreviewPage() {
  const [tab, setTab] = useState<'initial' | 'proposal' | 'live'>('live');
  const [openRef, setOpenRef] = useState<ResourceRef | null>(null);

  const [queryInput, setQueryInput] = useState(DEMO_QUERY);
  const [liveBoard, setLiveBoard] = useState<JourneyBoard | null>(null);
  const [liveAiGenerated, setLiveAiGenerated] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  async function runLiveSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!queryInput.trim() || liveLoading) return;
    setLiveLoading(true);
    setLiveError(null);
    setLiveBoard(null);
    try {
      const res = await fetch('/api/journey-curator/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryInput.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setLiveError(data.error.message || '검색에 실패했어요.');
      } else {
        setLiveBoard(data.board);
        setLiveAiGenerated(Boolean(data.aiGenerated));
      }
    } catch {
      setLiveError('네트워크 오류로 검색하지 못했어요.');
    } finally {
      setLiveLoading(false);
    }
  }

  const activeBoard =
    tab === 'live' ? liveBoard : tab === 'initial' ? JOURNEY_BOARD_INITIAL : JOURNEY_PROPOSAL.board;

  const openCandidate =
    openRef && activeBoard ? activeBoard.candidates.find((c) => c.placeRef.id === openRef.id) : null;
  const openEvidence = openCandidate
    ? activeBoard!.evidence.filter((e) => openCandidate.evidenceRefs.includes(e.id))
    : [];

  return (
    <Page>
      <Title>이야기길 · 새 계약 미리보기</Title>
      <Lead>
        `seven-day-mvp-fe-handoff.md` 계약대로 만든 <code>JourneyFlowRail</code> /{' '}
        <code>JourneyPlaceCard</code> 컴포넌트다. 카드에 border·box-shadow를 쓰지 않고
        순번 숫자·상태 라벨·여백으로만 구분했다.
      </Lead>

      <Tabs>
        <Tab type="button" $active={tab === 'live'} onClick={() => setTab('live')}>
          실제 검색 (TourAPI + Gemini)
        </Tab>
        <Tab type="button" $active={tab === 'initial'} onClick={() => setTab('initial')}>
          최초 보드 (fixture)
        </Tab>
        <Tab type="button" $active={tab === 'proposal'} onClick={() => setTab('proposal')}>
          변경안 (fixture)
        </Tab>
      </Tabs>

      {tab === 'live' && (
        <Section>
          <SearchForm onSubmit={runLiveSearch}>
            <SearchInput
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="예: 서촌에서 한옥과 역사 이야기를 조용히 만나고 싶어"
            />
            <SearchButton type="submit" disabled={liveLoading}>
              {liveLoading ? '찾는 중…' : '검색'}
            </SearchButton>
          </SearchForm>

          {liveLoading && <StatusText>조건 살피는 중 → 실제 장소 찾는 중…</StatusText>}
          {liveError && <StatusText style={{ color: palette.danpung[700] }}>{liveError}</StatusText>}

          {liveBoard && (
            <>
              <SectionTitle>{liveBoard.title}</SectionTitle>
              <QuerySummary>{liveBoard.querySummary}</QuerySummary>
              <StatusText>
                {liveAiGenerated ? 'Gemini가 실제 후보 중에서 골랐어요.' : 'AI 응답 실패로 TourAPI 상위 결과를 그대로 보여줘요.'}
              </StatusText>
              <div style={{ height: 12 }} />
              <JourneyFlowRail board={liveBoard} />
            </>
          )}
        </Section>
      )}

      {tab === 'initial' && (
        <Section>
          <SectionTitle>{JOURNEY_BOARD_INITIAL.title}</SectionTitle>
          <QuerySummary>{JOURNEY_BOARD_INITIAL.querySummary}</QuerySummary>
          <JourneyFlowRail
            board={JOURNEY_BOARD_INITIAL}
          />
        </Section>
      )}

      {tab === 'proposal' && (
        <Section>
          <SectionTitle>{JOURNEY_PROPOSAL.board.title}</SectionTitle>
          <QuerySummary>{JOURNEY_PROPOSAL.board.querySummary}</QuerySummary>
          <DiffRow>
            <JourneyPlaceCard
              order={1}
              candidate={JOURNEY_PROPOSAL.board.candidates[0]}
              place={PLACE_YISANG}
              regionTitle="서울 종로구 서춌"
              state="pinned"
              isPinned
            />
            <JourneyPlaceCard
              order={2}
              candidate={JOURNEY_PROPOSAL.board.candidates[1]}
              place={PLACE_SUSEONGDONG}
              regionTitle="서울 종로구 서춌"
              state="kept"
            />
            <JourneyPlaceCard
              order={3}
              candidate={{
                placeRef: PLACE_TONGIN.ref,
                reason: '조건 변경으로 이번 제안에서 빠졌어요.',
                evidenceRefs: ['ev_place_tongin'],
                relationRefs: [],
                constraintChecks: [],
              }}
              place={PLACE_TONGIN}
              regionTitle="서울 종로구 서춌"
              state="removed"
            />
            <JourneyPlaceCard
              order={3}
              candidate={JOURNEY_PROPOSAL.board.candidates[2]}
              place={PLACE_DILKUSHA}
              regionTitle="서울 종로구 서춌"
              state="added"
            />
          </DiffRow>
        </Section>
      )}

      {openCandidate && (
        <EvidencePanel>
          <SectionTitle style={{ fontSize: fontSize.base }}>근거</SectionTitle>
          {openEvidence.map((e) => (
            <EvidenceItem key={e.id}>
              <b>{e.sourceName}</b> — {e.summary} {e.asOf ? `(${e.asOf} 기준)` : ''}
            </EvidenceItem>
          ))}
          {openEvidence.length === 0 && <EvidenceItem>연결된 근거가 없다.</EvidenceItem>}
        </EvidencePanel>
      )}
    </Page>
  );
}
