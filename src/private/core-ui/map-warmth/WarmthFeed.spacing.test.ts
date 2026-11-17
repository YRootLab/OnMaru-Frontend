import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('./WarmthFeed.styles.ts', import.meta.url), 'utf8');
const listPanel = readFileSync(new URL('../../../features/map/components/ListPanel.tsx', import.meta.url), 'utf8');

describe('WarmthFeed terminal spacing', () => {
  it('does not add a second bottom gutter after the list panel reserves space for its fade', () => {
    const feedScroll = styles.split('export const FeedScroll')[1].split('export const EmptyState')[0];

    expect(feedScroll).not.toContain('padding: 8px 16px 40px');
  });

  it('uses a compact terminal gap without the information-list fade in warmth mode', () => {
    const pagination = styles.split('export const PaginationWrapper')[1].split('export const PageNavBtn')[0];

    expect(pagination).toContain('padding: 16px 0 8px');
    expect(listPanel).toContain("$mode === 'warmth' ? '8px' : '60px'");
    expect(listPanel).toContain('$visible={mode !== \'warmth\'}');
  });
});
