import { apiGet } from '@/lib/api/client';
import type {
  DiscoveryTopic,
  DiscoveryPlaceDetail,
  WorkDetail,
  DiscoveryPlacesParams,
  DiscoveryWorksParams,
  DiscoveryPlacesPage,
  DiscoveryWorksPage,
  KContentsPage,
} from '../domain/types';

interface TopicsResponse {
  schemaVersion: string;
  catalogRevision: string;
  countsAsOf: string;
  items: DiscoveryTopic[];
}

export async function fetchDiscoveryTopics(): Promise<DiscoveryTopic[]> {
  const res = await apiGet<TopicsResponse>('/api/v1/discovery/topics');
  if (Array.isArray(res?.items)) return res.items;
  throw new Error('Invalid discovery topics response');
}

export async function fetchDiscoveryPlaces(
  params?: DiscoveryPlacesParams,
): Promise<DiscoveryPlacesPage> {
  const query: Record<string, string> = {};
  if (params?.topic) query.topic = params.topic;
  if (params?.regionCode) query.regionCode = params.regionCode;
  if (params?.placeRole) query.placeRole = params.placeRole;
  if (params?.workId) query.workId = params.workId;
  if (params?.type) query.type = params.type;
  if (params?.sort) query.sort = params.sort;
  if (params?.limit) query.limit = String(params.limit);
  if (params?.cursor) query.cursor = params.cursor;

  const res = await apiGet<DiscoveryPlacesPage>('/api/v1/discovery/places', query);
  if (res && Array.isArray(res.items)) return res;
  throw new Error('Invalid discovery places response');
}

export async function fetchDiscoveryPlaceDetail(
  placeId: string,
): Promise<DiscoveryPlaceDetail | null> {
  const res = await apiGet<DiscoveryPlaceDetail>(
    `/api/v1/discovery/places/${encodeURIComponent(placeId)}`,
  );
  if (res?.placeId) return res;
  throw new Error('Invalid discovery place detail response');
}

export async function fetchDiscoveryWorks(
  params?: DiscoveryWorksParams,
): Promise<DiscoveryWorksPage> {
  const query: Record<string, string> = {};
  if (params?.type) query.type = params.type;
  if (params?.q) query.q = params.q;
  if (params?.releaseYear) query.releaseYear = String(params.releaseYear);
  if (params?.sort) query.sort = params.sort;
  if (params?.limit) query.limit = String(params.limit);
  if (params?.cursor) query.cursor = params.cursor;

  const res = await apiGet<DiscoveryWorksPage>('/api/v1/k-contents/works', query);
  if (res && Array.isArray(res.items)) return res;
  throw new Error('Invalid discovery works response');
}

export async function fetchDiscoveryWorkDetail(workId: string): Promise<WorkDetail | null> {
  const res = await apiGet<WorkDetail>(`/api/v1/k-contents/works/${encodeURIComponent(workId)}`);
  if (res?.workId) return res;
  throw new Error('Invalid discovery work detail response');
}

export async function fetchKContents(placeId: string): Promise<KContentsPage> {
  const res = await apiGet<KContentsPage>(
    `/api/v1/places/${encodeURIComponent(placeId)}/k-contents`,
  );
  if (res && Array.isArray(res.items)) return res;
  throw new Error('Invalid k-contents response');
}
