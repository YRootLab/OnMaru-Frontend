import {
  fetchDiscoveryTopics,
  fetchDiscoveryPlaces,
  fetchDiscoveryPlaceDetail,
  fetchDiscoveryWorks,
  fetchDiscoveryWorkDetail,
  fetchKContents,
  savePlace,
  unsavePlace,
} from '../infrastructure/discoverySource';
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

export async function getDiscoveryTopics(): Promise<DiscoveryTopic[]> {
  return fetchDiscoveryTopics();
}

export async function getDiscoveryPlaces(
  params?: DiscoveryPlacesParams,
): Promise<DiscoveryPlacesPage> {
  return fetchDiscoveryPlaces(params);
}

export async function getDiscoveryPlaceDetail(
  placeId: string,
): Promise<DiscoveryPlaceDetail | null> {
  return fetchDiscoveryPlaceDetail(placeId);
}

export async function getDiscoveryWorks(
  params?: DiscoveryWorksParams,
): Promise<DiscoveryWorksPage> {
  return fetchDiscoveryWorks(params);
}

export async function getDiscoveryWorkDetail(workId: string): Promise<WorkDetail | null> {
  return fetchDiscoveryWorkDetail(workId);
}

export async function getKContents(placeId: string): Promise<KContentsPage> {
  return fetchKContents(placeId);
}

export async function togglePlaceSave(placeId: string, currentlySaved: boolean): Promise<void> {
  return currentlySaved ? unsavePlace(placeId) : savePlace(placeId);
}
