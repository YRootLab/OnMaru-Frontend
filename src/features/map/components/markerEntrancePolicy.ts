type MarkerEntranceInput = {
  hasRendered: boolean;
  categoryChanged: boolean;
  reducedMotion: boolean;
};

export type MarkerEntranceState = {
  hasRendered: boolean;
  category: string | null;
  pendingCategory: boolean;
};

type MarkerEntranceTransitionInput = {
  category: string | null;
  markerCount: number;
  reducedMotion: boolean;
};

export function shouldAnimateMarkerEntrance({
  hasRendered,
  categoryChanged,
  reducedMotion,
}: MarkerEntranceInput): boolean {
  return !reducedMotion && (!hasRendered || categoryChanged);
}

export function advanceMarkerEntranceState(
  current: MarkerEntranceState,
  input: MarkerEntranceTransitionInput,
): { animate: boolean; state: MarkerEntranceState } {
  const pendingCategory = current.pendingCategory || current.category !== input.category;

  if (input.markerCount === 0) {
    return {
      animate: false,
      state: {
        ...current,
        category: input.category,
        pendingCategory,
      },
    };
  }

  return {
    animate: shouldAnimateMarkerEntrance({
      hasRendered: current.hasRendered,
      categoryChanged: pendingCategory,
      reducedMotion: input.reducedMotion,
    }),
    state: {
      hasRendered: true,
      category: input.category,
      pendingCategory: false,
    },
  };
}
