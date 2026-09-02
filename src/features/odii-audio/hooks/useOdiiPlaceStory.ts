import { useState, useEffect } from 'react';
import { OdiiStoryItem, TourWaypoint } from '../types/odii.types';
import { odiiApiAdapter } from '../api/odiiApi';

// 실시간 Odii API에서 검색/로드된 전국 이야기들의 동적 메모리 인덱스 레지스트리
const liveOdiiStoryRegistry = new Map<string, OdiiStoryItem>();

/**
 * 실시간 API 기반으로 수집된 Odii 스토리 레지스트리를 갱신합니다.
 */
export function registerLiveOdiiStories(stories: OdiiStoryItem[]) {
  for (const story of stories) {
    if (story.audioUrl) {
      const normalizedTitle = story.title.replace(/\s+/g, '').toLowerCase();
      liveOdiiStoryRegistry.set(normalizedTitle, story);
      if (story.audioTitle) {
        liveOdiiStoryRegistry.set(story.audioTitle.replace(/\s+/g, '').toLowerCase(), story);
      }
    }
  }
}

/**
 * 특정 장소에 Odii 오디오 도슨트 해설이 지원되는지 실시간 레지스트리 및 명칭으로 동적 판별
 */
export function hasOdiiDocent(placeName?: string, addr?: string): boolean {
  if (!placeName) return false;
  const cleanTarget = placeName
    .replace(/[\s\(\)\[\]\-_]/g, '')
    .toLowerCase();

  // 1. 실시간 API에서 등록된 스토리 목록에서 검색
  for (const [key] of liveOdiiStoryRegistry) {
    if (key.includes(cleanTarget) || cleanTarget.includes(key)) {
      return true;
    }
  }

  return false;
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
 * 정확히 일치/매칭되는 이야기만 반환하는 React 훅 (불일치 시 억지 fallback 없이 null 반환)
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

        // 1. 장소명 정제 및 핵심 검색어 추출
        const cleanName = (placeName || '')
          .replace(/\(.*?\)/g, '')
          .replace(/\[.*?\]/g, '')
          .replace(/숙박|체험관|체험장|게스트하우스|호텔|카페|식당|한옥마을/g, '')
          .trim();

        // 2. 장소명 기반 Odii API 실시간 검색 (최대 4글자 핵심 키워드)
        if (cleanName.length >= 2) {
          const searchWord = cleanName.slice(0, 4);
          const apiStories = await odiiApiAdapter.getStoryList(undefined, searchWord);

          // 음원이 있고 이름이 실제로 매칭되는 스토리만 엄격히 선별
          matched = apiStories.find((s) => {
            if (!s.audioUrl) return false;
            const fullTitle = `${s.title} ${s.audioTitle}`.replace(/\s+/g, '');
            const target = cleanName.replace(/\s+/g, '');
            return fullTitle.includes(target) || target.includes(s.title.replace(/\s+/g, ''));
          }) || null;
        }

        // 3. 위치 기반 Odii API 실시간 조회 (반경 500m 이내 초근접 정밀 매칭)
        if (!matched && lat !== undefined && lng !== undefined) {
          const nearbyStories = await odiiApiAdapter.getNearbyStories(String(lng), String(lat), 600);
          if (nearbyStories.length > 0) {
            matched = nearbyStories.find((s) => {
              if (!s.audioUrl) return false;
              if (cleanName.length < 2) return true;
              const fullTitle = `${s.title} ${s.audioTitle}`;
              return cleanName.split(' ').some((word) => word.length >= 2 && fullTitle.includes(word));
            }) || null;
          }
        }

        // 🌟 실전 원칙: 매칭되는 Odii 해설이 없으면 억지 fallback을 하지 않고 null 처리
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
  }, [placeName, lat, lng]);

  return { story, loading };
}

