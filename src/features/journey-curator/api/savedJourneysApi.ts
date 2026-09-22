import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import type { JourneyBoard, ResourceRef, SavedJourneyDetail } from '../types/exploration.types';
import type { RunAccepted } from './journeyApi';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;












export interface SavedJourneysRepository {
  list(): Promise<SavedJourneyDetail[]>;
  create(board: JourneyBoard, pinnedRefs: ResourceRef[], title: string): Promise<SavedJourneyDetail>;
  remove(id: string): Promise<void>;
  resume(id: string, idempotencyKey: string): Promise<RunAccepted>;
}

export function createSavedJourneysRepository(request: RequestFn = apiRequest): SavedJourneysRepository {
  return {
    async list() {
      const res = await request<{ items: SavedJourneyDetail[] }>('/saved-journeys', { method: 'GET', cache: 'no-store' });
      return res.items;
    },
    create(board, pinnedRefs, title) {
      return request<SavedJourneyDetail>('/saved-journeys', {
        method: 'POST',
        body: { title, board, pinnedRefs },
        csrf: true,
      });
    },
    remove(id) {
      return request<void>(`/saved-journeys/${encodeURIComponent(id)}`, { method: 'DELETE', csrf: true });
    },
    resume(id, idempotencyKey) {
      return request<RunAccepted>(`/saved-journeys/${encodeURIComponent(id)}/resume`, {
        method: 'POST',
        body: {},
        csrf: true,
        idempotencyKey,
      });
    },
  };
}

export const defaultSavedJourneysRepository = createSavedJourneysRepository();
