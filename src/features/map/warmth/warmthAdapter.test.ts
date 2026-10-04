import { describe, expect, it } from 'vitest';
import type { HeatSpot } from '@/features/map/types';
import {
  adaptObservationsToDaysAndSeries,
  adaptSpringSpotsToHeatSpots,
  adaptSpringSpotToHeatSpot,
  isScoreMetric,
  normalizeCongestionLevel,
  type ObservationItem,
  type SpringHeatmapSpot,
} from './warmthAdapter';

describe('warmthAdapter (Issue #321)', () => {
  describe('normalizeCongestionLevel', () => {
    it('normalizes string congestion levels accurately', () => {
      expect(normalizeCongestionLevel('relaxed', 10)).toBe('relaxed');
      expect(normalizeCongestionLevel('LOW', 10)).toBe('relaxed');
      expect(normalizeCongestionLevel('moderate', 40)).toBe('moderate');
      expect(normalizeCongestionLevel('MEDIUM', 40)).toBe('moderate');
      expect(normalizeCongestionLevel('busy', 60)).toBe('busy');
      expect(normalizeCongestionLevel('HIGH', 60)).toBe('busy');
      expect(normalizeCongestionLevel('surge', 90)).toBe('surge');
      expect(normalizeCongestionLevel('VERY_HIGH', 90)).toBe('surge');
    });

    it('falls back to levelOf(score) when level is undefined or unknown', () => {
      expect(normalizeCongestionLevel(undefined, 20)).toBe('relaxed');
      expect(normalizeCongestionLevel(undefined, 45)).toBe('moderate');
      expect(normalizeCongestionLevel(undefined, 65)).toBe('busy');
      expect(normalizeCongestionLevel(undefined, 85)).toBe('surge');
    });
  });

  describe('isScoreMetric', () => {
    it('identifies score units and metrics', () => {
      expect(isScoreMetric('CONGESTION_SCORE', 'SCORE')).toBe(true);
      expect(isScoreMetric(undefined, 'SCORE')).toBe(true);
      expect(isScoreMetric('CONGESTION_SCORE', undefined)).toBe(true);
      expect(isScoreMetric(undefined, 'INDEX')).toBe(true);
    });

    it('identifies visitor count and persons units as non-score', () => {
      expect(isScoreMetric('VISITOR_COUNT', 'PERSONS')).toBe(false);
      expect(isScoreMetric('VISIT_COUNT', 'PERSONS')).toBe(false);
      expect(isScoreMetric(undefined, 'PERSONS')).toBe(false);
      expect(isScoreMetric('VISITOR_COUNT', undefined)).toBe(false);
    });
  });

  describe('adaptSpringSpotToHeatSpot', () => {
    it('maps Spring heatmap spot to HeatSpot preserving regionCode and normalized intensity', () => {
      const springSpot: SpringHeatmapSpot = {
        id: 's-1',
        placeId: 'p-1',
        name: '경주 교촌마을',
        region: { regionCode: 'kr-47-gyeongju', name: '경주시', level: 'SIGUNGU' },
        coordinates: { lat: 35.83, lng: 129.21 },
        visitorCount: 5400,
        congestionScore: 40,
        congestionLevel: 'moderate',
        surgeMultiplier: 1.1,
      };

      const adapted = adaptSpringSpotToHeatSpot(springSpot);
      expect(adapted.id).toBe('s-1');
      expect(adapted.placeId).toBe('p-1');
      expect(adapted.name).toBe('경주 교촌마을');
      expect(adapted.district).toBe('경주시');
      expect(adapted.regionCode).toBe('kr-47-gyeongju');
      expect(adapted.visitorCount).toBe(5400);
      expect(adapted.congestionScore).toBe(40);
      expect(adapted.congestionLevel).toBe('moderate');
      expect(adapted.intensity).toBe(0.4);
    });

    it('handles batch array mapping with adaptSpringSpotsToHeatSpots', () => {
      expect(adaptSpringSpotsToHeatSpots([])).toEqual([]);
      expect(adaptSpringSpotsToHeatSpots(null as any)).toEqual([]);
    });
  });

  describe('adaptObservationsToDaysAndSeries (Issue #321 unit mismatch & region isolation)', () => {
    const jeonjuSpot: HeatSpot = {
      id: 'spot-jeonju',
      placeId: 'p-jeonju',
      name: '전주 한옥마을',
      lat: 35.815,
      lng: 127.153,
      district: '전주시 완산구',
      regionCode: 'kr-45-jeonju',
      visitorCount: 8500,
      congestionScore: 35,
      congestionLevel: 'moderate',
      surgeMultiplier: 1.0,
      intensity: 0.35,
    };

    const seoulSpot: HeatSpot = {
      id: 'spot-seoul',
      placeId: 'p-seoul',
      name: '북촌 한옥마을',
      lat: 37.582,
      lng: 126.983,
      district: '서울시 종로구',
      regionCode: 'kr-11-jongno',
      visitorCount: 15000,
      congestionScore: 80,
      congestionLevel: 'surge',
      surgeMultiplier: 1.5,
      intensity: 0.8,
    };

    it('방문자 수(PERSONS) 단위는 spot.series로 사용하지 않아 혼잡도 점수 오염을 방지한다', () => {
      const visitorObservations: ObservationItem[] = [
        {
          observationId: 'obs-v1',
          region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
          observedDate: '2026-09-27',
          metric: 'VISITOR_COUNT',
          value: 12500, // 12,500 persons
          unit: 'PERSONS',
          spatialLevel: 'SIGUNGU',
          coverageStatus: 'COMPLETE',
        },
        {
          observationId: 'obs-v2',
          region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
          observedDate: '2026-09-28',
          metric: 'VISITOR_COUNT',
          value: 18000, // 18,000 persons
          unit: 'PERSONS',
          spatialLevel: 'SIGUNGU',
          coverageStatus: 'COMPLETE',
        },
      ];

      const { days, spots } = adaptObservationsToDaysAndSeries(visitorObservations, [jeonjuSpot]);

      // days are properly extracted from observation dates
      expect(days).toEqual([
        { ymd: '20260927', weekday: '일' },
        { ymd: '20260928', weekday: '월' },
      ]);

      // spot.series is NOT populated with huge person counts
      expect(spots[0].series).toBeUndefined();
      expect(spots[0].congestionScore).toBe(35);
      expect(spots[0].congestionLevel).toBe('moderate');
      expect(spots[0].intensity).toBe(0.35);
    });

    it('점수(SCORE) 단위는 매칭되는 지역 spot.series에 정상 반영된다', () => {
      const scoreObservations: ObservationItem[] = [
        {
          observationId: 'obs-s1',
          region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
          observedDate: '2026-09-27',
          metric: 'CONGESTION_SCORE',
          value: 40,
          unit: 'SCORE',
          spatialLevel: 'SIGUNGU',
          coverageStatus: 'COMPLETE',
        },
        {
          observationId: 'obs-s2',
          region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
          observedDate: '2026-09-28',
          metric: 'CONGESTION_SCORE',
          value: 65,
          unit: 'SCORE',
          spatialLevel: 'SIGUNGU',
          coverageStatus: 'COMPLETE',
        },
      ];

      const { days, spots } = adaptObservationsToDaysAndSeries(scoreObservations, [jeonjuSpot]);

      expect(days.map((d) => d.ymd)).toEqual(['20260927', '20260928']);
      expect(spots[0].series).toEqual([40, 65]);
    });

    it('서로 다른 지역의 혼잡도 점수가 유지되며 특정 지역 관측값이 다른 지역에 오염되지 않는다', () => {
      const jeonjuScoreObservations: ObservationItem[] = [
        {
          observationId: 'obs-j1',
          region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
          observedDate: '2026-09-27',
          metric: 'CONGESTION_SCORE',
          value: 25,
          unit: 'SCORE',
          spatialLevel: 'SIGUNGU',
          coverageStatus: 'COMPLETE',
        },
        {
          observationId: 'obs-j2',
          region: { regionCode: 'kr-45-jeonju', name: '전주시 완산구', level: 'SIGUNGU', parentRegionCode: null },
          observedDate: '2026-09-28',
          metric: 'CONGESTION_SCORE',
          value: 30,
          unit: 'SCORE',
          spatialLevel: 'SIGUNGU',
          coverageStatus: 'COMPLETE',
        },
      ];

      const { spots } = adaptObservationsToDaysAndSeries(jeonjuScoreObservations, [jeonjuSpot, seoulSpot]);

      // Jeonju spot got its series
      const updatedJeonju = spots.find((s) => s.id === 'spot-jeonju')!;
      expect(updatedJeonju.series).toEqual([25, 30]);

      // Seoul spot was NOT overwritten with Jeonju observation
      const updatedSeoul = spots.find((s) => s.id === 'spot-seoul')!;
      expect(updatedSeoul.series).toBeUndefined();
      expect(updatedSeoul.congestionScore).toBe(80);
      expect(updatedSeoul.congestionLevel).toBe('surge');
    });
  });
});
