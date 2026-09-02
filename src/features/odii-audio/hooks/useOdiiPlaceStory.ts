import { useState, useEffect } from 'react';
import { OdiiStoryItem, TourWaypoint } from '../types/odii.types';
import { odiiApiAdapter } from '../api/odiiApi';

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
 * 장소명 및 좌표를 통해 한국관광공사 실제 Odii API를 직접 호출하여 매칭되는 스토리를 가져오는 React 훅
 */
export function useOdiiPlaceStory(placeName?: string, lat?: number, lng?: number) {
  const [story, setStory] = useState<OdiiStoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!placeName && (lat === undefined || lng === undefined)) {
      setStory(null);
      return;
    }

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

        // 1. 장소명 기반 Odii API 실시간 검색
        if (placeName) {
          const cleanName = placeName.replace(/\s+/g, '').replace(/한옥.*$/, '한옥');
          const searchWord = cleanName.length > 2 ? cleanName.slice(0, 4) : cleanName;
          const apiStories = await odiiApiAdapter.getStoryList(undefined, searchWord);

          if (apiStories.length > 0) {
            matched = apiStories.find((s) => s.audioUrl) || apiStories[0];
          }
        }

        // 2. 위치 기반 Odii API 실시간 조회 (반경 3km 이내)
        if (!matched && lat !== undefined && lng !== undefined) {
          const nearbyStories = await odiiApiAdapter.getNearbyStories(String(lng), String(lat), 3000);
          if (nearbyStories.length > 0) {
            matched = nearbyStories.find((s) => s.audioUrl) || nearbyStories[0];
          }
        }

        // 3. 없으면 전통 한옥 카테고리 대표 Odii 스토리 자동 연동
        if (!matched) {
          const hanokStories = await odiiApiAdapter.getStoryList('한옥');
          if (hanokStories.length > 0) {
            matched = hanokStories[0];
          }
        }

        if (matched) {
          // 실시간 API 스토리에 동적 시네마틱 경유지 생성 및 보정
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
  }, [placeName, lat, lng]);

  return { story, loading };
}
