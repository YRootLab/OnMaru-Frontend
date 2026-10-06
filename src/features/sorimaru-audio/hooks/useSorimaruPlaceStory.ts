import { useEffect, useMemo, useState } from 'react';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import type { TourWaypoint } from '@/features/sorimaru-audio/types/sorimaru.types';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { sorimaruRepository } from '@/features/sorimaru-audio/infrastructure/sorimaruHttpRepository';





export function matchSorimaruStory(
  place: { name?: string; addr?: string; lat?: number; lng?: number },
  stories: SorimaruStorySummary[],
): SorimaruStorySummary | null {
  if (!place.name || !stories || stories.length === 0) return null;


  const cleanPlace = place.name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/숙박|게스트하우스|체험장|체험관|주차장|식당|카페|호텔|모텔|빌라/g, '')
    .replace(/[\s\-_]/g, '')
    .toLowerCase();

  if (cleanPlace.length < 2) return null;


  for (const story of stories) {
    const cleanStoryTitle = story.title.replace(/[\s\-_]/g, '').toLowerCase();
    const cleanAudioTitle = (story.audioTitle || '').replace(/[\s\-_]/g, '').toLowerCase();


    if (
      cleanStoryTitle.includes(cleanPlace) ||
      cleanPlace.includes(cleanStoryTitle) ||
      (cleanAudioTitle.length >= 2 && (cleanAudioTitle.includes(cleanPlace) || cleanPlace.includes(cleanAudioTitle)))
    ) {
      return story;
    }
  }


  if (place.lat !== undefined && place.lng !== undefined) {
    for (const story of stories) {
      const sLat = story.coordinates?.lat;
      const sLng = story.coordinates?.lng;
      if (sLat === undefined || sLng === undefined) continue;

      const dLat = Math.abs(sLat - place.lat);
      const dLng = Math.abs(sLng - place.lng);
      if (dLat <= 0.0025 && dLng <= 0.0025) {
        const cleanStoryTitle = story.title.replace(/[\s\-_]/g, '').toLowerCase();
        const token = cleanPlace.slice(0, 2);
        if (cleanStoryTitle.includes(token)) {
          return story;
        }
      }
    }
  }

  return null;
}





export function generateDynamicWaypoints(story: SorimaruStorySummary): TourWaypoint[] {
  const baseLat = story.coordinates?.lat ?? 37.5665;
  const baseLng = story.coordinates?.lng ?? 126.9780;
  const playTimeSec = story.durationSeconds || 300;
  const rawLines = story.contentTags;
  const spotCount = Math.max(3, Math.min(5, Math.ceil(Math.max(1, rawLines.length) / 2)));
  const waypoints: TourWaypoint[] = [];


  const offsets = [
    { lat: 0, lng: 0, titleSuffix: '진입로 및 솟을대문', tip: '전통 한옥의 첫인상을 담는 입구 전경' },
    { lat: 0.00045, lng: 0.00035, titleSuffix: '안마당 & 대청마루', tip: '마당에서 올려다보는 처마와 하늘의 조화' },
    { lat: 0.0008, lng: -0.0002, titleSuffix: '중심 전각 및 정원', tip: '한옥의 기품이 느껴지는 정면 구도' },
    { lat: 0.0003, lng: -0.0006, titleSuffix: '돌담길 & 조망 스팟', tip: '고즈넉한 돌담 너머로 펼쳐지는 풍경' },
    { lat: -0.0003, lng: 0.0004, titleSuffix: '후원 소리길', tip: '바람 소리와 처마 풍경이 어우러지는 힐링 스팟' },
  ];

  for (let i = 0; i < spotCount; i++) {
    const offset = offsets[i] || offsets[0];
    const timeSec = Math.floor((i / spotCount) * playTimeSec);
    const lineExcerpt = rawLines[i] || `${story.title}의 아름다운 전통 공간`;

    waypoints.push({
      id: `${story.storyId}-wp-${i + 1}`,
      timeSec,
      title: `${i + 1}. ${story.title} ${offset.titleSuffix}`,
      lat: baseLat + offset.lat,
      lng: baseLng + offset.lng,
      zoomLevel: 2,
      photoTip: offset.tip,
      description: lineExcerpt,
    });
  }

  return waypoints;
}

export function useSorimaruPlaceStory(placeName?: string, lat?: number, lng?: number) {
  const availableStories = useSorimaruAudioStore((s) => s.availableStories);
  const mergeAvailableStories = useSorimaruAudioStore((s) => s.mergeAvailableStories);

  const localMatch = useMemo(
    () => matchSorimaruStory({ name: placeName, lat, lng }, availableStories),
    [availableStories, lat, lng, placeName],
  );

  const [keywordMatch, setKeywordMatch] = useState<SorimaruStorySummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localMatch || !placeName) {
      setKeywordMatch(null);
      setLoading(false);
      return;
    }

    const cleanKeyword = placeName
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/숙박|게스트하우스|체험장|체험관|주차장|식당|카페|호텔|모텔|빌라/g, '')
      .trim();

    if (cleanKeyword.length < 2) return;

    let cancelled = false;
    setLoading(true);

    const request = sorimaruRepository.searchStoriesByKeyword(cleanKeyword);
    if (!request || typeof request.then !== 'function') {
      setLoading(false);
      return;
    }

    request
      .then((page) => {
        if (cancelled) return;
        const matched = matchSorimaruStory({ name: placeName, lat, lng }, page?.items || []);
        if (matched) {
          setKeywordMatch(matched);
          mergeAvailableStories([matched]);
        }
      })
      .catch((err) => {
        console.warn('[useSorimaruPlaceStory] Keyword search failed:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placeName, lat, lng, localMatch, mergeAvailableStories]);

  return { story: localMatch ?? keywordMatch, loading };
}
