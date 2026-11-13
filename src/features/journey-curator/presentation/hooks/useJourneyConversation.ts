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

type ConversationProgress = {
  runId: string;
  stage: string | null;
  message: string;
} | null;

function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

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
  const activeIdRef = useRef(activeExplorationId);
  const acceptedRef = useRef<RunAccepted | null>(null);
  const latestSequenceRef = useRef(0);
  const recoveringRef = useRef(false);

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
      error: null,
    }));

    try {
      const [snapshot, turnPage] = await Promise.all([
        repository.getExploration(explorationId),
        repository.listTurns({ explorationId, limit: 20 }),
      ]);
      if (version !== loadVersionRef.current || activeIdRef.current !== explorationId) return;

      latestSequenceRef.current = snapshot.latestRun?.sequence ?? 0;
      setState((current) => ({
        ...current,
        activeExplorationId: explorationId,
        snapshot,
        turns: [...turnPage.items].reverse(),
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
    if (recoveringRef.current) return;
    recoveringRef.current = true;
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
      recoveringRef.current = false;
    }
  }, [closeStream, loadConversation, refreshSidebar, repository]);

  const beginRun = useCallback(async (accepted: RunAccepted) => {
    acceptedRef.current = accepted;
    activeIdRef.current = accepted.explorationId;
    setState((current) => ({ ...current, activeExplorationId: accepted.explorationId }));
    await recoverAcceptedRun(accepted);
  }, [recoverAcceptedRun]);

  const startConversation = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setState((current) => ({ ...current, pendingQuery: trimmed, error: null }));
    try {
      const accepted = await repository.createExploration({ query: trimmed, idempotencyKey: createUuid() });
      await beginRun(accepted);
    } catch {
      setState((current) => ({ ...current, pendingQuery: null, error: '여정을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.' }));
    }
  }, [beginRun, repository]);

  const sendTurn = useCallback(async (query: string) => {
    const trimmed = query.trim();
    const snapshot = state.snapshot;
    if (!trimmed || !snapshot || isActiveRun(snapshot.latestRun)) return;
    setState((current) => ({ ...current, pendingQuery: trimmed, error: null }));
    try {
      const accepted = await repository.createTurn({
        explorationId: snapshot.explorationId,
        query: trimmed,
        baseVersion: snapshot.stateVersion,
        clientTurnId: createUuid(),
        idempotencyKey: createUuid(),
      });
      await beginRun(accepted);
    } catch {
      setState((current) => ({ ...current, pendingQuery: null, error: '질문을 보내지 못했어요. 잠시 후 다시 시도해 주세요.' }));
    }
  }, [beginRun, repository, state.snapshot]);

  const loadOlderTurns = useCallback(async () => {
    const explorationId = state.activeExplorationId;
    if (!explorationId || state.loadingOlder || !state.hasOlderTurns) return;
    setState((current) => ({ ...current, loadingOlder: true }));
    try {
      const page = await repository.listTurns({ explorationId, limit: 20, cursor: state.olderCursor ?? undefined });
      setState((current) => ({
        ...current,
        turns: [...page.items].reverse().concat(current.turns),
        olderCursor: page.nextCursor,
        hasOlderTurns: page.hasMore,
        loadingOlder: false,
      }));
    } catch {
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

  useEffect(() => {
    void refreshSidebar().catch(() => {
      setState((current) => ({ ...current, loading: false, error: '대화 목록을 불러오지 못했어요.' }));
    });
  }, [refreshSidebar]);

  useEffect(() => {
    if (activeExplorationId && activeExplorationId === activeIdRef.current) return;
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

  useEffect(() => () => closeStream(), [closeStream]);

  return {
    ...state,
    loadConversation,
    startConversation,
    sendTurn,
    loadOlderTurns,
    cancelRun,
    refreshSidebar,
  };
}
