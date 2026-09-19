import { NextResponse } from 'next/server';
import { VisitorService } from '@/features/map/services/visitor.service';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';
import { findRegionEntry } from '@/features/journey-curator/data/regionSoundKeywords';

/**
 * 홈 피드 "지금 많이 듣는 소리마루" 섹션용 실시간 큐레이션 API.
 *
 * VisitorService(DataLab 외지인 방문자 수)로 상위 지역을 찾고,
 * 각 지역에 맞는 소리마루 트랙을 sorimaruApiAdapter로 검색해 반환한다.
 *
 * 두 데이터 모두 캐시가 있어서 실제 외부 호출은 드물다:
 * - VisitorService: 6시간 캐시 (히트맵과 공유)
 * - sorimaruApiAdapter: 내부 requst 레벨 캐시
 *
 * Cache-Control: s-maxage=21600(6h) / stale-while-revalidate=3600(1h)
 */

export interface TrendingSound {
  id: string;
  title: string;
  location: string;
  duration: string;
  href: string;
  regionName: string;
  rank: number;
}

/** 최근 N일치 방문자 수 합산 */
const RECENT_DAYS = 7;
/** 최대 반환 트랙 수 */
const MAX_TRACKS = 3;

/**
 * 상위 지역 추출 — signguNm 기준 최근 RECENT_DAYS일 외지인 합산 내림차순.
 */
function pickTopRegions(
  visitorSeries: Map<string, number[]>,
  daysCount: number,
): Array<{ name: string; totalVisitors: number }> {
  const startIdx = Math.max(0, daysCount - RECENT_DAYS);
  const scores: Array<{ name: string; totalVisitors: number }> = [];

  for (const [name, arr] of visitorSeries) {
    const total = arr.slice(startIdx).reduce((s, n) => s + n, 0);
    if (total > 0) scores.push({ name, totalVisitors: total });
  }

  return scores.sort((a, b) => b.totalVisitors - a.totalVisitors);
}

export async function GET() {
  try {
    /* 1. 실시간 방문자 시계열 가져오기 (히트맵과 캐시 공유) */
    const { days, visitorSeries } = await VisitorService.getDailySeries();

    /* 2. 최근 7일 합산으로 상위 지역 추출 */
    const topRegions = pickTopRegions(visitorSeries, days.length);

    /* 3. 매핑 테이블에 있는 지역만 추려서 최대 MAX_TRACKS * 2 배를 시도 (실패 여유분) */
    const candidates = topRegions
      .filter((r) => findRegionEntry(r.name) !== null)
      .slice(0, MAX_TRACKS * 2);

    if (candidates.length === 0) {
      // 데이터랩 응답이 없거나 매핑 지역이 없으면 폴백으로 빈 배열 반환
      // 클라이언트가 하드코딩 폴백을 사용하게 됨
      return NextResponse.json(
        { 
          title: '지금 인기 있는 한옥 소리',
          description: '처마 밑 빗소리와 대청마루 풍경소리를 들어보세요.',
          sounds: [] 
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
          },
        },
      );
    }

    /* 4. 각 지역 소리마루 트랙 병렬 검색 */
    const results = await Promise.allSettled(
      candidates.map(async ({ name, totalVisitors }, idx) => {
        const entry = findRegionEntry(name)!;
        const story = await sorimaruApiAdapter.getFirstStoryByKeyword(entry.keyword);
        if (!story) return null;

        const sound: TrendingSound = {
          id: `trending-${story.stid || idx}`,
          title: story.audioTitle || story.title,
          location: story.locationName || entry.displayName,
          duration: story.formattedDuration || '3분 00초',
          href: `/sorimaru?keyword=${encodeURIComponent(entry.keyword)}&title=${encodeURIComponent(story.audioTitle || story.title)}&autoPlay=true`,
          regionName: entry.displayName,
          rank: idx + 1,
        };
        return sound;
      }),
    );

    /* 5. 성공한 것만, id 중복 제거 후 최대 MAX_TRACKS개 반환.
       서로 다른 지역 키워드가 같은 소리마루 트랙(story.stid)으로 매칭될 수 있어
       (예: 두 지역 다 동일 트랙이 "첫 결과"인 경우), 그대로 두면 React key가 겹친다. */
    const seenIds = new Set<string>();
    const sounds: TrendingSound[] = results
      .filter((r): r is PromiseFulfilledResult<TrendingSound> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
      .filter((sound) => {
        if (seenIds.has(sound.id)) return false;
        seenIds.add(sound.id);
        return true;
      })
      .slice(0, MAX_TRACKS);

    return NextResponse.json(
      { sounds },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
        },
      },
    );
  } catch (err) {
    console.error('[trending-sounds] 실시간 큐레이션 실패:', err);
    // 오류 시 빈 배열 → 클라이언트 폴백
    return NextResponse.json(
      { 
        title: '지금 인기 있는 한옥 소리',
        description: '처마 밑 빗소리와 대청마루 풍경소리를 들어보세요.',
        sounds: [] 
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      },
    );
  }
}
