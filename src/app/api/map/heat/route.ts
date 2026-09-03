import { NextResponse } from 'next/server';
import { PlaceService } from '@/map/services/place.service';
import { VisitorService } from '@/map/services/visitor.service';
import { seedWarmth } from '@/map/warmth/seed';
import type { HeatSpot, CongestionLevel } from '@/map/types';

/**
 * 주소로부터 행정동/지역 권역명 추출 (상호명 대신 '삼성동 일대', '청담동 일대' 등 지역 권역 명칭 산출)
 */
function extractZoneName(addr: string, district: string): string {
  const cleanAddr = (addr || '').replace(/일대/g, '').trim();
  const parts = cleanAddr.split(/\s+/);
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
  const level = Number(q.get('level')) || 7;
  const requestedRadius = Number(q.get('radius')) || 10000;
  // 확대 시에도 주변 5km 이상 반경의 스팟을 확보하여 히트맵이 비는 현상 방지
  const radius = Math.max(requestedRadius, level <= 5 ? 5000 : 15000);

  try {
    // 1. 전국 지자체별 방문자 및 거주자 빅데이터 수집
    const { visitorMap, localMap, maxVisitor } = await VisitorService.getDetailedData();

    const spots: HeatSpot[] = [];

    // 2. 현재 지도 뷰포트 내 장소들을 레벨에 맞추어 적응형으로 구성
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      let places = await PlaceService.getNearbyPlaces({
        lat,
        lng,
        radius,
      });

      // 공공 API 일일 호출 제한(에러 22) 또는 빈 응답 시 전국 전통 한옥 시드 장소로 안전 폴백
      if (places.length === 0) {
        const seeds = seedWarmth();
        places = seeds
          .map((s) => ({
            id: s.placeId || s.id,
            name: s.placeName,
            lat: s.lat,
            lng: s.lng,
            addr: s.placeName,
            category: 'spot' as const,
            image: '',
            tel: null,
            dist: 0,
          }))
          .filter((s) => {
            const d = Math.hypot(s.lat - lat, s.lng - lng);
            // 확대 레벨에서는 주변 반경, 축소 광역 뷰(level >= 8)에서는 전국(동·서·남·북) 고르게 매칭
            return d < (level <= 5 ? 0.2 : level <= 7 ? 0.9 : 3.5);
          });
      }

      if (places.length > 0) {
        if (level <= 6) {
          // [확대 모드: level <= 6]
          // 개별 장소/골목 좌표에 스팟을 유지하여 확대 시 히트맵이 사라지지 않고 살아있도록 처리
          places.forEach((p, idx) => {
            const stat = VisitorService.resolveCongestion(p.addr, visitorMap, localMap, maxVisitor);
            const zoneName = extractZoneName(p.addr, stat.district);

            spots.push({
              id: `heat-detail-${p.id || idx}`,
              placeId: p.id,
              name: zoneName !== '해당 권역 일대' ? zoneName : `${p.name} 일대`,
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
        } else {
          // [축소 모드: level >= 7]
          // 행정 구/동 단위로 스팟을 그룹화하여 권역 중심점에 훈기 집중
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
      }
    }

    // 3. 전국 주요 전통 한옥 거점 기본 보충 (동서남북 균형 배치)
    const seedCenters: { name: string; lat: number; lng: number; district: string }[] = [
      // 수도권
      { name: '북촌 한옥마을 일대', lat: 37.5826, lng: 126.9848, district: '종로구' },
      { name: '수원 화성행궁 일대', lat: 37.285, lng: 127.015, district: '수원시' },
      // 강원권 (동부)
      { name: '강릉 선교장·오죽헌 일대', lat: 37.7874, lng: 128.8875, district: '강릉시' },
      { name: '속초·영동 한옥 일대', lat: 38.207, lng: 128.591, district: '속초시' },
      // 충청권
      { name: '대전 동춘당·우암 일대', lat: 36.3615, lng: 127.4412, district: '대덕구' },
      { name: '공주 한옥마을 일대', lat: 36.463, lng: 127.118, district: '공주시' },
      // 경북권 (동부)
      { name: '안동 하회마을 일대', lat: 36.5392, lng: 128.5185, district: '안동시' },
      { name: '경주 양동·교촌 일대', lat: 35.832, lng: 129.216, district: '경주시' },
      { name: '영주 선비촌·소수 일대', lat: 36.924, lng: 128.578, district: '영주시' },
      { name: '대구 옻골마을 일대', lat: 35.894, lng: 128.692, district: '대구시' },
      // 경남권 (동남부)
      { name: '부산 동래 한옥 일대', lat: 35.205, lng: 129.08, district: '부산시' },
      { name: '산청 남사예담촌 일대', lat: 35.312, lng: 127.915, district: '산청군' },
      // 전라권 (서남부)
      { name: '전주 한옥마을 일대', lat: 35.815, lng: 127.153, district: '완산구' },
      { name: '담양 소쇄원·죽녹원 일대', lat: 35.234, lng: 127.006, district: '담양군' },
      { name: '순천 낙안읍성 일대', lat: 34.907, lng: 127.34, district: '순천시' },
    ];

    seedCenters.forEach((c, idx) => {
      const dLat = Math.abs(c.lat - (Number.isFinite(lat) ? lat : 36.35));
      const dLng = Math.abs(c.lng - (Number.isFinite(lng) ? lng : 127.75));
      const maxDelta = level <= 5 ? 0.15 : level <= 7 ? 0.8 : 3.5;
      if (dLat < maxDelta && dLng < maxDelta) {
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

    // 4. 스팟이 비어있을 경우 현재 뷰포트 중심 좌표 일대를 즉시 스팟화하여 확대 시 빈 화면 방지
    if (spots.length === 0 && Number.isFinite(lat) && Number.isFinite(lng)) {
      let closest = seedCenters[0];
      let minDist = Infinity;
      seedCenters.forEach((c) => {
        const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      });
      const stat = VisitorService.resolveCongestion(closest.district, visitorMap, localMap, maxVisitor);
      spots.push({
        id: `heat-viewport-center`,
        placeId: `viewport-center`,
        name: `${closest.district} 일대`,
        lat: lat,
        lng: lng,
        district: closest.district,
        visitorCount: stat.visitorCount,
        congestionScore: stat.congestionScore,
        congestionLevel: stat.congestionLevel,
        surgeMultiplier: stat.surgeMultiplier,
        intensity: stat.intensity,
        updatedAt: new Date().toISOString(),
      });
    }

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
