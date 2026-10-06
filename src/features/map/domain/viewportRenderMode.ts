import type { ViewportRenderMode } from '@/features/map/types';

export function resolveViewportRenderMode(level: number): ViewportRenderMode {
  if (level <= 6) return 'PLACE';
  if (level <= 7) return 'CLUSTER';
  if (level <= 10) return 'DISTRICT';
  return 'REGION';
}
