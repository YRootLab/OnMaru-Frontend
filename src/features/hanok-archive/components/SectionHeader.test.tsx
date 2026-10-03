// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import SectionHeader from './SectionHeader';

afterEach(cleanup);

describe('Hanok SectionHeader', () => {
  it('uses the shared title-first section heading presentation', () => {
    render(
      <SectionHeader
        id="map-heading"
        title="전국 한옥 지도"
        subtitle="전국의 한옥을 한눈에 살펴보세요."
        actionLabel="전체 지도 보기 ↗"
        actionHref="/map"
      />,
    );

    const heading = screen.getByRole('heading', { name: '전국 한옥 지도' });
    expect(heading.closest('[data-section-heading="true"]')).not.toBeNull();
    expect(screen.getByText('전국의 한옥을 한눈에 살펴보세요.')).toBeTruthy();
    expect(screen.getByRole('link', { name: '전체 지도 보기 ↗' }).getAttribute('href')).toBe('/map');
  });
});
