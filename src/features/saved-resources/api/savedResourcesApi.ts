import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import type { CursorPage } from '@/lib/api/cursor';
import type { SavedOdiiStorySummary, SavedPlaceSummary } from './savedResourcesContract';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type SavedResourcesRepository = {
  savePlace(placeId: string): Promise<{ resourceType: 'PLACE'; resourceId: string; savedByMe: true; savedAt: string }>;
  unsavePlace(placeId: string): Promise<void>;
  listPlaces(input?: { limit?: number; cursor?: string }): Promise<CursorPage<SavedPlaceSummary>>;
  saveOdiiStory(storyId: string): Promise<{ resourceType: 'ODII_STORY'; resourceId: string; savedByMe: true; savedAt: string }>;
  unsaveOdiiStory(storyId: string): Promise<void>;
  listOdiiStories(input?: { limit?: number; cursor?: string }): Promise<CursorPage<SavedOdiiStorySummary>>;
};

export function createSavedResourcesRepository(request: RequestFn = apiRequest): SavedResourcesRepository {
  return {
    savePlace(placeId) {
      return request(`/saved-resources/places/${placeId}`, { method: 'PUT', csrf: true });
    },
    unsavePlace(placeId) {
      return request<void>(`/saved-resources/places/${placeId}`, { method: 'DELETE', csrf: true });
    },
    listPlaces(input = {}) {
      return request<CursorPage<SavedPlaceSummary>>('/saved-resources', {
        method: 'GET',
        cache: 'no-store',
        params: { type: 'PLACE', limit: input.limit ?? 20, cursor: input.cursor },
      });
    },
    saveOdiiStory(storyId) {
      return request(`/saved-resources/odii-stories/${storyId}`, { method: 'PUT', csrf: true });
    },
    unsaveOdiiStory(storyId) {
      return request<void>(`/saved-resources/odii-stories/${storyId}`, { method: 'DELETE', csrf: true });
    },
    listOdiiStories(input = {}) {
      return request<CursorPage<SavedOdiiStorySummary>>('/saved-resources', {
        method: 'GET',
        cache: 'no-store',
        params: { type: 'ODII_STORY', limit: input.limit ?? 20, cursor: input.cursor },
      });
    },
  };
}

export const defaultSavedResourcesRepository = createSavedResourcesRepository();
