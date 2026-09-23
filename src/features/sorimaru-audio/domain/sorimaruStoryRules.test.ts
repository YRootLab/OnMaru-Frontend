import { describe, expect, it } from 'vitest';
import {
  isPlayableStory,
  matchesKeyword,
  formatDistance,
  calculateDistanceKm,
  mapStoryItem,
} from './sorimaruStoryRules';

describe('mapStoryItem', () => {
  it('maps a raw item into a screen-ready story, upgrading http audio to https', () => {
    const story = mapStoryItem({ title: '대청마루 이야기', stid: 's-1', audioUrl: 'http://x.test/a.mp3', playTime: '125' }, 0);

    expect(story.title).toBe('대청마루 이야기');
    expect(story.audioUrl).toBe('https://x.test/a.mp3');
    expect(story.formattedDuration).toBe('2분 05초');
  });

  it('falls back to default copy when fields are missing', () => {
    const story = mapStoryItem({}, 0);
    expect(story.title).toBe('한국의 문화 이야기');
    expect(story.script).toBe('아직 대본이 준비되지 않았어요.');
  });

  it('computes a formatted distance when an origin is given', () => {
    const story = mapStoryItem(
      { mapX: '126.9780', mapY: '37.5665' },
      0,
      undefined,
      { mapX: '126.9780', mapY: '37.5665' },
    );
    expect(story.distance).toBe('100m');
  });
});

describe('isPlayableStory', () => {
  it('requires a non-empty audioUrl', () => {
    expect(isPlayableStory(mapStoryItem({ audioUrl: 'https://x.test/a.mp3' }, 0))).toBe(true);
    expect(isPlayableStory(mapStoryItem({}, 0))).toBe(false);
  });
});

describe('matchesKeyword', () => {
  it('matches through a keyword synonym', () => {
    const story = mapStoryItem({ title: '고택 나들이' }, 0);
    expect(matchesKeyword(story, '한옥')).toBe(true);
  });

  it('does not match unrelated keywords', () => {
    const story = mapStoryItem({ title: '고택 나들이' }, 0);
    expect(matchesKeyword(story, '바다')).toBe(false);
  });
});

describe('distance helpers', () => {
  it('formats sub-kilometer distances in meters', () => {
    expect(formatDistance(0.1)).toBe('100m');
  });

  it('formats longer distances in kilometers', () => {
    expect(formatDistance(2.345)).toBe('2.3km');
  });

  it('returns null when any coordinate is not finite', () => {
    expect(calculateDistanceKm('a', '37.5', '126.9', '37.5')).toBeNull();
  });
});
