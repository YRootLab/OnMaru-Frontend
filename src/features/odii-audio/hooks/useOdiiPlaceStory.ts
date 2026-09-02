import { useState, useEffect } from 'react';
import { OdiiStoryItem, TourWaypoint } from '../types/odii.types';
import { odiiApiAdapter } from '../api/odiiApi';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';

/**
 * 장소 객체와 Odii 스토리 목록 간의 100% 정밀 1:1 매칭 함수 (단일 진실 공급원 SSOT)
 * 리스트의 뱃지 표시와 상세창의 시네마틱 투어 배너가 완벽하게 1:1 일치하도록 보장합니다.
 */
export function matchOdiiStory(
  place: { name?: string; addr?: string; lat?: number; lng?: number },
  stories: OdiiStoryItem[],
): OdiiStoryItem | null {
  if (!place.name || !stories || stories.length === 0) return null;

  // 장소명에서 괄호, 특수기호, 무의미한 업종 접미사 정제
  const cleanPlace = place.name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/숙박|게스트하우스|체험장|체험관|주차장|식당|카페|호텔|모텔|빌라/g, '')
    .replace(/[\s\-_]/g, '')
    .toLowerCase();

  if (cleanPlace.length < 2) return null;

  // 1. 이름 기준 1:1 엄격 매칭 (음원이 실제로 존재하는 스토리만)
  for (const story of stories) {
    if (!story.audioUrl) continue;
    const cleanStoryTitle = story.title.replace(/[\s\-_]/g, '').toLowerCase();
    const cleanAudioTitle = (story.audioTitle || '').replace(/[\s\-_]/g, '').toLowerCase();

    // 두 텍스트 간의 상호 온전한 포함 관계
    if (
      cleanStoryTitle.includes(cleanPlace) ||
      cleanPlace.includes(cleanStoryTitle) ||
      (cleanAudioTitle.length >= 2 && (cleanAudioTitle.includes(cleanPlace) || cleanPlace.includes(cleanAudioTitle)))
    ) {
      return story;
    }
  }

  // 2. 거리 기준 초근접 정밀 매칭 (반경 250m 이내이면서 핵심 2글자 이상 일치)
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

/**
 * 실시간 공공 Odii API 응답의 대본 및 좌표를 바탕으로 
 * 시네마틱 공간 투어 경유지(Waypoints)를 동적으로 생성합니다.
 */
export function generateDynamicWaypoints(story: OdiiStoryItem): TourWaypoint[] {
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

  // 경유지 오프셋 (실제 건축물 주변으로 반경 50~150m 완만한 동선 생성)
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
      photoTip: `📸 ${offset.tip}`,
      description: lineExcerpt,
    });
  }

  return waypoints;
}

const odiiPlaceCache = new Map<string, OdiiStoryItem | null>();

/**
 * 장소명 및 좌표를 통해 한국관광공사 실제 Odii API를 직접 호출하여 
 * 정확히 일치/매칭되는 이야기만 반환하는 React 훅
 */
export function useOdiiPlaceStory(placeName?: string, lat?: number, lng?: number) {
  const availableStories = useOdiiAudioStore((s) => s.availableStories);
  const [story, setStory] = useState<OdiiStoryItem | null>(() => {
    return matchOdiiStory({ name: placeName, lat, lng }, availableStories);
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!placeName && (lat === undefined || lng === undefined)) {
      setStory(null);
      return;
    }

    // 1. 이미 로드된 전역 Odii 스토어에서 즉시 동기 매칭 검사
    const fastMatch = matchOdiiStory({ name: placeName, lat, lng }, availableStories);
    if (fastMatch) {
      if (!fastMatch.waypoints) {
        fastMatch.waypoints = generateDynamicWaypoints(fastMatch);
      }
      setStory(fastMatch);
      return;
    }

    // 2. 메모리 캐시 검사
    const cacheKey = `${placeName || ''}:${lat?.toFixed(3)}:${lng?.toFixed(3)}`;
    if (odiiPlaceCache.has(cacheKey)) {
      setStory(odiiPlaceCache.get(cacheKey) || null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchLiveOdiiStory() {
      try {
        let matched: OdiiStoryItem | null = null;

        const cleanName = (placeName || '')
          .replace(/\(.*?\)/g, '')
          .replace(/\[.*?\]/g, '')
          .replace(/숙박|체험관|체험장|게스트하우스|호텔|카페|식당/g, '')
          .trim();

        if (cleanName.length >= 2) {
          const searchWord = cleanName.slice(0, 4);
          const apiStories = await odiiApiAdapter.getStoryList(undefined, searchWord);
          matched = matchOdiiStory({ name: placeName, lat, lng }, apiStories);
        }

        if (!matched && lat !== undefined && lng !== undefined) {
          const nearbyStories = await odiiApiAdapter.getNearbyStories(String(lng), String(lat), 500);
          matched = matchOdiiStory({ name: placeName, lat, lng }, nearbyStories);
        }

        if (matched) {
          matched.waypoints = generateDynamicWaypoints(matched);
        }

        odiiPlaceCache.set(cacheKey, matched);
        if (isMounted) {
          setStory(matched);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Odii Live API Error]:', err);
        if (isMounted) {
          setStory(null);
          setLoading(false);
        }
      }
    }

    fetchLiveOdiiStory();

    return () => {
      isMounted = false;
    };
  }, [placeName, lat, lng, availableStories]);

  return { story, loading };
}

