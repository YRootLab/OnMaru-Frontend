'use client';

import { useEffect, useRef } from 'react';
import { useMapStore } from './useMapStore';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { sorimaruRepository } from '@/features/sorimaru-audio/infrastructure/sorimaruHttpRepository';

// Threshold: only refetch if the map center moved more than ~1.5km
const MIN_DISTANCE_KM = 1.5;
const SEARCH_RADIUS_M = 5000;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * useMapNearbyStories
 *
 * Coordinates-based nearby audio story loader (방식 A).
 * Automatically fetches stories around the current map center and merges them
 * into useSorimaruAudioStore, enabling:
 * 1. SorimaruSpotlightBanner editorial spotlight
 * 2. PlaceListItem audio guide badges
 * 3. PlaceDetail instant audio docent player matching
 */
export function useMapNearbyStories(enabled = true) {
  const center = useMapStore((s) => s.center);
  const mode = useMapStore((s) => s.mode);
  const mergeAvailableStories = useSorimaruAudioStore((s) => s.mergeAvailableStories);

  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || mode !== 'info' || !center?.lat || !center?.lng) {
      return;
    }

    const { lat, lng } = center;

    // Check if we need to fetch
    if (lastCenterRef.current) {
      const dist = calculateDistanceKm(lastCenterRef.current.lat, lastCenterRef.current.lng, lat, lng);
      if (dist < MIN_DISTANCE_KM) {
        return;
      }
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        lastCenterRef.current = { lat, lng };
        const page = await sorimaruRepository.listNearbyStories(lat, lng, SEARCH_RADIUS_M, 'ko-KR');
        if (page?.items && page.items.length > 0) {
          mergeAvailableStories(page.items);
        }
      } catch (err) {
        console.warn('[useMapNearbyStories] Failed to fetch nearby stories:', err);
      }
    }, 350);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [center?.lat, center?.lng, enabled, mode, mergeAvailableStories]);
}
