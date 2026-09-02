import { OdiiStoryItem } from '../types/odii.types';
import { MOCK_ODII_STORIES } from '../api/odiiMockData';

/**
 * 장소명 또는 좌표로 매칭되는 Odii 오디오 스토리를 찾는다.
 */
export function findMatchingOdiiStory(
  placeName?: string,
  lat?: number,
  lng?: number,
): OdiiStoryItem | null {
  if (!placeName && (lat === undefined || lng === undefined)) return null;

  const cleanName = (placeName ?? '').replace(/\s+/g, '').toLowerCase();

  // 1. 장소명 키워드 매칭
  if (cleanName) {
    for (const story of MOCK_ODII_STORIES) {
      const storyTitle = story.title.replace(/\s+/g, '').toLowerCase();
      const locationName = (story.locationName ?? '').replace(/\s+/g, '').toLowerCase();
      const audioTitle = story.audioTitle.replace(/\s+/g, '').toLowerCase();

      if (
        cleanName.includes('경기전') &&
        (storyTitle.includes('경기전') || locationName.includes('경기전'))
      ) {
        return story;
      }
      if (
        (cleanName.includes('북촌') || cleanName.includes('가회동')) &&
        (storyTitle.includes('북촌') || locationName.includes('북촌'))
      ) {
        return story;
      }
      if (
        (cleanName.includes('소쇄원') || cleanName.includes('담양')) &&
        (storyTitle.includes('소쇄원') || locationName.includes('소쇄원'))
      ) {
        return story;
      }
      if (
        (cleanName.includes('경복궁') || cleanName.includes('자경전')) &&
        (storyTitle.includes('경복궁') || storyTitle.includes('자경전'))
      ) {
        return story;
      }
      if (
        (cleanName.includes('통인시장') || cleanName.includes('서촌')) &&
        (storyTitle.includes('통인시장') || locationName.includes('통인시장'))
      ) {
        return story;
      }
      if (
        cleanName.includes('국립중앙박물관') &&
        (storyTitle.includes('국립중앙박물관') || storyTitle.includes('사유의방'))
      ) {
        return story;
      }
      if (
        (cleanName.includes('남산골') || cleanName.includes('천우각')) &&
        (storyTitle.includes('남산골') || locationName.includes('남산골'))
      ) {
        return story;
      }

      // 부분 일치
      if (
        storyTitle.includes(cleanName) ||
        cleanName.includes(storyTitle) ||
        locationName.includes(cleanName) ||
        audioTitle.includes(cleanName)
      ) {
        return story;
      }
    }
  }

  // 2. 좌표 근접 매칭 (5km 이내)
  if (lat !== undefined && lng !== undefined) {
    let closest: OdiiStoryItem | null = null;
    let minDistance = 5000; // 5km

    for (const story of MOCK_ODII_STORIES) {
      const sLat = parseFloat(story.mapY);
      const sLng = parseFloat(story.mapX);
      if (isNaN(sLat) || isNaN(sLng)) continue;

      const dLat = (sLat - lat) * 111000;
      const dLng = (sLng - lng) * 88000;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < minDistance) {
        minDistance = dist;
        closest = story;
      }
    }

    if (closest) return closest;
  }

  return null;
}
