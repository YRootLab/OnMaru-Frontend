import { describe, expect, it } from 'vitest';
import { resolveConceptHeroStory } from './heroStoryModel';

const story = (stid: string, audioUrl: string) => ({ stid, audioUrl });

describe('concept hero story selection', () => {
  it('prefers the first API recommendation over an empty store placeholder', () => {
    const placeholder = story('empty', '');
    const recommended = story('recommended', '/audio/story.mp3');
    expect(resolveConceptHeroStory(placeholder, [], { 추천: [recommended] })).toBe(recommended);
  });

  it('keeps a playable current selection', () => {
    const current = story('selected', '/audio/selected.mp3');
    expect(resolveConceptHeroStory(current, [], {})).toBe(current);
  });
});
