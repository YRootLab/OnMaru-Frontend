'use client';










import { useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';
import JourneyFlowRail from './JourneyFlowRail';
import JourneyMapView from './JourneyMapView';
import JourneyRelationView from './JourneyRelationView';
import JourneyPlaceCard, { type PlaceCardState } from './JourneyPlaceCard';
import type { JourneyBoard, PlaceResource, ResourceRef } from '../types/exploration.types';

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
  const isExploring = useJourneyStore((s) => s.isExploring);
  const pendingProposal = useJourneyStore((s) => s.pendingProposal);
  const applyProposal = useJourneyStore((s) => s.applyProposal);
  const dismissProposal = useJourneyStore((s) => s.dismissProposal);

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


  if (pendingProposal) {
    const removedIds = new Set(pendingProposal.removedRefs.map((r) => r.id));
    const addedIds = new Set(pendingProposal.addedRefs.map((r) => r.id));

    const keptAndRemoved = board.candidates
      .map((candidate, idx) => {
        const place = findPlace(board, candidate.placeRef);
        if (!place) return null;
        const isRemoved = removedIds.has(candidate.placeRef.id);
        const state: PlaceCardState = isRemoved ? 'removed' : 'kept';
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
                수정된 코스 적용하기
              </ApplyButton>
              <CancelButton type="button" onClick={dismissProposal}>
                원래 코스 유지하기
              </CancelButton>
            </ProposalActions>
          </Wrap>
        </motion.div>
      </AnimatePresence>
    );
  }


  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`board-${board.title}`}
        initial={reduceMotion ? false : { opacity: 0, y: 24, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={reduceMotion ? undefined : { opacity: 0, filter: 'blur(8px)' }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <Wrap style={{ opacity: isExploring ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
          <HeaderRow>
            <div>
              <SectionTitle>{board.title}</SectionTitle>
              <QuerySummary>{board.querySummary}</QuerySummary>
            </div>
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
            />
          )}

          {activeView === 'MAP' && (
            <JourneyMapView board={board} focusedRef={null} onFocus={() => {}} />
          )}

          {activeView === 'RELATION' && (
            <JourneyRelationView
              board={board}
              focusedRef={null}
              onFocus={() => {}}
            />
          )}


        </Wrap>
      </motion.div>
    </AnimatePresence>
  );
}
