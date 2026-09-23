import { apiRequest } from '@/lib/api/client';

export async function recordOdiiPlay(storyId: string): Promise<void> {
  if (!storyId) return;
  await apiRequest(`/odii/stories/${encodeURIComponent(storyId)}/plays`, { method: 'POST', csrf: true });
}

export async function saveOdiiStory(storyId: string): Promise<void> {
  await apiRequest(`/saved-resources/odii-stories/${encodeURIComponent(storyId)}`, { method: 'PUT', csrf: true });
}

export async function unsaveOdiiStory(storyId: string): Promise<void> {
  await apiRequest<void>(`/saved-resources/odii-stories/${encodeURIComponent(storyId)}`, { method: 'DELETE', csrf: true });
}
