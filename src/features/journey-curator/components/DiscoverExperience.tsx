'use client';

import { useReducer, useRef, useState } from 'react';
import type React from 'react';
import styled from '@emotion/styled';
import { Compass, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { defaultJourneyRepository, type ExplorationSnapshot, type JourneyRepository } from '../api/journeyApi';
import { parseJourneySseFrame } from '../reducers/journeySseParser';
import {
  createInitialJourneyRunState,
  reduceJourneyRunState,
  shouldRecoverJourneySnapshot,
} from '../reducers/journeyRunReducer';
import BentoJourneyGrid from './BentoJourneyGrid';
import KnowledgeGraphView from './KnowledgeGraphView';
import { useJourneyStore } from '../store/useJourneyStore';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { getPlaceSlipMotion } from '@/shared/motion/placeSlip';

type DiscoverExperienceProps = {
  repository?: JourneyRepository;
};

const Root = styled.main`
  min-height: calc(100vh - 66px);
  padding: 56px 20px 96px;
  background: #f8f8f7;
`;

const Shell = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  width: min(1120px, 100%);
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  min-width: 0;
`;

const Hero = styled(motion.section)`
  padding: 22px;
  border: 1px solid #e5e5e3;
  border-radius: 16px;
  background: #fff;
`;

const Title = styled.h1`
  margin: 0 0 8px;
  color: #1f2328;
  font-family: var(--font-hanok);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 300;
`;

const Lead = styled.p`
  margin: 0 0 18px;
  color: #626b75;
  font-size: 14px;
  line-height: 1.65;
`;

const Form = styled.form`
  display: flex;
  gap: 8px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  height: 44px;
  border: 1px solid #d9d9d7;
  border-radius: 10px;
  padding: 0 12px;
  background: #f8f8f7;
  color: #1f2328;
  font: inherit;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 44px;
  border: 0;
  border-radius: 10px;
  padding: 0 16px;
  background: #1f2328;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`;

const SideRail = styled(motion.aside)`
  align-self: start;
  position: sticky;
  top: 82px;
  padding: 16px;
  border: 1px solid #e5e5e3;
  border-radius: 16px;
  background: #fff;

  @media (max-width: 900px) {
    position: static;
  }
`;

const RailTitle = styled.h2`
  margin: 0 0 10px;
  color: #1f2328;
  font-size: 14px;
  font-weight: 900;
`;

const Status = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #626b75;
  font-size: 12px;
  line-height: 1.5;
`;

const Badge = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 9999px;
  background: rgba(47, 111, 78, 0.12);
  color: #2f6f4e;
  font-size: 11px;
  font-weight: 900;
`;

const BoardWrap = styled(motion.div)`
  margin-top: 18px;
  overflow: hidden;
`;

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stageLabel(stage: string | null | undefined): string {
  if (stage === 'INTERPRETING') return '조건을 읽는 중';
  if (stage === 'RETRIEVING') return '장소 후보를 고르는 중';
  if (stage === 'VALIDATING') return '동선을 확인하는 중';
  if (stage === 'PERSISTING') return '결과를 정리하는 중';
  return '서버 결과를 기다리는 중';
}

export default function DiscoverExperience({ repository = defaultJourneyRepository }: DiscoverExperienceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isGenerating = useJourneyStore((state) => state.isGenerating);
  const [query, setQuery] = useState('');
  const [snapshot, setSnapshot] = useState<ExplorationSnapshot | null>(null);
  const [uiState, dispatch] = useReducer(reduceJourneyRunState, undefined, createInitialJourneyRunState);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const acceptedRef = useRef<{ explorationId: string; runId: string } | null>(null);

  const syncSnapshot = async (explorationId: string, runId: string) => {
    const [run, exploration] = await Promise.all([
      repository.getRun(explorationId, runId),
      repository.getExploration(explorationId),
    ]);
    dispatch({ type: 'snapshot-synced', run });
    setSnapshot(exploration);
    if (exploration.board) {
      useJourneyStore.setState({ currentPlan: exploration.board, hasSearched: true, isGenerating: false });
    }
  };

  const startStream = (eventsUrl: string, explorationId: string, runId: string) => {
    if (typeof EventSource === 'undefined' || eventsUrl.startsWith('/explorations/fixture')) {
      window.setTimeout(() => void syncSnapshot(explorationId, runId), 500);
      return;
    }

    const source = new EventSource(eventsUrl, { withCredentials: true });
    eventSourceRef.current = source;
    const handle = (event: MessageEvent, eventName: string) => {
      const frame = parseJourneySseFrame({ id: event.lastEventId, event: eventName, data: event.data });
      dispatch({ type: 'sse-frame', frame });
      const shouldSync =
        eventName === 'run.terminal' ||
        eventName === 'reset' ||
        shouldRecoverJourneySnapshot(reduceJourneyRunState(createInitialJourneyRunState(), { type: 'sse-frame', frame }));
      if (shouldSync) {
        source.close();
        void syncSnapshot(explorationId, runId);
      }
    };
    source.addEventListener('run.stage', (event) => handle(event, 'run.stage'));
    source.addEventListener('run.terminal', (event) => handle(event, 'run.terminal'));
    source.addEventListener('heartbeat', (event) => handle(event, 'heartbeat'));
    source.addEventListener('reset', (event) => handle(event, 'reset'));
    source.onerror = () => {
      source.close();
      window.setTimeout(() => void syncSnapshot(explorationId, runId), 1000);
    };
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setSnapshot(null);
    useJourneyStore.setState({ isGenerating: true, hasSearched: true });
    eventSourceRef.current?.close();
    try {
      const accepted = await repository.start({ query: query.trim(), idempotencyKey: createId() });
      acceptedRef.current = accepted;
      startStream(accepted.eventsUrl, accepted.explorationId, accepted.runId);
    } catch {
      useJourneyStore.setState({ isGenerating: false });
      setError('여정 실행을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const cancel = async () => {
    const accepted = acceptedRef.current;
    if (!accepted) return;
    eventSourceRef.current?.close();
    const run = await repository.cancelRun(accepted.explorationId, accepted.runId);
    dispatch({ type: 'snapshot-synced', run });
    useJourneyStore.setState({ isGenerating: false });
  };

  const activeRun = uiState.run;

  return (
    <Root>
      <Shell>
        <MainColumn>
          <Hero {...getPlaceSlipMotion({ reducedMotion })}>
            <Title>여정을 다시 짓는 책상</Title>
            <Lead>질문을 보내면 서버 run을 만들고, 진행 알림 뒤 snapshot으로 결과를 맞춥니다.</Lead>
            <Form onSubmit={submit}>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="예: 전주에서 반나절 동안 한옥과 차를 조용히 즐기고 싶어요"
              />
              <Button type="submit" disabled={!query.trim() || isGenerating}>
                <Compass size={16} />
                여정 짓기
              </Button>
            </Form>
          </Hero>

          {snapshot?.board && (
            <BoardWrap {...getPlaceSlipMotion({ reducedMotion, index: 1 })}>
              <KnowledgeGraphView />
              <BentoJourneyGrid />
            </BoardWrap>
          )}
        </MainColumn>

        <SideRail {...getPlaceSlipMotion({ reducedMotion, index: 1 })}>
          <RailTitle>실행 상태</RailTitle>
          <Status>
            {uiState.badgeLabel && (
              <Badge>
                <Sparkles size={12} />
                {uiState.badgeLabel}
              </Badge>
            )}
            <span>{activeRun ? stageLabel(activeRun.stage) : '아직 실행 전입니다.'}</span>
            {uiState.connection.status === 'terminal' && <span>완료 알림을 받아 snapshot을 다시 맞췄습니다.</span>}
            {uiState.connection.status === 'reset' && <span>서버 재시작 신호를 받아 snapshot을 다시 읽었습니다.</span>}
            {error && <span role="alert">{error}</span>}
            {isGenerating && (
              <Button type="button" onClick={() => void cancel()}>
                <Loader2 size={15} />
                실행 취소
              </Button>
            )}
          </Status>
        </SideRail>
      </Shell>
    </Root>
  );
}
