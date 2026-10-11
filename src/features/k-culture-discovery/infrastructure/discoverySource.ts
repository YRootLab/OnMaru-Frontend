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
import {
  getFixtureTopics,
  getFixturePlacesPage,
  getFixturePlaceDetail,
  getFixtureWorksPage,
  getFixtureWorkDetail,
  getFixtureKContentsPage,
} from './fixtures';

// Fixtures are only used locally during development.
// In production the API errors propagate so the UI renders proper unavailable states
// instead of showing unreviewed fixture content.
const USE_FIXTURE_FALLBACK = process.env.NODE_ENV === 'development';

interface TopicsResponse {
  schemaVersion: string;
  catalogRevision: string;
  countsAsOf: string;
  items: DiscoveryTopic[];
}

export async function fetchDiscoveryTopics(): Promise<DiscoveryTopic[]> {
  try {
    const res = await apiGet<TopicsResponse>('/api/v1/discovery/topics');
    if (Array.isArray(res?.items)) return res.items;
    if (USE_FIXTURE_FALLBACK) return getFixtureTopics();
    return [];
  } catch (err) {
    if (USE_FIXTURE_FALLBACK) return getFixtureTopics();
    throw err;
  }
}

export async function fetchDiscoveryPlaces(
  params?: DiscoveryPlacesParams,
): Promise<DiscoveryPlacesPage> {
  try {
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
    if (USE_FIXTURE_FALLBACK) return getFixturePlacesPage(params);
    return {
      catalogRevision: '', countsAsOf: '', matchingPlaceCount: 0,
      facets: { topic: [], regionCode: [], placeRole: [], type: [], workTagCode: [], relationTagCode: [] },
      items: [], hasMore: false, nextCursor: null,
    };
  } catch (err) {
    if (USE_FIXTURE_FALLBACK) return getFixturePlacesPage(params);
    throw err;
  }
}

export async function fetchDiscoveryPlaceDetail(
  placeId: string,
): Promise<DiscoveryPlaceDetail | null> {
  try {
    const res = await apiGet<DiscoveryPlaceDetail>(`/api/v1/discovery/places/${encodeURIComponent(placeId)}`);
    if (res?.placeId) return res;
    if (USE_FIXTURE_FALLBACK) return getFixturePlaceDetail(placeId);
    return null;
  } catch (err) {
    if (USE_FIXTURE_FALLBACK) return getFixturePlaceDetail(placeId);
    throw err;
  }
}

export async function fetchDiscoveryWorks(
  params?: DiscoveryWorksParams,
): Promise<DiscoveryWorksPage> {
  try {
    const query: Record<string, string> = {};
    if (params?.type) query.type = params.type;
    if (params?.q) query.q = params.q;
    if (params?.releaseYear) query.releaseYear = String(params.releaseYear);
    if (params?.sort) query.sort = params.sort;
    if (params?.limit) query.limit = String(params.limit);
    if (params?.cursor) query.cursor = params.cursor;

    const res = await apiGet<DiscoveryWorksPage>('/api/v1/k-contents/works', query);
    if (res && Array.isArray(res.items)) return res;
    if (USE_FIXTURE_FALLBACK) return getFixtureWorksPage(params);
    return { catalogRevision: '', countsAsOf: '', matchingWorkCount: 0, items: [], hasMore: false, nextCursor: null };
  } catch (err) {
    if (USE_FIXTURE_FALLBACK) return getFixtureWorksPage(params);
    throw err;
  }
}

export async function fetchDiscoveryWorkDetail(workId: string): Promise<WorkDetail | null> {
  try {
    const res = await apiGet<WorkDetail>(`/api/v1/k-contents/works/${encodeURIComponent(workId)}`);
    if (res?.workId) return res;
    if (USE_FIXTURE_FALLBACK) return getFixtureWorkDetail(workId);
    return null;
  } catch (err) {
    if (USE_FIXTURE_FALLBACK) return getFixtureWorkDetail(workId);
    throw err;
  }
}

export async function fetchKContents(placeId: string): Promise<KContentsPage> {
  try {
    const res = await apiGet<KContentsPage>(`/api/v1/places/${encodeURIComponent(placeId)}/k-contents`);
    if (res && Array.isArray(res.items)) return res;
    if (USE_FIXTURE_FALLBACK) return getFixtureKContentsPage(placeId);
    return { catalogRevision: '', countsAsOf: '', matchingRelationCount: 0, items: [], hasMore: false, nextCursor: null };
  } catch (err) {
    if (USE_FIXTURE_FALLBACK) return getFixtureKContentsPage(placeId);
    throw err;
  }
}
