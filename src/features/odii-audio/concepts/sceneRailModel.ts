export function getVisibleSceneIndices(length: number, activeIndex: number) {
  if (length < 1) return { previous: 0, active: 0, next: 0 };
  const active = ((activeIndex % length) + length) % length;
  return {
    previous: (active - 1 + length) % length,
    active,
    next: (active + 1) % length,
  };
}
