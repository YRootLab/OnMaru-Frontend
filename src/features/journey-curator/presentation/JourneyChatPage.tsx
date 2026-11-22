'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import JourneyChatInterface from './JourneyChatInterface';
import { useJourneyConversation } from './hooks/useJourneyConversation';

function readExplorationId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('exploration');
}

function readInitialQuery(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('query');
}

export default function JourneyChatPage() {
  const [selectedExplorationId, setSelectedExplorationId] = useState<string | null>(readExplorationId);
  const conversation = useJourneyConversation(selectedExplorationId);
  const initialQueryHandledRef = useRef(false);

  useEffect(() => {
    const syncFromUrl = () => setSelectedExplorationId(readExplorationId());
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const selectConversation = useCallback((explorationId: string | null) => {
    const url = new URL(window.location.href);
    if (explorationId) {
      url.searchParams.set('exploration', explorationId);
    } else {
      url.searchParams.delete('exploration');
    }
    url.searchParams.delete('query');
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    setSelectedExplorationId(explorationId);
    if (explorationId) {
      void conversation.loadConversation(explorationId);
    }
  }, [conversation]);

  useEffect(() => {
    if (!conversation.activeExplorationId || conversation.activeExplorationId === selectedExplorationId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('exploration', conversation.activeExplorationId);
    url.searchParams.delete('query');
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    setSelectedExplorationId(conversation.activeExplorationId);
  }, [conversation.activeExplorationId, selectedExplorationId]);

  useEffect(() => {
    if (initialQueryHandledRef.current) return;
    const initialQuery = readInitialQuery();
    if (initialQuery && !conversation.loading) {
      initialQueryHandledRef.current = true;
      void conversation.startConversation(initialQuery);
    }
  }, [conversation.loading, conversation.startConversation]);

  return (
    <JourneyChatInterface
      explorations={conversation.explorations}
      activeExplorationId={conversation.activeExplorationId}
      turns={conversation.turns}
      pendingQuery={conversation.pendingQuery}
      progressMessage={conversation.progress?.message ?? null}
      loading={conversation.loading}
      loadingOlder={conversation.loadingOlder}
      hasOlderTurns={conversation.hasOlderTurns}
      error={conversation.error}
      onSelectConversation={selectConversation}
      onLoadOlder={() => void conversation.loadOlderTurns()}
      onSend={async (query) => {
        if (conversation.activeExplorationId) await conversation.sendTurn(query);
        else await conversation.startConversation(query);
      }}
      onCancel={() => conversation.cancelRun()}
    />
  );
}
