export function shouldShowJourneyConversation({
  requested,
  explorationId,
}: {
  requested: boolean;
  explorationId: string | null;
}): boolean {
  return requested || Boolean(explorationId);
}
