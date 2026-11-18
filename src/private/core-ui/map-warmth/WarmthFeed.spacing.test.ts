import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('./WarmthFeed.styles.ts', import.meta.url), 'utf8');

describe('WarmthFeed terminal spacing', () => {
  it('gives FeedScroll a bottom gutter for content clearance', () => {
    const feedScroll = styles.split('export const FeedScroll')[1].split('export const EmptyState')[0];

    expect(feedScroll).toContain('padding: 8px 16px 40px');
  });

  it('gives PaginationWrapper a generous bottom gap', () => {
    const pagination = styles.split('export const PaginationWrapper')[1].split('export const PageNavBtn')[0];

    expect(pagination).toContain('padding: 16px 0 24px');
  });
});
