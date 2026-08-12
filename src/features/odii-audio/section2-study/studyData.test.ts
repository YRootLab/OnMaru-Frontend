import { describe, expect, it } from 'vitest';
import {
  SECTION2_STUDY_STORIES,
  SECTION2_STUDY_VARIANTS,
  getStudyPlaybackLabel,
} from './studyData';

describe('section2 UI study data', () => {
  it('provides five complete, uniquely keyed stories', () => {
    expect(SECTION2_STUDY_STORIES).toHaveLength(5);
    expect(new Set(SECTION2_STUDY_STORIES.map((story) => story.id)).size).toBe(5);

    for (const story of SECTION2_STUDY_STORIES) {
      expect(story).toEqual(expect.objectContaining({
        title: expect.any(String),
        audioTitle: expect.any(String),
        category: expect.any(String),
        location: expect.any(String),
        duration: expect.stringMatching(/^\d{1,2}:\d{2}$/),
        imageSrc: expect.stringMatching(/^\/images\//),
      }));
    }
  });

  it('defines exactly the four approved variants in order', () => {
    expect(SECTION2_STUDY_VARIANTS.map((variant) => variant.id)).toEqual([
      'compact-poster',
      'overlay-info',
      'editorial-caption',
      'landscape-card',
    ]);
  });

  it('derives local play labels without audio state', () => {
    expect(getStudyPlaybackLabel(null, 'story-1')).toBe('재생');
    expect(getStudyPlaybackLabel('story-1', 'story-1')).toBe('재생 중');
    expect(getStudyPlaybackLabel('story-2', 'story-1')).toBe('재생');
  });
});
