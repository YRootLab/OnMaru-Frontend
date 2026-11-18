import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./PlaceDetail.tsx', import.meta.url), 'utf8');

describe('PlaceDetail header actions', () => {
  it('places the bookmark toggle and close button in the header action group', () => {
    const headerActions = source.split('<HeaderActionGroup>')[1].split('</HeaderActionGroup>')[0];

    expect(headerActions).toContain('handleToggleBookmark');
    expect(headerActions).toContain('setDetailId(null)');
  });
});
