import { describe, expect, it } from 'vitest';
import { KOREA_REGIONS, matchStoriesToRegion } from './koreaRegions';

describe('Korea sound map data', () => {
  it('includes the full discovery region set and Jeju geometry', () => {
    expect(KOREA_REGIONS.map(({ id }) => id)).toEqual([
      'capital', 'gangwon', 'chungcheong', 'jeolla', 'gyeongsang', 'jeju',
    ]);
    expect(KOREA_REGIONS.find(({ id }) => id === 'jeju')?.path.length).toBeGreaterThan(10);
  });

  it('does not substitute unrelated stories for an empty region', () => {
    const region = KOREA_REGIONS.find(({ id }) => id === 'jeju')!;
    expect(matchStoriesToRegion([{ title: '서울 북촌', audioTitle: '', category: '한옥', locationName: '서울' }], region)).toEqual([]);
  });
});
