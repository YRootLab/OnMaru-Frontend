import { describe, expect, it } from 'vitest';
import { resolveTimeAwareSystemMode } from './timeTheme';

describe('resolveTimeAwareSystemMode', () => {
  it('uses light mode during local daytime even when OS prefers dark', () => {
    expect(resolveTimeAwareSystemMode({ hour: 8, prefersDark: true })).toBe('light');
  });

  it('uses dark mode late at night', () => {
    expect(resolveTimeAwareSystemMode({ hour: 23, prefersDark: false })).toBe('dark');
  });
});
