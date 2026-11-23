import { describe, expect, it } from 'vitest';
import type { JourneyBoard, PlaceResource } from '../types/exploration.types';
import { findPlaces } from './JourneyChatInterface';

describe('findPlaces', () => {
  it('uses the turn ID when a Bento response has no plan ID', () => {
    const board = {
      title: '비 오는 날 산책',
      querySummary: '조용한 한옥 여행',
      hanokCard: { title: '한옥', location: '서울', architecturalPoint: '고즈넉한 마당' },
      routeCard: { stops: [{ name: '첫 번째 정류장', category: '명소', description: '산책', time: '10:00' }] },
    } as unknown as JourneyBoard;
    const resolvePlaces = findPlaces as (input: JourneyBoard | null, fallbackPlanId?: string) => PlaceResource[];

    expect(resolvePlaces(board, 'turn-123').map((place) => place.ref.id)).toEqual([
      'place-turn-123-hanok',
      'place-turn-123-stop-1',
    ]);
  });
});
