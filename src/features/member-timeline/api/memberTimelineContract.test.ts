import { describe, expect, it } from 'vitest';
import { formatTimelineDayLabel, isSupportedTimelineItem } from './memberTimelineContract';

describe('member timeline contract', () => {
  it('formats day labels and hides unsupported future item types', () => {
    expect(formatTimelineDayLabel('2026-09-14')).toBe('9월 14일');
    expect(
      isSupportedTimelineItem({
        id: 'x',
        type: 'SAVED_PLACE',
        occurredAt: '2026-09-14T00:00:00.000Z',
        title: '전주 한옥마을',
        subtitle: '한옥 · 전주',
        thumbnailUrl: null,
        target: { type: 'PLACE', placeId: 'p1' },
      }),
    ).toBe(true);
    expect(
      isSupportedTimelineItem({
        id: 'x',
        type: 'FUTURE_EVENT' as never,
        occurredAt: '2026-09-14T00:00:00.000Z',
        title: 'x',
        subtitle: null,
        thumbnailUrl: null,
        target: { type: 'PLACE', placeId: 'p1' },
      }),
    ).toBe(false);
  });
});
