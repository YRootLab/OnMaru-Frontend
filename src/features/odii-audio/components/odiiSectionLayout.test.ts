import { describe, expect, it } from 'vitest';
import { ODII_SECTION_CONTENT_CLASS } from './odiiSectionLayout';

describe('ODII_SECTION_CONTENT_CLASS', () => {
  it('keeps Odii sections on the shared maximum width', () => {
    expect(ODII_SECTION_CONTENT_CLASS).toBe('mx-auto w-full max-w-6xl');
  });
});
