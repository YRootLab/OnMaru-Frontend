import { describe, expect, it } from 'vitest';
import {
  HOME_HERO_PLACEHOLDER,
  HOME_HERO_TITLE,
  POPULAR_SOUND_CARD_MIN_WIDTH,
  POPULAR_SOUND_DESKTOP_COLUMNS,
  POPULAR_SOUND_TABLET_COLUMNS,
} from './homePresentationContracts';

describe('home presentation contracts', () => {
  it('keeps the hero copy focused on the journey instead of repeating the profile name', () => {
    expect(HOME_HERO_TITLE).toBe('어떤 장소로 떠나고 싶으세요?');
    expect(HOME_HERO_PLACEHOLDER).toBe('가고 싶은 지역이나 분위기를 알려주세요');
  });

  it('allows sound columns and cards to shrink within the shared feed width', () => {
    expect(POPULAR_SOUND_DESKTOP_COLUMNS).toBe('repeat(3, minmax(0, 1fr))');
    expect(POPULAR_SOUND_TABLET_COLUMNS).toBe('repeat(2, minmax(0, 1fr))');
    expect(POPULAR_SOUND_CARD_MIN_WIDTH).toBe('0');
  });
});
