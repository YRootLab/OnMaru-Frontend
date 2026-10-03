type MarkerEntranceInput = {
  hasRendered: boolean;
  categoryChanged: boolean;
  reducedMotion: boolean;
};

export function shouldAnimateMarkerEntrance({
  hasRendered,
  categoryChanged,
  reducedMotion,
}: MarkerEntranceInput): boolean {
  return !reducedMotion && (!hasRendered || categoryChanged);
}
