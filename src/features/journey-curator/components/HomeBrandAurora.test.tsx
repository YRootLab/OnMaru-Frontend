// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HomeBrandAurora from './HomeBrandAurora';

afterEach(cleanup);

describe('HomeBrandAurora', () => {
  it('renders two decorative, non-interactive color layers', () => {
    render(<HomeBrandAurora />);

    const aurora = screen.getByTestId('home-brand-aurora');
    expect(aurora.getAttribute('aria-hidden')).toBe('true');
    expect(aurora.querySelectorAll('[data-aurora-layer]')).toHaveLength(2);
  });

  it('uses transparent masking and disables movement for reduced motion', () => {
    render(<HomeBrandAurora />);

    const css = document.head.textContent ?? '';
    expect(css).toContain('mask-image');
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toContain('animation:none');
  });
});
