'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationRepository } from '../../application/conversationRepository';
import type {
  ConversationSnapshot,
  ExplorationSummary,
  ExplorationTurn,
} from '../../domain/conversation';
import { getJourneyStageMessage } from '../../domain/journeyConversation';
import { conversationHttpRepository } from '../../infrastructure/conversationHttpRepository';
import type { RunAccepted } from '../../api/journeyApi';
import type { JourneyRunSnapshot, JourneySseFrame } from '../../api/journeyContract';
import { generateUUID } from '@/lib/uuid';

type ConversationProgress = {
  runId: string;
  stage: string | null;
  message: string;
} | null;

const createUuid = generateUUID;

function isActiveRun(run: JourneyRunSnapshot | null): boolean {
  return run?.status === 'QUEUED' || run?.status === 'RUNNING';
}

export type JourneyConversationState = {
  explorations: ExplorationSummary[];
  activeExplorationId: string | null;
  snapshot: ConversationSnapshot | null;
  turns: ExplorationTurn[];
  progress: ConversationProgress;
  pendingQuery: string | null;
  loading: boolean;
  loadingOlder: boolean;
  olderCursor: string | null;
  hasOlderTurns: boolean;
  error: string | null;
};

export function useJourneyConversation(
  activeExplorationId: string | null,
  repository: ConversationRepository = conversationHttpRepository,
) {
  const [state, setState] = useState<JourneyConversationState>({
    explorations: [],
    activeExplorationId,
    snapshot: null,
    turns: [],
    progress: null,
    pendingQuery: null,
    loading: true,
    loadingOlder: false,
    olderCursor: null,
    hasOlderTurns: false,
    error: null,
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const loadVersionRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);
  const acceptedRef = useRef<RunAccepted | null>(null);
  const latestSequenceRef = useRef(0);
  const recoveringRunIdsRef = useRef(new Set<string>());
  const selectionVersionRef = useRef(0);
  const requestInFlightRef = useRef(false);

  const closeStream = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);

  const refreshSidebar = useCallback(async () => {
    const page = await repository.listExplorations({ limit: 20 });
    setState((current) => ({ ...current, explorations: page.items }));
  }, [repository]);

  const loadConversation = useCallback(async (explorationId: string, options?: { preserveTurns?: boolean }) => {
    const version = ++loadVersionRef.current;
    activeIdRef.current = explorationId;
    setState((current) => ({
      ...current,
      activeExplorationId: explorationId,
      loading: !options?.preserveTurns,
      loadingOlder: false,
      error: null,
    }));

    try {
      const snapshotPromise = repository.getExploration(explorationId);
      const turnPagePromise = repository.listTurns({ explorationId, limit: 20 }).catch(() => ({
        schemaVersion: '1.3',
        items: [] as ExplorationTurn[],
        nextCursor: null,
        hasMore: false,
      }));

      const [snapshot, turnPage] = await Promise.all([snapshotPromise, turnPagePromise]);
      if (version !== loadVersionRef.current || activeIdRef.current !== explorationId) return;

      latestSequenceRef.current = snapshot.latestRun?.sequence ?? 0;

      let turns = [...turnPage.items].reverse();
      if (turns.length === 0 && snapshot.board) {
        const recentQueries = (snapshot as { recentHistory?: Array<{ query?: string }> }).recentHistory;
        const queryFromHistory = recentQueries?.find((h) => h?.query)?.query;
        const initialQuery = queryFromHistory || snapshot.board.querySummary || '추천 여행 일정';
        turns = [
          {
            turnId: snapshot.latestRun?.runId ?? `init-${snapshot.explorationId}`,
            query: initialQuery,
            createdAt: snapshot.updatedAt,
            runId: snapshot.latestRun?.runId ?? null,
            response: {
              status: (snapshot.latestRun?.status as any) ?? 'COMPLETED',
              outcome: snapshot.latestRun?.outcome ?? 'INITIAL_BOARD',
              summary: snapshot.board.querySummary,
              board: snapshot.board,
              proposal: snapshot.pendingProposal,
              clarification: snapshot.latestRun?.clarification ?? null,
              error: snapshot.latestRun?.error ?? null,
            },
          },
        ];
      }

      setState((current) => ({
        ...current,
        activeExplorationId: explorationId,
        snapshot,
        turns,
        progress: isActiveRun(snapshot.latestRun)
          ? {
              runId: snapshot.latestRun!.runId,
              stage: snapshot.latestRun!.stage,
              message: getJourneyStageMessage(snapshot.latestRun!.stage),
            }
          : null,
        pendingQuery: null,
        loading: false,
        olderCursor: turnPage.nextCursor,
        hasOlderTurns: turnPage.hasMore,
      }));
    } catch {
      if (version !== loadVersionRef.current) return;
      setState((current) => ({ ...current, loading: false, error: '대화를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }));
    }
  }, [repository]);

  const recoverAcceptedRun = useCallback(async (accepted: RunAccepted) => {
    if (recoveringRunIdsRef.current.has(accepted.runId)) return;
    recoveringRunIdsRef.current.add(accepted.runId);
    closeStream();

    try {
      const { run, snapshot } = await repository.getAcceptedSnapshots(accepted);
      if (activeIdRef.current !== accepted.explorationId) return;

      latestSequenceRef.current = run.sequence;
      setState((current) => ({
        ...current,
        snapshot,
        progress: isActiveRun(run)
          ? { runId: run.runId, stage: run.stage, message: getJourneyStageMessage(run.stage) }
          : null,
      }));

      if (!isActiveRun(run)) {
        await loadConversation(accepted.explorationId, { preserveTurns: true });
        await refreshSidebar();
        return;
      }

      unsubscribeRef.current = repository.subscribeToRunEvents(
        accepted.eventsUrl,
        (frame: JourneySseFrame) => {
          if (activeIdRef.current !== accepted.explorationId) return;
          if (frame.event === 'reset' || frame.event === 'run.terminal') {
            void recoverAcceptedRun(accepted);
            return;
          }
          if (frame.event === 'auth_closed') {
            closeStream();
            setState((current) => ({ ...current, error: '로그인이 필요해요.' }));
            return;
          }
          if (frame.data.sequence <= latestSequenceRef.current) return;
          latestSequenceRef.current = frame.data.sequence;
          if (frame.event === 'run.stage') {
            setState((current) => ({
              ...current,
              progress: {
                runId: frame.data.runId,
                stage: frame.data.stage,
                message: getJourneyStageMessage(frame.data.stage),
              },
            }));
          }
        },
        () => {
          // EventSource retries itself. A server terminal/reset is handled by its explicit event.
        },
      );
    } catch {
      if (activeIdRef.current === accepted.explorationId) {
        setState((current) => ({ ...current, error: '여정 상태를 복구하지 못했어요. 잠시 후 다시 시도해 주세요.' }));
      }
    } finally {
      recoveringRunIdsRef.current.delete(accepted.runId);
    }
  }, [closeStream, loadConversation, refreshSidebar, repository]);

  const beginRun = useCallback(async (accepted: RunAccepted) => {
    acceptedRef.current = accepted;
    if (activeIdRef.current !== accepted.explorationId) selectionVersionRef.current += 1;
    activeIdRef.current = accepted.explorationId;
    setState((current) => ({ ...current, activeExplorationId: accepted.explorationId }));
    await recoverAcceptedRun(accepted);
  }, [recoverAcceptedRun]);

  const startConversation = useCallback(async (query: string): Promise<string | null> => {
    const trimmed = query.trim();
    if (!trimmed || requestInFlightRef.current) return null;
    const selectionVersion = selectionVersionRef.current;
    requestInFlightRef.current = true;
    setState((current) => ({ ...current, pendingQuery: trimmed, error: null }));
    try {
      const accepted = await repository.createExploration({ query: trimmed, idempotencyKey: createUuid() });
      if (selectionVersion !== selectionVersionRef.current) return null;
      await beginRun(accepted);
      return accepted.explorationId;
    } catch {
      if (selectionVersion === selectionVersionRef.current) setState((current) => ({ ...current, pendingQuery: null, error: '여정을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.' }));
      return null;
    } finally {
      requestInFlightRef.current = false;
    }
  }, [beginRun, repository]);

  const sendTurn = useCallback(async (query: string, clarificationAnswer?: { clarificationId: string; choiceId: string | null; text: string | null }) => {
    const trimmed = query.trim();
    const snapshot = state.snapshot;
    if (!trimmed || !snapshot || isActiveRun(snapshot.latestRun) || requestInFlightRef.current) return;
    const selectionVersion = selectionVersionRef.current;
    requestInFlightRef.current = true;
    setState((current) => ({ ...current, pendingQuery: trimmed, error: null }));
    try {
      const accepted = await repository.createTurn({
        explorationId: snapshot.explorationId,
        query: trimmed,
        baseVersion: snapshot.stateVersion,
        clientTurnId: createUuid(),
        clarificationAnswer,
        idempotencyKey: createUuid(),
      });
      if (selectionVersion === selectionVersionRef.current) await beginRun(accepted);
    } catch {
      if (selectionVersion === selectionVersionRef.current) setState((current) => ({ ...current, pendingQuery: null, error: '질문을 보내지 못했어요. 잠시 후 다시 시도해 주세요.' }));
    } finally {
      requestInFlightRef.current = false;
    }
  }, [beginRun, repository, state.snapshot]);

  const loadOlderTurns = useCallback(async () => {
    const explorationId = state.activeExplorationId;
    if (!explorationId || state.loadingOlder || !state.hasOlderTurns) return;
    const version = loadVersionRef.current;
    setState((current) => ({ ...current, loadingOlder: true }));
    try {
      const page = await repository.listTurns({ explorationId, limit: 20, cursor: state.olderCursor ?? undefined });
      if (version !== loadVersionRef.current || activeIdRef.current !== explorationId) return;
      setState((current) => ({
        ...current,
        turns: [...page.items].reverse().concat(current.turns),
        olderCursor: page.nextCursor,
        hasOlderTurns: page.hasMore,
        loadingOlder: false,
      }));
    } catch {
      if (version !== loadVersionRef.current || activeIdRef.current !== explorationId) return;
      setState((current) => ({ ...current, loadingOlder: false, error: '이전 대화를 불러오지 못했어요.' }));
    }
  }, [repository, state.activeExplorationId, state.hasOlderTurns, state.loadingOlder]);

  const cancelRun = useCallback(async () => {
    const snapshot = state.snapshot;
    const runId = acceptedRef.current?.runId ?? snapshot?.latestRun?.runId;
    if (!snapshot || !runId) return;
    try {
      await repository.cancelRun({ explorationId: snapshot.explorationId, runId, idempotencyKey: createUuid() });
      if (acceptedRef.current) await recoverAcceptedRun(acceptedRef.current);
      else await loadConversation(snapshot.explorationId);
    } catch {
      setState((current) => ({ ...current, error: '실행을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.' }));
    }
  }, [loadConversation, recoverAcceptedRun, repository, state.snapshot]);

  const recoverCurrentRun = useCallback(async () => {
    if (acceptedRef.current) await recoverAcceptedRun(acceptedRef.current);
  }, [recoverAcceptedRun]);

  useEffect(() => {
    void refreshSidebar().catch(() => {
      setState((current) => ({ ...current, loading: false, error: '대화 목록을 불러오지 못했어요.' }));
    });
  }, [refreshSidebar]);

  useEffect(() => {
    if (activeExplorationId && activeExplorationId === activeIdRef.current) return;
    selectionVersionRef.current += 1;
    closeStream();
    acceptedRef.current = null;
    if (!activeExplorationId) {
      activeIdRef.current = null;
      setState((current) => ({ ...current, activeExplorationId: null, snapshot: null, turns: [], progress: null, pendingQuery: null, loading: false }));
      return;
    }
    void loadConversation(activeExplorationId);
    return closeStream;
  }, [activeExplorationId, closeStream, loadConversation]);

  useEffect(() => {
    const accepted = acceptedRef.current;
    const run = state.snapshot?.latestRun;
    if (accepted && run && isActiveRun(run) && accepted.explorationId === state.activeExplorationId && accepted.runId === run.runId) void recoverAcceptedRun(accepted);
  }, [recoverAcceptedRun, state.activeExplorationId, state.snapshot?.latestRun?.runId, state.snapshot?.latestRun?.status]);

  useEffect(() => () => closeStream(), [closeStream]);

  return {
    ...state,
    loadConversation,
    startConversation,
    sendTurn,
    loadOlderTurns,
    cancelRun,
    recoverCurrentRun,
    refreshSidebar,
  };
}
