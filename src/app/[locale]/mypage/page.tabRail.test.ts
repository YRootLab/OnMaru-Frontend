import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

describe('MyPage tab rail', () => {
  it('uses a horizontally scrollable tab container with hidden scrollbar', () => {
    const tabRail = source.split('const TabContainer')[1].split('const TabButton')[0];

    expect(tabRail).toContain('overflow-x: auto');
    expect(tabRail).toContain('scrollbar-width: none');
  });
});
