import { describe, expect, it } from 'vitest';
import { createMapInsightsRepository } from './mapInsights.service';

describe('map insights repository (FE #92)', () => {
  it('calls the backend heatmap and observations endpoints with the right params', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createMapInsightsRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      if (path === '/insights/heatmap') {
        return { schemaVersion: '1.2', coverageStatus: 'MISSING', metric: 'CONGESTION_SCORE', observedDate: '2026-09-15', generatedAt: 'x', spots: [] };
      }
      return { schemaVersion: '1.2', coverageStatus: 'COMPLETE', generatedAt: 'x', items: [] };
    }) as never);

    await repository.getHeatmap({ date: '2026-09-15' });
    await repository.getObservations({ regionCode: 'kr-45-jeonju' });

    expect(calls).toEqual([
      { path: '/insights/heatmap', options: { method: 'GET', params: { date: '2026-09-15' } } },
      { path: '/insights/observations', options: { method: 'GET', params: { regionCode: 'kr-45-jeonju' } } },
    ]);
  });
});
