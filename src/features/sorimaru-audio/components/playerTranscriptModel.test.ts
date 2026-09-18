import { describe, expect, it } from 'vitest';
import { normalizeContentTags, shouldFollowTranscript } from './playerTranscriptModel';

describe('Odii player transcript presentation model', () => {
  it('keeps at most seven unique, trimmed content tags in their original order', () => {
    expect(normalizeContentTags([
      ' 한옥 ',
      '골목',
      '한옥',
      '',
      undefined,
      '문화',
      '역사',
      '마을',
      '산책',
      '도슨트',
    ])).toEqual(['한옥', '골목', '문화', '역사', '마을', '산책', '도슨트']);
  });

  it('does not recenter an advancing line while the visitor is scrolling', () => {
    expect(shouldFollowTranscript({
      isUserScrolling: true,
      activeLineChanged: true,
      requestedSeek: false,
    })).toBe(false);
  });

  it('recenters an explicitly requested seek even while the visitor was scrolling', () => {
    expect(shouldFollowTranscript({
      isUserScrolling: true,
      activeLineChanged: false,
      requestedSeek: true,
    })).toBe(true);
  });
});
