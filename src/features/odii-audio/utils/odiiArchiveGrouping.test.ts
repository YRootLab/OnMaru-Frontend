import { describe, expect, it } from 'vitest';
import type { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { groupOdiiStoriesByPlace } from './odiiArchiveGrouping';

const story = (stid: string, title: string): OdiiStoryItem => ({
  tid: stid,
  tlid: '',
  stid,
  stlid: '',
  title,
  audioTitle: title,
  category: '궁궐/역사',
  mapX: '126.978',
  mapY: '37.566',
  script: '',
  playTime: '120',
  audioUrl: 'https://example.com/audio.mp3',
  imageUrl: '',
  locationName: '충남 부여군',
});

describe('groupOdiiStoriesByPlace', () => {
  it('groups stories sharing a place prefix while retaining unrelated places', () => {
    const groups = groupOdiiStoriesByPlace([
      story('1', '백제문화단지 - 입구'),
      story('2', '백제문화단지 - 천정전'),
      story('3', '경복궁 - 근정전'),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      label: '백제문화단지',
      stories: [{ stid: '1' }, { stid: '2' }],
    });
    expect(groups[1]).toMatchObject({
      label: '경복궁',
      stories: [{ stid: '3' }],
    });
  });

  it('keeps a title without a place separator as its own group', () => {
    const groups = groupOdiiStoriesByPlace([story('4', '서울의 오래된 골목 소리')]);

    expect(groups).toMatchObject([{ key: 'stid:4', label: '서울의 오래된 골목 소리' }]);
  });
});
