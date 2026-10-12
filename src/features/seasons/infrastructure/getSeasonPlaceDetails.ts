import type { LiveSeasonPlace } from '../application/buildSeasonsGuide';
import { canonicalPlaceId } from '../domain/placeId';

export async function getSeasonPlaceDetails(placeIds: readonly string[]): Promise<Map<string, LiveSeasonPlace>> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) return new Map();

  const entries = await Promise.all(placeIds.map(async (placeId): Promise<[string, LiveSeasonPlace] | null> => {
    try {
      const response = await fetch(`${base.replace(/\/+$/, '')}/api/v1/places/${encodeURIComponent(canonicalPlaceId(placeId))}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(3500),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object' || (value as LiveSeasonPlace).placeId !== canonicalPlaceId(placeId)) return null;
      return [placeId, value as LiveSeasonPlace];
    } catch {
      return null;
    }
  }));

  return new Map(entries.filter((entry): entry is [string, LiveSeasonPlace] => entry !== null));
}
