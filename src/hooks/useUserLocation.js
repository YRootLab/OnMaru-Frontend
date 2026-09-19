'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 위도에 따른 대략적인 도시명 반환
 */
export function cityOf(latitude) {
  if (latitude >= 37.8) return '강원';
  if (latitude >= 37.1) return '서울·경기';
  if (latitude >= 36.3) return '대전·세종·충청';
  if (latitude >= 35.1) return '전라·경북';
  return '부산·경남';
}

const DEFAULT_LAT = 37.5665;
const STORAGE_KEY = 'onmaru_lat';

/**
 * [5] 이번 세션에서 이미 받아둔 위도. 없으면 null.
 *
 * 렌더 전에 답이 나오는 값이라 effect가 아니라 초기값으로 읽는다.
 * effect에서 setState로 밀어넣으면 기본값으로 한 번 그린 뒤 다시 그린다.
 */
function readCachedLat() {
  try {
    const cached = typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY);
    const parsed = cached ? parseFloat(cached) : NaN;
    if (!Number.isNaN(parsed)) return parsed;
  } catch {
    /* 프라이빗 모드 등 — 캐시가 없는 셈 친다 */
  }

  return null;
}

export default function useUserLocation() {
  const [cachedLat] = useState(readCachedLat);

  const [latitude, setLatitude] = useState(cachedLat ?? DEFAULT_LAT);
  // 'idle' | 'requesting' | 'granted' | 'denied'
  const [locationState, setLocationState] = useState(cachedLat === null ? 'idle' : 'granted');

  // [6] HTTPS / secureContext 여부. 서버에서는 막을 이유가 없으니 true로 둔다.
  const [isSecure] = useState(() => typeof window === 'undefined' || window.isSecureContext);

  // [4] Permissions API 사전 확인 (팝업 없이 재방문 허용자 자동 적용)
  useEffect(() => {
    if (cachedLat !== null) return; // 캐시가 이미 답을 줬다

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const lat = pos.coords.latitude;
                sessionStorage.setItem(STORAGE_KEY, lat.toString());
                setLatitude(lat);
                setLocationState('granted');
              },
              () => {
                setLocationState('denied');
              },
              { timeout: 5000, maximumAge: 600000 },
            );
          } else if (result.state === 'denied') {
            setLocationState('denied');
          }
          // 'prompt'면 idle 상태 유지 (버튼 노출)
        })
        .catch(() => {
          /* query 실패시 idle 유지 */
        });
    }
  }, [cachedLat]);

  // [2] 버튼 클릭 시 권한 직접 요청
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation || locationState === 'requesting') return;

    setLocationState('requesting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        sessionStorage.setItem(STORAGE_KEY, lat.toString());
        setLatitude(lat);
        setLocationState('granted');
      },
      () => {
        setLocationState('denied');
      },
      { timeout: 5000, maximumAge: 600000 },
    );
  }, [locationState]);

  const cityName = locationState === 'granted' ? cityOf(latitude) : '서울';

  return {
    latitude,
    cityName,
    locationState,
    isSecure,
    requestLocation,
  };
}
