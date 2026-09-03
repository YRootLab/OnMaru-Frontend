import { NextResponse } from 'next/server';
import { PlaceService } from '@/map/services/place.service';
import { VisitorService } from '@/map/services/visitor.service';
import type { HeatSpot, CongestionLevel } from '@/map/types';

/**
 * 한국관광공사 TOUR_API_VISITOR_KEY & TOUR_API_CONGESTION_KEY 기반
 * 우버 스타일 실시간 혼잡도 및 방문자 집중도 히트스팟 API
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const lat = Number(q.get('lat'));
  const lng = Number(q.get('lng'));
  const radius = Number(q.get('radius')) || 10000;

  try {
    // 1. 전국 지자체별 방문자 및 거주자 빅데이터 수집
    const { visitorMap, localMap, maxVisitor } = await VisitorService.getDetailedData();

    const spots: HeatSpot[] = [];

    // 2. 현재 지도 뷰포트 내 장소들 조회
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const places = await PlaceService.getNearbyPlaces({
        lat,
        lng,
        radius: Math.max(radius, 6000),
      });

      places.forEach((p) => {
        const stat = VisitorService.resolveCongestion(p.addr, visitorMap, localMap, maxVisitor);

        spots.push({
          id: `heat-${p.id}`,
          placeId: p.id,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          district: stat.district,
          visitorCount: stat.visitorCount,
          congestionScore: stat.congestionScore,
          congestionLevel: stat.congestionLevel,
          surgeMultiplier: stat.surgeMultiplier,
          intensity: stat.intensity,
          updatedAt: new Date().toISOString(),
        });
      });
    }

    // 3. 전국 주요 전통 한옥 거점 기본 보충 (서울, 전주, 경주, 안동 등 기본 시드 거점)
    const seedCenters: { name: string; lat: number; lng: number; district: string }[] = [
      { name: '북촌 한옥마을 일대', lat: 37.5826, lng: 126.9848, district: '종로구' },
      { name: '전주 한옥마을 일대', lat: 35.815, lng: 127.153, district: '완산구' },
      { name: '경주 양동/교촌 일대', lat: 35.832, lng: 129.216, district: '경주시' },
      { name: '안동 하회마을 일대', lat: 36.5392, lng: 128.5185, district: '안동시' },
      { name: '대전 동춘당/우암 일대', lat: 36.3615, lng: 127.4412, district: '대덕구' },
      { name: '대전 유성 온천/한옥 일대', lat: 36.3537, lng: 127.3415, district: '유성구' },
      { name: '대전 둔산/시민광장 일대', lat: 36.3504, lng: 127.3849, district: '서구' },
      { name: '강릉 선교장 일대', lat: 37.7874, lng: 128.8875, district: '강릉시' },
    ];

    seedCenters.forEach((c, idx) => {
      // 뷰포트와의 거리 필터 (반경 30km 이내이거나 spots가 적을 때 포함)
      const dLat = Math.abs(c.lat - (Number.isFinite(lat) ? lat : 36.35));
      const dLng = Math.abs(c.lng - (Number.isFinite(lng) ? lng : 127.75));
      if (dLat < 0.45 && dLng < 0.45) {
        const stat = VisitorService.resolveCongestion(c.district, visitorMap, localMap, maxVisitor);
        spots.push({
          id: `seed-center-${idx}`,
          placeId: `hub-${idx}`,
          name: c.name,
          lat: c.lat,
          lng: c.lng,
          district: c.district,
          visitorCount: stat.visitorCount,
          congestionScore: stat.congestionScore,
          congestionLevel: stat.congestionLevel,
          surgeMultiplier: stat.surgeMultiplier,
          intensity: stat.intensity,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return NextResponse.json({
      spots,
      count: spots.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('우버 히트맵 API 호출 실패:', error);
    return NextResponse.json({
      spots: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
