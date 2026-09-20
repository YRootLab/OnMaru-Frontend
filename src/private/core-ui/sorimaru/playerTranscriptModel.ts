export interface TranscriptFollowInput {
  isUserScrolling: boolean;
  activeLineChanged: boolean;
  requestedSeek: boolean;
}

export function normalizeContentTags(values: readonly (string | null | undefined)[]): string[] {
  const normalized = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return [...new Set(normalized)].slice(0, 7);
}

export function shouldFollowTranscript({
  isUserScrolling,
  activeLineChanged,
  requestedSeek,
}: TranscriptFollowInput): boolean {
  return requestedSeek || (activeLineChanged && !isUserScrolling);
}
