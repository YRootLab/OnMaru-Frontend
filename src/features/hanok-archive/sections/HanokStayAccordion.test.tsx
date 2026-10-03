// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STAY_TYPE } from '@/features/hanok-archive/types';
import type { Village } from '@/features/hanok-archive/types';
import HanokStayAccordion from './HanokStayAccordion';

const stays: Village[] = Array.from({ length: 15 }, (_, index) => ({
  id: `stay-${index + 1}`,
  name: `한옥 스테이 ${index + 1}`,
  region: index < 10 ? '서울' : '경기',
  addr: index < 10 ? '서울특별시 종로구' : '경기도 수원시',
  lat: 37.5,
  lng: 127,
  type: STAY_TYPE,
  badges: [],
  image: '',
  hasImage: false,
  summary: '',
  overview: '',
}));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(cleanup);

describe('HanokStayAccordion pagination', () => {
  it('keeps the booking action vertically compact beside the detail action', () => {
    render(<HanokStayAccordion villages={stays} />);

    const booking = screen.getByRole('link', { name: /예약 정보 확인하기/ });

    expect(getComputedStyle(booking).paddingTop).toBe('8px');
    expect(getComputedStyle(booking).paddingBottom).toBe('8px');
  });

  it('places the total beside the filters and exposes bounded page navigation', () => {
    render(<HanokStayAccordion villages={stays} />);

    expect(screen.getByText('전국 15곳')).toBeTruthy();
    expect(screen.getByText('1 / 3')).toBeTruthy();

    const previous = screen.getByRole('button', { name: '이전 스테이 페이지' });
    const next = screen.getByRole('button', { name: '다음 스테이 페이지' });
    const controls = screen.getByTestId('stay-pagination-controls');

    expect(previous.getAttribute('disabled')).not.toBeNull();
    expect(next.getAttribute('disabled')).toBeNull();
    expect(controls.contains(previous)).toBe(true);
    expect(controls.contains(screen.getByTestId('stay-page-counter'))).toBe(true);
    expect(controls.contains(next)).toBe(true);
    expect(getComputedStyle(controls).display).toBe('flex');
    expect(getComputedStyle(previous).position).toBe('static');
    expect(getComputedStyle(next).boxShadow).toBe('0 3px 10px rgba(15, 23, 42, 0.08)');
    expect(screen.getByRole('heading', { name: '지역별 한옥 스테이' }).parentElement?.textContent)
      .not.toContain('15곳');
  });

  it('moves by page and resets the page when the selected region changes', async () => {
    render(<HanokStayAccordion villages={stays} />);

    fireEvent.click(screen.getByRole('button', { name: '다음 스테이 페이지' }));
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: '서울 10곳' }));
    await waitFor(() => {
      expect(screen.getByText('서울 10곳')).toBeTruthy();
      expect(screen.getByText('1 / 2')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '전체 15곳' }));
    await waitFor(() => {
      expect(screen.getByText('전국 15곳')).toBeTruthy();
      expect(screen.getByText('1 / 3')).toBeTruthy();
    });
  });
});
