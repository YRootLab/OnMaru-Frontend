import { NextResponse } from 'next/server';
import { PlaceService, PLACE_CATEGORIES } from '@/map/services/place.service';
import { getCuratedPlace } from '@/map/data/curatedPlaces';
import { seedWarmth } from '@/map/warmth/seed';
import { distanceInMeters } from '@/map/utils/geo';
import type { Item, PlaceCategory } from '@/map/types';

/**
 * 관광공사 API가 응답하지 않을 때 내어줄 한옥 명소.
 *
 * 공공데이터포털 게이트웨이는 실제로 멈춰 설 때가 있다. 그때 지도를 텅 비워두면
 * 사용자는 앱이 고장 났다고 읽는다. 우리가 이미 들고 있는 큐레이션 한옥이라도
 * 보여주면, 적어도 어디에 무엇이 있는지는 남는다.
 */
function fallbackPlaces(lat: number, lng: number): Item[] {
  // 시드는 한줄평 단위라 한 장소가 여러 번 들어 있다. 장소 목록으로 쓰려면 한 번씩만 남긴다.
  const seen = new Set<string>();

  return seedWarmth()
    .filter((s) => {
      const key = s.placeId || s.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s) => {
      const curated = getCuratedPlace(s.placeId || s.id, s.placeName);

      return {
        id: s.placeId || s.id,
        name: s.placeName,
        category: 'spot' as PlaceCategory,
        lat: s.lat,
        lng: s.lng,
        addr: curated?.addr1 ?? '',
        image: curated?.images?.[0] ?? null,
        tel: null,
        dist: Math.round(distanceInMeters({ lat, lng }, { lat: s.lat, lng: s.lng })),
        isTraditional: true,
      };
    })
    /*
      반경으로 자르지 않는다.

      평상시라면 화면 밖 장소를 끌어오지 않는 게 맞지만, 여기는 관광공사가 죽어
      아무것도 못 주는 상황이다. 반경을 지키다 한 곳만 남으면 지도는 여전히 비어 보인다.
      가까운 순으로 넉넉히 내어주고, 화면에 무엇을 세울지는 마커 레이어가 정한다.
    */
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 60);
}

/**
 * 지도 뷰포트 기준 장소 목록 API (Thin Controller)
 * 비즈니스 로직 및 캐싱은 PlaceService에 위임합니다.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const lat = Number(q.get('lat'));
  const lng = Number(q.get('lng'));
  const radius = Number(q.get('radius')) || 3000;
  const raw = q.get('category');
  const category = PLACE_CATEGORIES.includes(raw as PlaceCategory)
    ? (raw as PlaceCategory)
    : null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ items: [], error: 'lat/lng 좌표 필요' });
  }

  try {
    const items = await PlaceService.getNearbyPlaces({ lat, lng, radius, category });
    return NextResponse.json({ items });
  } catch (error) {
    // 관광공사가 답하지 않으면 저장해둔 한옥이라도 내어준다. degraded로 표시해 캐시는 막는다.
    const fallback = fallbackPlaces(lat, lng);

    return NextResponse.json({
      items: fallback,
      degraded: true,
      error: error instanceof Error ? error.message : '장소 목록을 불러오지 못했습니다',
    });
  }
}
