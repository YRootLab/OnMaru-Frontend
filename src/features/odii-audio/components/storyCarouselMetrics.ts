export interface RailMetrics {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

export interface RailIndicator {
  left: number;
  width: number;
  index: number;
}

export function getRailIndicator(metrics: RailMetrics, storyCount: number): RailIndicator {
  const maxScrollLeft = metrics.scrollWidth - metrics.clientWidth;
  if (maxScrollLeft <= 4) return { left: 0, width: 100, index: 1 };

  const width = Math.max(18, Math.min(100, (metrics.clientWidth / metrics.scrollWidth) * 100));
  const left = (metrics.scrollLeft / maxScrollLeft) * (100 - width);
  const index = Math.min(
    storyCount,
    Math.max(1, Math.round((metrics.scrollLeft / maxScrollLeft) * (storyCount - 1)) + 1),
  );
  return { left, width, index };
}

export function shouldUpdateRailIndicator(previous: RailIndicator, next: RailIndicator): boolean {
  return previous.left !== next.left || previous.width !== next.width || previous.index !== next.index;
}
