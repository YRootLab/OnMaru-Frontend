// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import SectionHeading from './SectionHeading';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

describe('SectionHeading', () => {
  it('renders the main title before its subtitle and action', () => {
    render(
      <SectionHeading
        id="places-heading"
        title="이번 주 추천 코스"
        subtitle="정취와 소리가 머무는 장소를 둘러보세요."
        actionLabel="전체 보기"
        actionHref="/map"
      />,
    );

    const heading = screen.getByRole('heading', { level: 2, name: '이번 주 추천 코스' });
    const subtitle = screen.getByText('정취와 소리가 머무는 장소를 둘러보세요.');
    const action = screen.getByRole('link', { name: '전체 보기' });

    expect(heading.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(heading.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(action.getAttribute('href')).toBe('/map');
    expect(heading.closest('[data-section-heading="true"]')).not.toBeNull();
  });

  it('uses the Sorimaru title scale and theme-specific text gradients', () => {
    const { rerender } = render(<SectionHeading title="소리로 만나는 한국" />);
    const heading = screen.getByRole('heading', { level: 2, name: '소리로 만나는 한국' });
    const lightStyle = getComputedStyle(heading);

    expect(lightStyle.getPropertyValue('--section-heading-size')).toBe('clamp(24px,3.2vw,36px)');
    expect(lightStyle.fontWeight).toBe('700');
    expect(lightStyle.backgroundImage).toContain('linear-gradient');
    expect(lightStyle.color).toBe('rgba(0, 0, 0, 0)');

    const lightGradient = lightStyle.backgroundImage;
    document.documentElement.dataset.theme = 'dark';
    rerender(<SectionHeading title="소리로 만나는 한국" />);

    expect(getComputedStyle(heading).backgroundImage).not.toBe(lightGradient);
  });

  it('supports a level-three heading without changing the visual hierarchy', () => {
    render(<SectionHeading headingLevel={3} title="장면을 따라 걷는 소리" />);

    expect(
      screen.getByRole('heading', { level: 3, name: '장면을 따라 걷는 소리' }),
    ).toBeTruthy();
  });
});
