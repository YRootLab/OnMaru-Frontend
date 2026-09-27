'use client';

import { useMemo } from 'react';
import type { SorimaruRepository } from '../application/SorimaruRepository';
import type { SorimaruStoryDetail, SorimaruStorySummary } from '../domain/sorimaruStory';
import type { SorimaruStoryItem } from '../types/sorimaru.types';
import { resolveSorimaruSelectionIntent, type SorimaruSelectionIntent } from '../components/sorimaruInitialLoad';
import { useSorimaruAudioStore } from '../store/useSorimaruAudioStore';

interface SorimaruLegacyPlayer {
  selectStory(story: SorimaruStoryItem): void;
  setIsPlaying(isPlaying: boolean): void;
}

function toPlayableStory(detail: SorimaruStoryDetail): SorimaruStoryItem {
  const placeId = detail.linkedPlaceId ?? '';
  return {
    tid: detail.storyId,
    tlid: placeId,
    stid: detail.storyId,
    stlid: placeId,
    title: detail.title,
    audioTitle: detail.audioTitle,
    category: detail.category,
    mapX: detail.coordinates ? String(detail.coordinates.lng) : '',
    mapY: detail.coordinates ? String(detail.coordinates.lat) : '',
    script: detail.transcript.map((line) => line.text).join('\n'),
    playTime: String(detail.durationSeconds),
    audioUrl: detail.audioUrl,
    imageUrl: detail.imageUrl ?? '',
    tags: detail.contentTags,
    locationName: detail.region.name,
  };
}

export function createSorimaruDetailSelectionController(repository: SorimaruRepository, player: SorimaruLegacyPlayer) {
  let generation = 0;
  let lastSelectionKey: string | null = null;
  let lastFailure: unknown = null;
  let hasFailure = false;
  let pendingRequest: { key: string; promise: Promise<void> } | null = null;

  function selectFromIntent(
    stories: SorimaruStorySummary[],
    intent: SorimaruSelectionIntent & { autoPlay: boolean },
    force = false,
  ): Promise<void> {
    const target = resolveSorimaruSelectionIntent(stories, intent);
    const storyId = intent.stid || target?.storyId;
    if (!storyId) {
      generation += 1;
      lastSelectionKey = null;
      lastFailure = null;
      hasFailure = false;
      pendingRequest = null;
      return Promise.resolve();
    }
    const key = `${storyId}\u0000${intent.autoPlay}`;
    if (!force && lastSelectionKey === key) {
      if (pendingRequest?.key === key) return pendingRequest.promise;
      if (hasFailure) return Promise.reject(lastFailure);
      return Promise.resolve();
    }
    lastSelectionKey = key;
    lastFailure = null;
    hasFailure = false;
    const requestGeneration = ++generation;
    const request: Promise<void> = Promise.resolve()
      .then(() => repository.getStoryDetail(storyId, 'ko-KR'))
      .then((detail) => {
        if (requestGeneration !== generation) return;
        player.selectStory(toPlayableStory(detail));
        if (intent.autoPlay) player.setIsPlaying(true);
      })
      .catch((reason: unknown) => {
        if (requestGeneration === generation) {
          lastFailure = reason;
          hasFailure = true;
        }
        throw reason;
      })
      .finally(() => {
        if (pendingRequest?.promise === request) pendingRequest = null;
      });
    pendingRequest = { key, promise: request };
    return request;
  }

  return { selectFromIntent };
}

export function useSorimaruDetailSelection(repository: SorimaruRepository) {
  const controller = useMemo(() => createSorimaruDetailSelectionController(repository, {
    selectStory: (story) => useSorimaruAudioStore.getState().selectStory(story),
    setIsPlaying: (isPlaying) => useSorimaruAudioStore.getState().setIsPlaying(isPlaying),
  }), [repository]);
  return controller.selectFromIntent;
}
