import { NextResponse } from 'next/server';
import { PlaceService } from '@/map/services/place.service';
import { VisitorService } from '@/map/services/visitor.service';
import type { HeatSpot, CongestionLevel } from '@/map/types';

/**
 * 주소로부터 행정동/지역 권역명 추출 (상호명 대신 '삼성동 일대', '청담동 일대' 등 지역 권역 명칭 산출)
 */
function extractZoneName(addr: string, district: string): string {
  const parts = (addr || '').trim().split(/\s+/);
  let sub = '';
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (
      p.endsWith('동') ||
      p.endsWith('읍') ||
      p.endsWith('면') ||
      p.endsWith('가') ||
      p.endsWith('로') ||
      p.endsWith('리')
    ) {
      sub = p;
      break;
    }
  }
  const main = district || parts[1] || parts[0] || '해당 권역';
  return sub ? `${main} ${sub} 일대` : `${main} 일대`;
}

/**
 * 한국관광공사 TOUR_API_VISITOR_KEY & TOUR_API_CONGESTION_KEY 기반
 * 실시간 권역별 혼잡도 및 관광객 집중도 히트스팟 API
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

    // 2. 현재 지도 뷰포트 내 장소들을 지역 권역(동/읍/면 일대) 단위로 집계
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const places = await PlaceService.getNearbyPlaces({
        lat,
        lng,
        radius: Math.max(radius, 6000),
      });

      // 개별 상호명을 노출하지 않고 권역(Zone) 중심점으로 집계
      const zoneMap = new Map<
        string,
        {
          latSum: number;
          lngSum: number;
          count: number;
          district: string;
          stat: ReturnType<typeof VisitorService.resolveCongestion>;
        }
      >();

      places.forEach((p) => {
        const stat = VisitorService.resolveCongestion(p.addr, visitorMap, localMap, maxVisitor);
        const zoneName = extractZoneName(p.addr, stat.district);

        const prev = zoneMap.get(zoneName) || {
          latSum: 0,
          lngSum: 0,
          count: 0,
          district: stat.district,
          stat,
        };
        prev.latSum += p.lat;
        prev.lngSum += p.lng;
        prev.count += 1;
        zoneMap.set(zoneName, prev);
      });

      Array.from(zoneMap.entries()).forEach(([zoneName, data], idx) => {
        const zoneLat = data.latSum / data.count;
        const zoneLng = data.lngSum / data.count;
        const stat = data.stat;

        spots.push({
          id: `heat-zone-${idx}`,
          placeId: `zone-${idx}`,
          name: zoneName,
          lat: zoneLat,
          lng: zoneLng,
          district: data.district,
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
    console.error('권역 히트맵 API 호출 실패:', error);
    return NextResponse.json({
      spots: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
