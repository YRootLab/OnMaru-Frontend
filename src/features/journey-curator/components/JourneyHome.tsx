'use client';

import { useCallback, useEffect, useState } from 'react';
import JourneyChatInterface from '../presentation/JourneyChatInterface';
import { useJourneyConversation } from '../presentation/hooks/useJourneyConversation';

function readExplorationId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('exploration');
}

export default function JourneyHome() {
  const [selectedExplorationId, setSelectedExplorationId] = useState<string | null>(null);
  const conversation = useJourneyConversation(selectedExplorationId);

  useEffect(() => {
    const syncFromUrl = () => setSelectedExplorationId(readExplorationId());
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const selectConversation = useCallback((explorationId: string | null) => {
    const url = new URL(window.location.href);
    if (explorationId) url.searchParams.set('exploration', explorationId);
    else url.searchParams.delete('exploration');
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    setSelectedExplorationId(explorationId);
  }, []);

  useEffect(() => {
    if (!conversation.activeExplorationId || conversation.activeExplorationId === selectedExplorationId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('exploration', conversation.activeExplorationId);
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    setSelectedExplorationId(conversation.activeExplorationId);
  }, [conversation.activeExplorationId, selectedExplorationId]);

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
