'use client';

import { useMemo } from 'react';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStorySummary } from '../domain/sorimaruStory';
import { resolveSorimaruSelectionIntent, type SorimaruSelectionIntent } from '../components/sorimaruInitialLoad';
import { useSorimaruAudioStore } from '../store/useSorimaruAudioStore';

export function createSorimaruDetailSelectionController(repository: SorimaruRepository) {
  let lastSelectionKey: string | null = null;
  let pendingRequest: { key: string; owner: symbol; promise: Promise<void> } | null = null;

  function selectFromIntent(
    stories: SorimaruStorySummary[],
    intent: SorimaruSelectionIntent & { autoPlay: boolean },
    force = false,
  ): Promise<void> {
    const target = resolveSorimaruSelectionIntent(stories, intent);
    const storyId = intent.stid || target?.storyId;
    if (!storyId) {
      if (pendingRequest !== null) {
        useSorimaruAudioStore.getState().cancelPendingDetailSelection(pendingRequest.owner);
      }
      lastSelectionKey = null;
      pendingRequest = null;
      return Promise.resolve();
    }
    const key = `${storyId}\u0000${intent.autoPlay}`;
    if (!force && lastSelectionKey === key) {
      if (pendingRequest?.key === key) return pendingRequest.promise;
      const state = useSorimaruAudioStore.getState();
      if (state.detailStatusById[storyId] === 'error') return Promise.reject(state.detailErrorById[storyId]);
      return Promise.resolve();
    }
    lastSelectionKey = key;
    const owner = Symbol('Sorimaru URL selection');
    const request: Promise<void> = useSorimaruAudioStore.getState().selectAndLoadStory(
      target ?? { storyId }, intent.autoPlay ? 'play' : 'select', repository, owner,
    ).then(() => undefined).finally(() => {
      if (pendingRequest?.promise === request) pendingRequest = null;
    });
    pendingRequest = { key, owner, promise: request };
    return request;
  }

  return { selectFromIntent };
}

export function useSorimaruDetailSelection(repository: SorimaruRepository) {
  const controller = useMemo(() => createSorimaruDetailSelectionController(repository), [repository]);
  return controller.selectFromIntent;
}
