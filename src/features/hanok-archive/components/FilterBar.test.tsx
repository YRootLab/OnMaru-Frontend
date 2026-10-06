// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FilterBar from './FilterBar';

vi.mock('framer-motion', () => ({
  motion: { div: 'div' },
}));

afterEach(cleanup);

describe('FilterBar region select', () => {
  it('keeps a compact width and reserves symmetric space around its chevron', () => {
    render(
      <FilterBar
        villages={[]}
        query=""
        region="전체"
        activeType="전체"
        activeBadges={[]}
        onQueryChange={vi.fn()}
        onRegionChange={vi.fn()}
        onTypeChange={vi.fn()}
        onBadgeToggle={vi.fn()}
      />,
    );

    const select = screen.getByRole('combobox', { name: '지역 선택' });
    const control = screen.getByTestId('region-select-control');
    const chevron = screen.getByTestId('region-select-chevron');

    expect(getComputedStyle(control).flexGrow).toBe('0');
    expect(getComputedStyle(control).width).toBe('max-content');
    expect(getComputedStyle(control).paddingLeft).toBe('16px');
    expect(getComputedStyle(control).paddingRight).toBe('16px');
    expect(getComputedStyle(control).columnGap).toBe('8px');
    expect(getComputedStyle(select).position).toBe('absolute');
    expect(chevron.getAttribute('aria-hidden')).toBe('true');
  });
});
