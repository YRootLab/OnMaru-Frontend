'use client';

import { useState, useEffect } from 'react';
import { getDiscoveryPlaces, getDiscoveryPlaceDetail } from '../../application/useCases';
import type {
  Coordinates,
  DiscoveryPlaceSummary,
  FeaturedRelation,
  PlaceImage,
  PlaceRole,
  Region,
} from '../../domain/types';

export interface WorkLocationItem {
  placeId: string;
  name: string;
  region: Region;
  placeRoles: PlaceRole[];
  placeImage: string | PlaceImage | null;
  address: string | null;
  coordinates: Coordinates | null;
  featuredRelation: FeaturedRelation | null;
}

export interface UseWorkLocationsResult {
  locations: WorkLocationItem[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
}

const MAX_LOCATIONS = 12;

function toBaseLocation(summary: DiscoveryPlaceSummary): WorkLocationItem {
  return {
    placeId: summary.placeId,
    name: summary.name,
    region: summary.region,
    placeRoles: summary.placeRoles,
    placeImage: summary.placeImage,
    address: null,
    coordinates: summary.coordinates ?? null,
    featuredRelation: summary.featuredRelation,
  };
}

export function useWorkLocations(workId: string, enabled = true): UseWorkLocationsResult {
  const [locations, setLocations] = useState<WorkLocationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!workId || !enabled) {
      setLocations([]);
      setTotalCount(0);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    let ignore = false;
    setIsLoading(true);
    setIsError(false);

    getDiscoveryPlaces({ workId, limit: MAX_LOCATIONS })
      .then(async (page) => {
        if (ignore) return;
        const baseLocations = page.items.map(toBaseLocation);
        setTotalCount(page.matchingPlaceCount || page.items.length);

        const detailResults = await Promise.allSettled(
          baseLocations.map((loc) =>
            loc.coordinates
              ? Promise.resolve(null)
              : getDiscoveryPlaceDetail(loc.placeId),
          ),
        );

        if (ignore) return;

        const enriched = baseLocations.map((loc, idx) => {
          const result = detailResults[idx];
          if (result?.status === 'fulfilled' && result.value) {
            const detail = result.value;
            return {
              ...loc,
              address: detail.address || loc.address,
              coordinates: detail.coordinates ?? loc.coordinates,
              placeImage: loc.placeImage ?? detail.images[0] ?? null,
            };
          }
          return loc;
        });

        setLocations(enriched);
      })
      .catch(() => {
        if (!ignore) {
          setIsError(true);
          setLocations([]);
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [workId, enabled]);

  return { locations, totalCount, isLoading, isError };
}
