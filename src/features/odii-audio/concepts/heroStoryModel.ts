export function resolveConceptHeroStory<T extends { audioUrl?: string }>(
  current: T,
  stories: T[],
  storySets: Record<string, T[]>,
): T {
  if (current.audioUrl) return current;
  return storySets['추천']?.[0] ?? stories[0] ?? current;
}
