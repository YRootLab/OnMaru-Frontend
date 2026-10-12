import type { LiveSeasonPlace } from '../application/buildSeasonsGuide';

interface NearbyLead { id: string; lat: number | null; lng: number | null }
interface BackendNearbyItem {
  placeId?: string;
  name?: string;
  displayCategory?: string;
  summary?: string;
  region?: { name?: string | null } | null;
  coordinates?: { lat: number; lng: number } | null;
  thumbnailUrl?: string | null;
}

const HANOK_CATEGORIES = new Set(['HANOK', 'HANOK_STAY', 'HANOK_VILLAGE', 'HANOK_HOTEL', 'GOTAEK']);

export async function getNearbySeasonPlaces(leads: readonly NearbyLead[]): Promise<Map<string, LiveSeasonPlace[]>> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) return new Map();

  const entries = await Promise.all(leads.map(async (lead): Promise<[string, LiveSeasonPlace[]] | null> => {
    if (lead.lat === null || lead.lng === null) return null;
    const url = new URL(`${base.replace(/\/+$/, '')}/api/v1/map/info/places`);
    for (const [key, value] of Object.entries({ category: 'HANOK', sort: 'DISTANCE', lat: String(lead.lat), lng: String(lead.lng), limit: '60' })) {
      url.searchParams.set(key, value);
    }
    try {
      const response = await fetch(url.toString(), {
        next: { revalidate: 3600 }, signal: AbortSignal.timeout(3500), headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;
      const body: unknown = await response.json();
      if (!body || typeof body !== 'object' || !Array.isArray((body as { items?: unknown }).items)) return null;
      const items = (body as { items: BackendNearbyItem[] }).items
        .filter((item) => item && typeof item.placeId === 'string' && typeof item.name === 'string' && HANOK_CATEGORIES.has(item.displayCategory ?? '') && item.coordinates && Number.isFinite(item.coordinates.lat) && Number.isFinite(item.coordinates.lng))
        .map((item): LiveSeasonPlace => ({
          placeId: item.placeId!, name: item.name!, address: item.summary || item.region?.name || '',
          region: item.region, coordinates: item.coordinates, category: item.displayCategory,
          images: item.thumbnailUrl ? [{ url: item.thumbnailUrl, alt: item.name! }] : [],
        }));
      return [lead.id, items];
    } catch {
      return null;
    }
  }));
  return new Map(entries.filter((entry): entry is [string, LiveSeasonPlace[]] => entry !== null));
}
