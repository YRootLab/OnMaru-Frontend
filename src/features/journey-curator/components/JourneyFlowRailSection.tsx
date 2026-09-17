'use client';

/**
 * /discover의 KnowledgeGraphView 자리를 대체한다 (사용자 지시로 지식 그래프 섹션 삭제).
 *
 * useJourneyStore.explorationBoard(TourAPI 실제 장소 + Gemini)를 JourneyFlowRail로 그린다.
 * pendingProposal이 있으면(수정 요청 결과) 확정 board 대신 유지/제외/추가 비교 화면을 보여주고,
 * 적용·취소 전까지는 committed board를 바꾸지 않는다 — seven-day-mvp-fe-handoff.md §5
 * "재탐색은 덮어쓰기가 아니라 제안이다"를 따른다.
 */

import { useState } from 'react';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';
import JourneyFlowRail from './JourneyFlowRail';
import JourneyMapView from './JourneyMapView';
import JourneyRelationView from './JourneyRelationView';
import JourneyPlaceCard, { type PlaceCardState } from './JourneyPlaceCard';
import JourneySaveButton from './JourneySaveButton';
import JourneyPrintView from './JourneyPrintView';
import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';

/** 인쇄 시 나머지 화면은 숨기고 .journey-print-view만 보여준다(표준 인쇄 격리 패턴). */
const printStyles = css`
  @media print {
    body * {
      visibility: hidden;
    }
    .journey-print-view,
    .journey-print-view * {
      visibility: visible;
    }
    .journey-print-view {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
    }
  }
`;

type ViewMode = 'JOURNEY' | 'MAP' | 'RELATION';
const VIEW_LABEL: Record<ViewMode, string> = { JOURNEY: '여정', MAP: '지도', RELATION: '연결' };

const Wrap = styled.section`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding: 32px 0 8px;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize.xl};
  font-weight: 500;
  color: ${meok[900]};
  margin: 0 0 4px;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`;

const PrintButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 6px 2px;
  cursor: pointer;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[500]};

  &:hover {
    color: ${meok[900]};
  }
`;

const QuerySummary = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0 0 20px;
`;

const StatusText = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  padding: 4px 0;
`;

const EvidencePanel = styled.div`
  margin-top: 12px;
  padding-top: 16px;
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

const DiffRow = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 4px 4px 12px;
`;

const ProposalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const ApplyButton = styled.button`
  padding: 10px 24px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: #fff;
  background: ${palette.juhong[500]};
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: ${palette.juhong[700]};
  }
`;

const CancelButton = styled.button`
  padding: 10px 24px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[600]};
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: ${meok[900]};
  }
`;

const ViewTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
`;

const ViewTab = styled.button<{ $active: boolean }>`
  padding: 6px 2px;
  margin-right: 18px;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? palette.juhong[500] : 'transparent')};
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${({ $active }) => ($active ? meok[900] : meok[400])};
  cursor: pointer;
`;

function findPlace(board: JourneyBoard, ref: ResourceRef): PlaceResource | undefined {
  return board.resources.find(
    (r): r is PlaceResource => r.ref.type === 'PLACE' && r.ref.id === ref.id,
  );
}

function findRegionTitle(board: JourneyBoard): string {
  const region = board.resources.find((r) => r.ref.type === 'REGION' && r.ref.id === board.regionRef.id);
  return region ? (region as { title: string }).title : '';
}

export default function JourneyFlowRailSection() {
  const board = useJourneyStore((s) => s.explorationBoard);
  const boardCreatedAt = useJourneyStore((s) => s.boardCreatedAt);
  const isExploring = useJourneyStore((s) => s.isExploring);
  const pinnedRefs = useJourneyStore((s) => s.pinnedRefs);
  const togglePin = useJourneyStore((s) => s.togglePin);
  const pendingProposal = useJourneyStore((s) => s.pendingProposal);
  const applyProposal = useJourneyStore((s) => s.applyProposal);
  const dismissProposal = useJourneyStore((s) => s.dismissProposal);

  const [openRef, setOpenRef] = useState<ResourceRef | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('JOURNEY');
  const reduceMotion = useReducedMotion();

  if (isExploring && !board) {
    return (
      <Wrap>
        <StatusText>조건 살피는 중 → 실제 장소 찾는 중 → 연결 확인 중…</StatusText>
      </Wrap>
    );
  }

  if (!board) {
    return (
      <Wrap>
        <StatusText>실제 장소를 찾지 못했어요. 다른 지역이나 표현으로 다시 요청해 보세요.</StatusText>
      </Wrap>
    );
  }

  const regionTitle = findRegionTitle(board);

  // ── 변경안 미리보기: committed board는 그대로 두고 유지/제외/추가만 겹쳐 보여준다 ──
  if (pendingProposal) {
    const removedIds = new Set(pendingProposal.removedRefs.map((r) => r.id));
    const addedIds = new Set(pendingProposal.addedRefs.map((r) => r.id));

    const keptAndRemoved = board.candidates
      .map((candidate, idx) => {
        const place = findPlace(board, candidate.placeRef);
        if (!place) return null;
        const isRemoved = removedIds.has(candidate.placeRef.id);
        const isPinned = pinnedRefs.some((r) => r.id === candidate.placeRef.id);
        const state: PlaceCardState = isRemoved ? 'removed' : isPinned ? 'pinned' : 'kept';
        return { order: idx + 1, candidate, place, state };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const added = pendingProposal.board.candidates
      .filter((c) => addedIds.has(c.placeRef.id))
      .map((candidate, idx) => {
        const place = findPlace(pendingProposal.board, candidate.placeRef);
        if (!place) return null;
        return {
          order: keptAndRemoved.length + idx + 1,
          candidate,
          place,
          state: 'added' as PlaceCardState,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="proposal"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Wrap>
            <SectionTitle>{pendingProposal.board.title}</SectionTitle>
            <QuerySummary>{pendingProposal.board.querySummary}</QuerySummary>

            <DiffRow>
              {[...keptAndRemoved, ...added].map(({ order, candidate, place, state }, i) => (
                <motion.div
                  key={place.ref.id}
                  layout
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, scale: state === 'added' ? 0.88 : 1, y: state === 'added' ? 0 : -6 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: reduceMotion ? 0 : i * 0.04, ease: 'easeOut' }}
                >
                  <JourneyPlaceCard
                    order={order}
                    candidate={candidate}
                    place={place}
                    regionTitle={regionTitle}
                    state={state}
                    isPinned={state === 'pinned'}
                  />
                </motion.div>
              ))}
            </DiffRow>

            <ProposalActions>
              <ApplyButton type="button" onClick={applyProposal}>
                적용
              </ApplyButton>
              <CancelButton type="button" onClick={dismissProposal}>
                취소
              </CancelButton>
            </ProposalActions>
          </Wrap>
        </motion.div>
      </AnimatePresence>
    );
  }

  const openCandidate = openRef ? board.candidates.find((c) => c.placeRef.id === openRef.id) : null;
  const openEvidence = openCandidate
    ? board.evidence.filter((e) => openCandidate.evidenceRefs.includes(e.id))
    : [];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`board-${board.title}`}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Wrap style={{ opacity: isExploring ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
          <Global styles={printStyles} />
          <JourneyPrintView board={board} createdAt={boardCreatedAt} />

          <HeaderRow>
            <div>
              <SectionTitle>{board.title}</SectionTitle>
              <QuerySummary>{board.querySummary}</QuerySummary>
            </div>
            <HeaderActions>
              <PrintButton type="button" onClick={() => window.print()}>
                <Printer size={15} strokeWidth={2} />
                <span>PDF로 저장</span>
              </PrintButton>
              <JourneySaveButton />
            </HeaderActions>
          </HeaderRow>

          <ViewTabs role="tablist" aria-label="여정 보기 전환">
            {(Object.keys(VIEW_LABEL) as ViewMode[]).map((mode) => (
              <ViewTab
                key={mode}
                type="button"
                role="tab"
                aria-selected={activeView === mode}
                $active={activeView === mode}
                onClick={() => setActiveView(mode)}
              >
                {VIEW_LABEL[mode]}
              </ViewTab>
            ))}
          </ViewTabs>

          {activeView === 'JOURNEY' && (
            <JourneyFlowRail
              board={board}
              pinnedRefs={pinnedRefs}
              onTogglePin={togglePin}
              onOpenEvidence={setOpenRef}
            />
          )}

          {activeView === 'MAP' && (
            <JourneyMapView board={board} focusedRef={openRef} onFocus={setOpenRef} />
          )}

          {activeView === 'RELATION' && (
            <JourneyRelationView
              board={board}
              focusedRef={openRef}
              onFocus={setOpenRef}
              onOpenEvidence={setOpenRef}
            />
          )}

          {openCandidate && (
            <EvidencePanel>
              {openEvidence.map((e) => (
                <EvidenceItem key={e.id}>
                  <b>{e.sourceName}</b> — {e.summary} {e.asOf ? `(${e.asOf} 기준)` : ''}
                </EvidenceItem>
              ))}
              {openEvidence.length === 0 && <EvidenceItem>연결된 근거가 없다.</EvidenceItem>}
            </EvidencePanel>
          )}
        </Wrap>
      </motion.div>
    </AnimatePresence>
  );
}
