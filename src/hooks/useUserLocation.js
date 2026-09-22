'use client';

import { useCallback, useEffect, useState } from 'react';




export function cityOf(latitude) {
  if (latitude >= 37.8) return '강원';
  if (latitude >= 37.1) return '서울·경기';
  if (latitude >= 36.3) return '대전·세종·충청';
  if (latitude >= 35.1) return '전라·경북';
  return '부산·경남';
}

const DEFAULT_LAT = 37.5665;
const STORAGE_KEY = 'onmaru_lat';







function readCachedLat() {
  try {
    const cached = typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY);
    const parsed = cached ? parseFloat(cached) : NaN;
    if (!Number.isNaN(parsed)) return parsed;
  } catch {

  }

  return null;
}

export default function useUserLocation() {
  const [cachedLat] = useState(readCachedLat);

  const [latitude, setLatitude] = useState(cachedLat ?? DEFAULT_LAT);

  const [locationState, setLocationState] = useState(cachedLat === null ? 'idle' : 'granted');


  const [isSecure] = useState(() => typeof window === 'undefined' || window.isSecureContext);


  useEffect(() => {
    if (cachedLat !== null) return;

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

        })
        .catch(() => {

        });
    }
  }, [cachedLat]);


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
