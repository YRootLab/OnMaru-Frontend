import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

describe('MyPage tab rail', () => {
  it('supports horizontal mouse dragging and avoids an oversized page-top gutter', () => {
    const tabRail = source.split('const TabContainer')[1].split('const TabButton')[0];
    const pageContainer = source.split('const PageContainer')[1].split('const PageHeader')[0];

    expect(tabRail).toContain('touch-action: pan-x');
    expect(source).toContain('onPointerDown={handleTabPointerDown}');
    expect(pageContainer).not.toContain('padding-top: 104px');
    expect(pageContainer).not.toContain('padding-top: 84px');
  });
});
