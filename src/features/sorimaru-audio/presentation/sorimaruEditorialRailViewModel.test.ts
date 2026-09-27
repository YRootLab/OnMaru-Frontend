import { describe, expect, it } from 'vitest';
import { mapStoryPage } from '../domain/sorimaruStoryMapper';
import { editorialRailCardViewModel } from './sorimaruEditorialRailViewModel';

describe('Sorimaru editorial rail card copy', () => {
  it('matches the legacy badge, location, and duration for a backend summary', () => {
    const page = mapStoryPage({
      items: [{
        storyId: 'story-1',
        title: '전주의 이야기',
        audioTitle: '전주의 이야기',
        category: '소리 이야기',
        region: {
          regionCode: 'kr-45-110',
          name: '전주시 완산구',
          level: 'DISTRICT',
          parentRegionCode: 'kr-45',
        },
        coordinates: null,
        durationSeconds: 125,
        imageUrl: null,
        linkedPlaceId: null,
        contentTags: ['palace'],
        savedByMe: false,
      }],
      nextCursor: null,
      hasMore: false,
    });

    expect(editorialRailCardViewModel(page.items[0])).toEqual({
      badgeText: '소리 이야기',
      subtitle: '전주시 완산구',
      durationText: '2분 05초',
    });
  });
});
