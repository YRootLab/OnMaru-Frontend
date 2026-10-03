// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NearbyLocationDescription } from './NearbyLocationDescription';

afterEach(cleanup);

describe('NearbyLocationDescription', () => {
  it('emphasizes only the nearby radius and national curation in the fallback message', () => {
    render(
      <NearbyLocationDescription message="반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드릴게요." />,
    );

    expect(screen.getByText('반경 3km').getAttribute('data-emphasis')).toBe('nearby-radius');
    expect(screen.getByText('전국 큐레이션').getAttribute('data-emphasis')).toBe('national-curation');
    expect(document.querySelector('[data-tone="neutral"]')?.textContent).toBe(
      '반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드릴게요.',
    );
  });

  it('renders other location messages without fallback emphasis', () => {
    render(
      <NearbyLocationDescription message="현재 위치를 확인하고 주변 이야기를 찾는 중이에요." />,
    );

    expect(screen.queryByText('반경 3km')).toBeNull();
    expect(screen.getByText('현재 위치를 확인하고 주변 이야기를 찾는 중이에요.')).toBeTruthy();
    expect(document.querySelector('[data-emphasis]')).toBeNull();
  });
});
