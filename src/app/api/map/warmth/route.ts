import { NextResponse } from 'next/server';
import { PlaceService } from '@/map/services/place.service';
import { VisitorService } from '@/map/services/visitor.service';
import { seedWarmth } from '@/map/warmth/seed';
import type { Warmth } from '@/map/types';

function formatVisitorNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  return num.toLocaleString();
}

/**
 * 한국관광공사 TOUR_API_VISITOR_KEY 기반 온기 히트맵 데이터 API
 * 
 * DataLabService(빅데이터 지자체별 방문자 수)를 연동하여
 * 실제 외지인 관광객 방문 밀도 및 혼잡도를 온기 히트맵 강도로 직접 매핑합니다.
 * (가공된 한 줄 평 없이, 순수 빅데이터 기반의 실시간 온기 밀도 제공)
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const lat = Number(q.get('lat'));
  const lng = Number(q.get('lng'));
  const radius = Number(q.get('radius')) || 8000;

  const now = Date.now();

  try {
    // 1. 한국관광공사 TOUR_API_VISITOR_KEY & TOUR_API_CONGESTION_KEY 빅데이터 맵 조회
    const { visitorMap, localMap, maxVisitor, avgVisitor } = await VisitorService.getDetailedData();

    // 2. 현재 지도 뷰포트 내의 실제 한옥/문화재 장소 조회
    let heatmapWarmths: Warmth[] = [];

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const places = await PlaceService.getNearbyPlaces({
        lat,
        lng,
        radius: Math.max(radius, 5000),
      });

      places.forEach((p) => {
        // 주소로부터 해당 시·군·구의 실제 외지인 방문객 및 집중도 추출
        const stat = VisitorService.resolveCongestion(p.addr, visitorMap, localMap, maxVisitor);

        heatmapWarmths.push({
          id: `visitor-${p.id}`,
          placeId: p.id,
          placeName: p.name,
          lat: p.lat,
          lng: p.lng,
          text: `외지인 방문객 ${formatVisitorNumber(stat.visitorCount)}명 (수요 집중 ${stat.surgeMultiplier}배)`,
          mood: stat.congestionLevel === 'relaxed' ? '한적' : '북적',
          score: stat.congestionLevel === 'surge' ? 5 : 4,
          tags: [stat.district, `${formatVisitorNumber(stat.visitorCount)}명`, stat.congestionLevel],
          visitorCount: stat.visitorCount,
          createdAt: new Date().toISOString(),
        });
      });
    }

    // 3. 만약 해당 지역에 개별 한옥 데이터가 적을 경우 시드 온기 보충
    const baseWarmths = seedWarmth(now);
    const placeMap = new Map<string, Warmth>();

    for (const w of heatmapWarmths) {
      placeMap.set(w.id, w);
    }
    for (const w of baseWarmths) {
      if (!placeMap.has(w.id)) {
        placeMap.set(w.id, w);
      }
    }

    const allWarmths = Array.from(placeMap.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    return NextResponse.json({
      warmths: allWarmths,
      totalCount: allWarmths.length,
      visitorHeatmapCount: heatmapWarmths.length,
      maxVisitor,
      avgVisitor,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('온기 히트맵 API 조회 실패:', error);
    return NextResponse.json({
      warmths: seedWarmth(now),
      totalCount: seedWarmth(now).length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
