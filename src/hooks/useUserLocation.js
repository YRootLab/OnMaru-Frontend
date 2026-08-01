'use client';

import { useEffect, useState } from 'react';

/**
 * 사용자의 대략적인 위도.
 *
 * 쓰임은 "내 지역의 볕" 한 줄이라 정확한 행정구역이 필요 없다.
 * 위도 구간으로 이름을 붙이면 역지오코딩 요청이 통째로 사라진다.
 */

const DEFAULT = { latitude: 37.5665, cityName: '서울', isDefault: true };

const CACHE_KEY = 'onmaru:location';

/** 권한 팝업을 오래 띄워두면 그냥 이탈한다. 3초면 답이 온다. */
const TIMEOUT = 3000;

function cityOf(latitude) {
  if (latitude >= 38.0) return '강원';
  if (latitude >= 37.2) return '서울·경기';
  if (latitude >= 36.5) return '충청';
  if (latitude >= 35.8) return '대전·세종';
  if (latitude >= 35.0) return '전라·경북';
  return '부산·경남';
}

/** 이번 세션에서 이미 답이 난 위치. 서버에서는 항상 기본값이다. */
function readCache() {
  try {
    const cached = typeof window !== 'undefined' && sessionStorage.getItem(CACHE_KEY);
    if (cached) return { ...JSON.parse(cached), resolved: true };
  } catch {
    /* 깨진 캐시는 없는 셈 친다 */
  }

  return { ...DEFAULT, resolved: false };
}

/**
 * enabled가 true가 되는 순간에만 권한을 묻는다.
 * 거부·실패·시간초과는 전부 기본값(서울)으로 조용히 떨어진다.
 */
export default function useUserLocation(enabled = true) {
  const [location, setLocation] = useState(readCache);

  useEffect(() => {
    if (!enabled || location.resolved) return;

    // 거부한 결과도 함께 저장한다. 안 그러면 이 훅이 뜰 때마다 팝업이 다시 뜬다.
    const cache = (next) => {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        /* 프라이빗 모드 등 — 캐시는 못 해도 위치는 쓴다 */
      }
    };

    const remember = (next) => {
      cache(next);
      setLocation({ ...next, resolved: true });
    };

    // 지원하지 않는 브라우저. 이미 기본값이 들어 있으니 다시 그릴 것이 없다.
    if (!navigator.geolocation) {
      cache(DEFAULT);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        remember({
          latitude: coords.latitude,
          cityName: cityOf(coords.latitude),
          isDefault: false,
        }),
      () => remember(DEFAULT),
      { timeout: TIMEOUT, maximumAge: 10 * 60 * 1000 },
    );
  }, [enabled, location.resolved]);

  return location;
}
