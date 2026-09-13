import { describe, expect, it } from 'vitest';
import { SORIMARU_SECTION_CONTENT_CLASS } from './sorimaruSectionLayout';

describe('SORIMARU_SECTION_CONTENT_CLASS', () => {
  it('keeps Sorimaru sections on the shared maximum width', () => {
    expect(SORIMARU_SECTION_CONTENT_CLASS).toBe('mx-auto w-full max-w-6xl');
  });
});
