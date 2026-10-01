import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearWarmthCache,
  fetchWarmthData,
} from './warmth.service';
import type { MapInsightsRepository } from './mapInsights.service';
import type { SpringHeatmapSpot } from '@/features/map/warmth/warmthAdapter';

describe('Warmth Service & Fallback (FE #92 / Spec)', () => {
  beforeEach(() => {
    clearWarmthCache();
    vi.restoreAllMocks();
  });

  const mockDelayImmediate = async () => {};

  it('기본 온기 조회는 날짜를 생략해 백엔드 최신 발행일을 사용한다', async () => {
    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        coverageStatus: 'COMPLETE',
        metric: 'VISIT_COUNT',
        observedDate: '2026-08-24',
        generatedAt: '2026-10-01T00:00:00Z',
        spots: [],
      }),
      getObservations: vi.fn(),
    };

    await fetchWarmthData({}, { repository, delayFn: mockDelayImmediate });

    expect(repository.getHeatmap).toHaveBeenCalledWith({
      date: undefined,
      metric: 'VISIT_COUNT',
      regionCode: undefined,
    });
  });

  it('1. Spring heatmap 성공: 기존 HeatSpot으로 변환 및 기존 지도 UI 데이터 형식 유지', async () => {
    const mockSpringSpot: SpringHeatmapSpot = {
      id: 'spot-123',
      placeId: 'place-abc',
      name: '전주 한옥마을',
      region: {
        regionCode: 'kr-45-jeonju',
        name: '전주시 완산구',
        level: 'SIGUNGU',
      },
      coordinates: {
        lat: 35.815,
        lng: 127.153,
      },
      visitorCount: 12345,
      congestionScore: 62.4,
      congestionLevel: 'moderate',
      surgeMultiplier: 1.4,
    };

    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        coverageStatus: 'COMPLETE',
        metric: 'VISIT_COUNT',
        observedDate: '2026-09-28',
        generatedAt: '2026-09-28T00:00:00Z',
        spots: [mockSpringSpot as any],
      }),
      getObservations: vi.fn(),
    };

    const result = await fetchWarmthData(
      { date: '2026-09-28' },
      { repository, delayFn: mockDelayImmediate },
    );

    expect(repository.getHeatmap).toHaveBeenCalledWith({
      date: '2026-09-28',
      metric: 'VISIT_COUNT',
      regionCode: undefined,
    });

    expect(result.source).toBe('SPRING');
    expect(result.coverageStatus).toBe('COMPLETE');
    expect(result.spots).toHaveLength(1);
    expect(repository.getObservations).toHaveBeenCalledWith({
      regionCode: 'kr-45-jeonju',
      metric: 'VISITOR_COUNT',
    });
    expect(result.days).toEqual([{ ymd: '20260928', weekday: '' }]);

    const spot = result.spots[0];
    expect(spot).toEqual({
      id: 'spot-123',
      placeId: 'place-abc',
      name: '전주 한옥마을',
      lat: 35.815,
      lng: 127.153,
      district: '전주시 완산구',
      visitorCount: 12345,
      congestionScore: 62.4,
      congestionLevel: 'moderate',
      surgeMultiplier: 1.4,
      intensity: expect.any(Number),
      updatedAt: expect.any(String),
    });
  });

  it('2. Spring 503 빈 응답: SERVER_WAKING 처리 및 2회 재시도 (총 3회 호출)', async () => {
    let callCount = 0;
    const delays: number[] = [];

    const mockDelay = async (ms: number) => {
      delays.push(ms);
    };

    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockImplementation(async () => {
        callCount++;
        throw {
          status: 503,
          code: 'SERVER_WAKING',
          message: '서비스를 준비하고 있어요.\n잠시 후 다시 불러올게요.',
          details: {},
        };
      }),
      getObservations: vi.fn(),
    };

    const fallbackFetcher = vi.fn().mockResolvedValue({
      source: 'TOUR_API_FALLBACK',
      coverageStatus: 'COMPLETE',
      spots: [],
      days: [],
    });

    const result = await fetchWarmthData(
      { date: '2026-09-28' },
      { repository, fallbackFetcher, delayFn: mockDelay },
    );

    expect(callCount).toBe(3); // 1회 시도 + 2회 재시도
    expect(delays).toEqual([3000, 7000]); // 3초, 7초 간격
    expect(fallbackFetcher).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('TOUR_API_FALLBACK');
  });

  it('3. Spring 503 JSON: SERVICE_UNAVAILABLE 처리 및 2회 재시도', async () => {
    let callCount = 0;

    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockImplementation(async () => {
        callCount++;
        throw {
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          message: '온기 데이터를 잠시 불러오지 못했어요.',
          details: {},
        };
      }),
      getObservations: vi.fn(),
    };

    const fallbackFetcher = vi.fn().mockResolvedValue({
      source: 'TOUR_API_FALLBACK',
      coverageStatus: 'COMPLETE',
      spots: [],
      days: [],
    });

    const result = await fetchWarmthData(
      { date: '2026-09-28' },
      { repository, fallbackFetcher, delayFn: mockDelayImmediate },
    );

    expect(callCount).toBe(3);
    expect(fallbackFetcher).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('TOUR_API_FALLBACK');
  });

  it('4. 두 번 재시도 후 실패: 기존 관광공사 fallback 호출', async () => {
    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockRejectedValue(new Error('Network timeout')),
      getObservations: vi.fn(),
    };

    const fallbackFetcher = vi.fn().mockResolvedValue({
      source: 'TOUR_API_FALLBACK',
      coverageStatus: 'COMPLETE',
      spots: [
        {
          id: 'fallback-spot-1',
          placeId: 'f1',
          name: '강릉 선교장',
          lat: 37.787,
          lng: 128.887,
          district: '강릉시',
          visitorCount: 8000,
          congestionScore: 50,
          congestionLevel: 'moderate',
          surgeMultiplier: 1,
        },
      ],
      days: [],
    });

    const result = await fetchWarmthData(
      { date: '2026-09-28' },
      { repository, fallbackFetcher, delayFn: mockDelayImmediate },
    );

    expect(repository.getHeatmap).toHaveBeenCalledTimes(3);
    expect(fallbackFetcher).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('TOUR_API_FALLBACK');
    expect(result.spots[0].name).toBe('강릉 선교장');
  });

  it('5. Spring 성공 후 fallback 미호출: 관광공사 API 호출 횟수 0', async () => {
    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        coverageStatus: 'COMPLETE',
        metric: 'VISIT_COUNT',
        observedDate: '2026-09-28',
        generatedAt: '2026-09-28T00:00:00Z',
        spots: [],
      }),
      getObservations: vi.fn(),
    };

    const fallbackFetcher = vi.fn();

    const result = await fetchWarmthData(
      { date: '2026-09-28' },
      { repository, fallbackFetcher, delayFn: mockDelayImmediate },
    );

    expect(result.source).toBe('SPRING');
    expect(fallbackFetcher).toHaveBeenCalledTimes(0);
  });

  it('6. 서울 외 지역 응답: 대전, 강원, 전북, 제주 등 지역이 누락되지 않음', async () => {
    const multiRegionSpots: SpringHeatmapSpot[] = [
      {
        id: 'daejeon-1',
        placeId: 'p1',
        name: '대전 동춘당',
        region: { regionCode: 'kr-30-daedeok', name: '대전시 대덕구', level: 'SIGUNGU' },
        coordinates: { lat: 36.3615, lng: 127.4412 },
        congestionLevel: 'relaxed',
      },
      {
        id: 'gangwon-1',
        placeId: 'p2',
        name: '강릉 선교장',
        region: { regionCode: 'kr-42-gangneung', name: '강원도 강릉시', level: 'SIGUNGU' },
        coordinates: { lat: 37.7874, lng: 128.8875 },
        congestionLevel: 'moderate',
      },
      {
        id: 'jeonbuk-1',
        placeId: 'p3',
        name: '전주 한옥마을',
        region: { regionCode: 'kr-45-jeonju', name: '전라북도 전주시', level: 'SIGUNGU' },
        coordinates: { lat: 35.815, lng: 127.153 },
        congestionLevel: 'busy',
      },
      {
        id: 'jeju-1',
        placeId: 'p4',
        name: '제주 성읍민속마을',
        region: { regionCode: 'kr-50-seogwipo', name: '제주도 서귀포시', level: 'SIGUNGU' },
        coordinates: { lat: 33.386, lng: 126.802 },
        congestionLevel: 'relaxed',
      },
    ];

    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        coverageStatus: 'COMPLETE',
        metric: 'VISIT_COUNT',
        observedDate: '2026-09-28',
        generatedAt: '2026-09-28T00:00:00Z',
        spots: multiRegionSpots as any,
      }),
      getObservations: vi.fn(),
    };

    const result = await fetchWarmthData(
      { date: '2026-09-28' },
      { repository, delayFn: mockDelayImmediate },
    );

    expect(result.spots).toHaveLength(4);
    const districts = result.spots.map((s) => s.district);
    expect(districts).toContain('대전시 대덕구');
    expect(districts).toContain('강원도 강릉시');
    expect(districts).toContain('전라북도 전주시');
    expect(districts).toContain('제주도 서귀포시');
  });

  it('7. MISSING coverage는 viewport fallback을 시도하고 fallback도 비면 안내 상태를 표시', async () => {
    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        coverageStatus: 'MISSING',
        metric: 'VISIT_COUNT',
        observedDate: '2026-09-28',
        generatedAt: '2026-09-28T00:00:00Z',
        spots: [],
      }),
      getObservations: vi.fn(),
    };

    const fallbackFetcher = vi.fn().mockResolvedValue({
      source: 'TOUR_API_FALLBACK',
      coverageStatus: 'PARTIAL',
      spots: [],
      days: [],
    });

    const result = await fetchWarmthData(
      { date: '2026-09-28', regionCode: 'kr-99-unknown' },
      { repository, fallbackFetcher, delayFn: mockDelayImmediate },
    );

    expect(result.source).toBe('SPRING');
    expect(fallbackFetcher).toHaveBeenCalledTimes(1);
    expect(result.coverageStatus).toBe('MISSING');
    expect(result.noticeMessage).toBe('현재 선택한 지역의 온기 데이터가 준비되지 않았어요.');
    expect(result.spots).toEqual([]);
  });

  it('8. 동일 파라미터 중복 호출: 캐시 또는 in-flight deduplication으로 1회만 요청', async () => {
    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          schemaVersion: '1.2',
          coverageStatus: 'COMPLETE',
          metric: 'VISIT_COUNT',
          observedDate: '2026-09-28',
          generatedAt: '2026-09-28T00:00:00Z',
          spots: [],
        };
      }),
      getObservations: vi.fn(),
    };

    // 1) in-flight deduplication 테스트: 동시 3회 호출
    const [r1, r2, r3] = await Promise.all([
      fetchWarmthData({ date: '2026-09-28' }, { repository, delayFn: mockDelayImmediate }),
      fetchWarmthData({ date: '2026-09-28' }, { repository, delayFn: mockDelayImmediate }),
      fetchWarmthData({ date: '2026-09-28' }, { repository, delayFn: mockDelayImmediate }),
    ]);

    expect(repository.getHeatmap).toHaveBeenCalledTimes(1);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);

    // 2) 클라이언트 캐시 테스트: 60초 내 재호출
    const r4 = await fetchWarmthData(
      { date: '2026-09-28' },
      { repository, delayFn: mockDelayImmediate },
    );

    expect(repository.getHeatmap).toHaveBeenCalledTimes(1);
    expect(r4).toBe(r1);
  });

  it('9. Spring observations 시계열 연동: observations API 호출 시 days 및 spot.series가 복원됨', async () => {
    const mockSpringSpot: SpringHeatmapSpot = {
      id: 'spot-jeonju',
      placeId: 'p-jeonju',
      name: '전주 한옥마을',
      region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU' },
      coordinates: { lat: 35.815, lng: 127.153 },
      congestionScore: 60,
      congestionLevel: 'moderate',
    };

    const repository: MapInsightsRepository = {
      getHeatmap: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        coverageStatus: 'COMPLETE',
        metric: 'VISIT_COUNT',
        observedDate: '2026-09-28',
        generatedAt: '2026-09-28T00:00:00Z',
        spots: [mockSpringSpot as any],
      }),
      getObservations: vi.fn().mockResolvedValue({
        schemaVersion: '1.2',
        coverageStatus: 'COMPLETE',
        generatedAt: '2026-09-28T00:00:00Z',
        items: [
          {
            observationId: 'obs-1',
            region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
            observedDate: '2026-09-27',
            metric: 'VISIT_COUNT',
            value: 45,
            unit: 'PERSONS',
            spatialLevel: 'SIGUNGU',
            coverageStatus: 'COMPLETE',
          },
          {
            observationId: 'obs-2',
            region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
            observedDate: '2026-09-28',
            metric: 'VISIT_COUNT',
            value: 65,
            unit: 'PERSONS',
            spatialLevel: 'SIGUNGU',
            coverageStatus: 'COMPLETE',
          },
        ],
      }),
    };

    const result = await fetchWarmthData(
      { date: '2026-09-28', regionCode: 'kr-45-jeonju' },
      { repository, delayFn: mockDelayImmediate },
    );

    expect(repository.getHeatmap).toHaveBeenCalledTimes(1);
    expect(repository.getObservations).toHaveBeenCalledWith({
      regionCode: 'kr-45-jeonju',
      metric: 'VISITOR_COUNT',
    });
    expect(result.days).toHaveLength(2);
    expect(result.days.map((d) => d.ymd)).toEqual(['20260927', '20260928']);
    expect(result.spots[0].series).toEqual([45, 65]);
  });
});
