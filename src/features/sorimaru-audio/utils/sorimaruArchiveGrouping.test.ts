import { describe, expect, it } from 'vitest';
import type { SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { groupSorimaruStoriesByPlace } from './sorimaruArchiveGrouping';

const story = (storyId: string, title: string): SorimaruStorySummary => ({
  storyId,
  title,
  audioTitle: title,
  category: '궁궐/역사',
  region: { regionCode: '44', name: '충남 부여군', level: 'SIGUNGU', parentRegionCode: null },
  coordinates: { lat: 37.566, lng: 126.978 },
  durationSeconds: 120,
  imageUrl: null,
  linkedPlaceId: null,
  contentTags: [],
  savedByMe: false,
});

describe('groupSorimaruStoriesByPlace', () => {
  it('groups stories sharing a place prefix while retaining unrelated places', () => {
    const groups = groupSorimaruStoriesByPlace([
      story('1', '백제문화단지 - 입구'),
      story('2', '백제문화단지 - 천정전'),
      story('3', '경복궁 - 근정전'),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      label: '백제문화단지',
      stories: [{ storyId: '1' }, { storyId: '2' }],
    });
    expect(groups[1]).toMatchObject({
      label: '경복궁',
      stories: [{ storyId: '3' }],
    });
  });

  it('keeps a title without a place separator as its own group', () => {
    const groups = groupSorimaruStoriesByPlace([story('4', '서울의 오래된 골목 소리')]);

    expect(groups).toMatchObject([{ key: 'stid:4', label: '서울의 오래된 골목 소리' }]);
  });
});
