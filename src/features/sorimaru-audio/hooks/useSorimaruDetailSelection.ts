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

  async function selectFromIntent(
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
      return;
    }
    const key = `${storyId}\u0000${intent.autoPlay}`;
    if (!force && lastSelectionKey === key) {
      if (lastFailure) throw lastFailure;
      return;
    }
    lastSelectionKey = key;
    lastFailure = null;
    const requestGeneration = ++generation;
    try {
      const detail = await repository.getStoryDetail(storyId, 'ko-KR');
      if (requestGeneration !== generation) return;
      player.selectStory(toPlayableStory(detail));
      if (intent.autoPlay) player.setIsPlaying(true);
    } catch (reason) {
      if (requestGeneration === generation) lastFailure = reason;
      throw reason;
    }
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
