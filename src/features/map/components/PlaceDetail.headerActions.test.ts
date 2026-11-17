import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./PlaceDetail.tsx', import.meta.url), 'utf8');

describe('PlaceDetail header actions', () => {
  it('keeps the save action in the persistent bottom bar instead of duplicating it in the header', () => {
    const headerActions = source.split('<HeaderActionGroup>')[1].split('</HeaderActionGroup>')[0];

    expect(headerActions).not.toContain('handleToggleBookmark');
    expect(headerActions).toContain('setDetailId(null)');
  });
});
