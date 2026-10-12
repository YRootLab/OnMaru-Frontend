import type { Village } from '@/features/hanok-archive/types';
import { seasonForMonth, SEASON_ORDER, type SeasonId } from '../domain/seasons';
import { canonicalPlaceId } from '../domain/placeId';

export { seasonForMonth } from '../domain/seasons';

export interface LiveSeasonPlace {
  placeId: string;
  name?: string;
  description?: string;
  address?: string | null;
  images?: { url: string; alt: string }[];
  coordinates?: { lat: number; lng: number } | null;
  region?: { name?: string | null } | null;
  category?: string;
}

export interface SeasonPlace {
  id: string;
  name: string;
  region: string;
  address: string;
  description: string;
  image: string;
  lat: number | null;
  lng: number | null;
  source: 'live' | 'snapshot';
  imageSource: 'live' | 'snapshot';
  snapshotAt: string;
}

export interface SeasonScene {
  id: SeasonId;
  name: string;
  title: string;
  thought: string;
  detail: string;
  focus: string;
  placeIds: readonly [string, string];
  places: SeasonPlace[];
  nearbyPlaces: SeasonPlace[];
}

const SCENES: Record<SeasonId, Omit<SeasonScene, 'places' | 'nearbyPlaces'>> = {
  spring: {
    id: 'spring', name: '봄', title: '마당에 빛이 머무는 계절.',
    thought: '집 한 채보다 마을의 자리를 먼저 보세요.',
    detail: '땅의 높낮이와 담장 사이를 따라 걸으면 한옥이 풍경과 맺은 관계가 보입니다.',
    focus: '종택 한 채만 보지 말고, 양동마을의 길과 다른 집들이 놓인 높낮이도 함께 살펴보세요.',
    placeIds: ['129518', '128953'],
  },
  summer: {
    id: 'summer', name: '여름', title: '바람이 지나는 집.',
    thought: '마루와 열린 공간을 가까이 읽는 계절.',
    detail: '나무로 만든 자리와 집 주변의 지형을 함께 살펴보세요.',
    focus: '집의 경계에서 잠시 멈춰 서서, 마당과 주변 지형이 어떻게 이어지는지 살펴보세요.',
    placeIds: ['125925', '2000648'],
  },
  autumn: {
    id: 'autumn', name: '가을', title: '나무의 시간이 드러나는 계절.',
    thought: '기둥과 담장에 남은 세월을 천천히 봅니다.',
    detail: '한옥의 모양뿐 아니라 그 집이 이어온 사람들의 시간을 읽어보세요.',
    focus: '소산마을의 길에서 양소당을 바라보며, 종택과 마을이 만나는 자리를 눈여겨보세요.',
    placeIds: ['1877312', '126417'],
  },
  winter: {
    id: 'winter', name: '겨울', title: '고요한 지붕 아래, 다시 집으로.',
    thought: '닫힌 문과 열린 마당의 대비를 느껴보세요.',
    detail: '찬 계절을 지나는 집의 경계와 생활을 떠올려 봅니다.',
    focus: '지붕선과 담장, 집 바깥의 풍경을 한눈에 놓고 천천히 비교해 보세요.',
    placeIds: ['1972030', '231931'],
  },
};

export const SEASON_PLACE_IDS = SEASON_ORDER.flatMap((id) => SCENES[id].placeIds);

function safeImage(url: string | undefined | null): string | null {
  if (url?.startsWith('http://')) return `https://${url.slice(7)}`;
  return url?.startsWith('https://') ? url : null;
}

function snapshotPlace(village: Village, snapshotAt: string): SeasonPlace {
  return {
    id: village.id, name: village.name, region: village.region, address: village.addr,
    description: village.summary || village.overview, image: village.image!,
    lat: village.lat, lng: village.lng, source: 'snapshot', imageSource: 'snapshot', snapshotAt,
  };
}

function distanceSquared(a: Village, lat: number, lng: number): number {
  const north = (a.lat! - lat) * 111;
  const east = (a.lng! - lng) * 88;
  return north * north + east * east;
}

const CATEGORY_CONTEXT: Record<string, string> = {
  HANOK: '한옥으로 분류된 장소입니다.',
  HANOK_STAY: '한옥 숙박 장소로 분류된 곳입니다.',
  HANOK_VILLAGE: '한옥마을로 분류된 장소입니다.',
  HANOK_HOTEL: '한옥 숙박 장소로 분류된 곳입니다.',
  GOTAEK: '고택으로 분류된 장소입니다.',
};

export function buildSeasonsGuide({ month, villages, liveDetails = new Map(), liveNearbyByLead, snapshotAt }: {
  month: number;
  villages: Village[];
  liveDetails?: Map<string, LiveSeasonPlace>;
  liveNearbyByLead?: Map<string, LiveSeasonPlace[]>;
  snapshotAt: string;
}): SeasonScene[] {
  const current = seasonForMonth(month);
  const start = SEASON_ORDER.indexOf(current);
  const ordered = [...SEASON_ORDER.slice(start), ...SEASON_ORDER.slice(0, start)];
  const fallback = new Map(villages.map((village) => [village.id, village]));

  return ordered.map((season) => {
    const scene = SCENES[season];
    const places = scene.placeIds.flatMap((id): SeasonPlace[] => {
      const saved = fallback.get(id);
      if (!saved?.image) return [];
      const candidate = liveDetails.get(id);
      const live = candidate?.placeId === canonicalPlaceId(id) || candidate?.placeId === id ? candidate : undefined;
      const liveImage = safeImage(live?.images?.[0]?.url);
      return [{
        id,
        name: live?.name?.trim() || saved.name,
        region: saved.region,
        address: live?.address?.trim() || saved.addr,
        description: live?.description?.trim() || saved.summary || saved.overview,
        image: liveImage || saved.image,
        lat: live?.coordinates?.lat ?? saved.lat,
        lng: live?.coordinates?.lng ?? saved.lng,
        source: live ? 'live' : 'snapshot',
        imageSource: liveImage ? 'live' : 'snapshot',
        snapshotAt,
      }];
    });
    const lead = places[0];
    const snapshotNearby = lead && lead.lat !== null && lead.lng !== null
      ? villages.filter((village) => village.image && village.lat !== null && village.lng !== null && !scene.placeIds.includes(village.id))
        .sort((a, b) => distanceSquared(a, lead.lat!, lead.lng!) - distanceSquared(b, lead.lat!, lead.lng!) || a.id.localeCompare(b.id))
        .map((village) => snapshotPlace(village, snapshotAt))
      : [];
    const liveNearby = (liveNearbyByLead?.get(scene.placeIds[0]) ?? [])
      .filter((item) => item.placeId && item.name?.trim() && item.coordinates && Number.isFinite(item.coordinates.lat) && Number.isFinite(item.coordinates.lng))
      .map((item): SeasonPlace => {
        const recorded = fallback.get(item.placeId.replace(/^p-tourapi-/, ''));
        const liveImage = safeImage(item.images?.[0]?.url);
        return {
          id: item.placeId, name: item.name!.trim(), region: item.region?.name?.trim() || recorded?.region || '주변 한옥',
          address: item.address?.trim() || recorded?.addr || item.region?.name?.trim() || '',
          description: item.description?.trim() || recorded?.summary || recorded?.overview || CATEGORY_CONTEXT[item.category ?? ''] || '한옥 관련 장소로 분류된 곳입니다.',
          image: liveImage || safeImage(recorded?.image) || '',
          lat: item.coordinates!.lat, lng: item.coordinates!.lng, source: 'live', imageSource: liveImage ? 'live' : 'snapshot', snapshotAt,
        };
      });
    const seen = new Set(scene.placeIds.map(canonicalPlaceId));
    const nearbyPlaces = [...liveNearby, ...snapshotNearby].filter((place) => {
      const id = canonicalPlaceId(place.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 8);
    return { ...scene, places, nearbyPlaces };
  });
}
