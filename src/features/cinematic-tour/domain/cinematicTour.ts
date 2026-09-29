import type { SorimaruStoryItem, TourWaypoint } from '@/features/sorimaru-audio/types/sorimaru.types';

export type { SorimaruStoryItem, TourWaypoint };

export function parseScriptSentences(script: string): string[] {
  if (!script) return [];
  const clean = script.replace(/\r?\n+/g, ' ').trim();
  const rawSentences = clean.split(/(?<=[.?!])\s+/);
  const result: string[] = [];
  for (const item of rawSentences) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > 50 && trimmed.includes(',')) {
      const parts = trimmed.split(/,\s+/);
      result.push(...parts.map((p) => p.trim()).filter(Boolean));
    } else {
      result.push(trimmed);
    }
  }
  return result.length > 0 ? result : [clean];
}

export function calculateActiveSentenceIndex(
  sentences: string[],
  currentTime: number,
  duration: number,
): { index: number; sentence: string } {
  if (sentences.length === 0) return { index: 0, sentence: '' };
  if (sentences.length === 1) return { index: 0, sentence: sentences[0] };
  const validDuration = Math.max(1, duration);
  const weights = sentences.map((s) => Math.max(8, s.length + 4));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let accumulatedTime = 0;
  for (let i = 0; i < sentences.length; i++) {
    const sentenceDuration = (weights[i] / totalWeight) * validDuration;
    accumulatedTime += sentenceDuration;
    if (currentTime < accumulatedTime) {
      return { index: i, sentence: sentences[i] };
    }
  }
  const lastIndex = sentences.length - 1;
  return { index: lastIndex, sentence: sentences[lastIndex] };
}
