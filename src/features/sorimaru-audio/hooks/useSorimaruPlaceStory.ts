import { useState, useEffect } from 'react';
import { SorimaruStoryItem, TourWaypoint } from '@/features/sorimaru-audio/types/sorimaru.types';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';





export function matchSorimaruStory(
  place: { name?: string; addr?: string; lat?: number; lng?: number },
  stories: SorimaruStoryItem[],
): SorimaruStoryItem | null {
  if (!place.name || !stories || stories.length === 0) return null;


  const cleanPlace = place.name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/숙박|게스트하우스|체험장|체험관|주차장|식당|카페|호텔|모텔|빌라/g, '')
    .replace(/[\s\-_]/g, '')
    .toLowerCase();

  if (cleanPlace.length < 2) return null;


  for (const story of stories) {
    if (!story.audioUrl) continue;
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
      if (!story.audioUrl) continue;
      const sLat = parseFloat(story.mapY);
      const sLng = parseFloat(story.mapX);
      if (!sLat || !sLng) continue;

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





export function generateDynamicWaypoints(story: SorimaruStoryItem): TourWaypoint[] {
  if (story.waypoints && story.waypoints.length > 0) {
    return story.waypoints;
  }

  const baseLat = parseFloat(story.mapY) || 37.5665;
  const baseLng = parseFloat(story.mapX) || 126.9780;
  const playTimeSec = parseInt(story.playTime, 10) || 300;

  const rawLines = (story.script || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const spotCount = Math.max(3, Math.min(5, Math.ceil(rawLines.length / 2)));
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
      id: `${story.stid}-wp-${i + 1}`,
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

const sorimaruPlaceCache = new Map<string, SorimaruStoryItem | null>();





export function useSorimaruPlaceStory(placeName?: string, lat?: number, lng?: number) {
  const availableStories = useSorimaruAudioStore((s) => s.availableStories);
  const [story, setStory] = useState<SorimaruStoryItem | null>(() => {
    return matchSorimaruStory({ name: placeName, lat, lng }, availableStories);
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!placeName && (lat === undefined || lng === undefined)) {
      setStory(null);
      return;
    }


    const fastMatch = matchSorimaruStory({ name: placeName, lat, lng }, availableStories);
    if (fastMatch) {
      if (!fastMatch.waypoints) {
        fastMatch.waypoints = generateDynamicWaypoints(fastMatch);
      }
      setStory(fastMatch);
      return;
    }


    const cacheKey = `${placeName || ''}:${lat?.toFixed(3)}:${lng?.toFixed(3)}`;
    if (sorimaruPlaceCache.has(cacheKey)) {
      setStory(sorimaruPlaceCache.get(cacheKey) || null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchLiveSorimaruStory() {
      try {
        let matched: SorimaruStoryItem | null = null;

        const cleanName = (placeName || '')
          .replace(/\(.*?\)/g, '')
          .replace(/\[.*?\]/g, '')
          .replace(/숙박|체험관|체험장|게스트하우스|호텔|카페|식당/g, '')
          .trim();

        if (cleanName.length >= 2) {
          const searchWord = cleanName.slice(0, 4);
          const apiStories = await sorimaruApiAdapter.getStoryList(undefined, searchWord);
          matched = matchSorimaruStory({ name: placeName, lat, lng }, apiStories);
        }

        if (!matched && lat !== undefined && lng !== undefined) {
          const nearbyStories = await sorimaruApiAdapter.getNearbyStories(String(lng), String(lat), 500);
          matched = matchSorimaruStory({ name: placeName, lat, lng }, nearbyStories);
        }

        if (matched) {
          matched.waypoints = generateDynamicWaypoints(matched);
        }

        sorimaruPlaceCache.set(cacheKey, matched);
        if (isMounted) {
          setStory(matched);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Sorimaru Live API Error]:', err);
        if (isMounted) {
          setStory(null);
          setLoading(false);
        }
      }
    }

    fetchLiveSorimaruStory();

    return () => {
      isMounted = false;
    };
  }, [placeName, lat, lng, availableStories]);

  return { story, loading };
}
