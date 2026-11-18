// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '../../../../messages/ko.json';
import { SorimaruPagination } from './SorimaruPagination';

afterEach(cleanup);

function renderPagination(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('SorimaruPagination', () => {
  it('shows a stable current and total page count without speculative page buttons', () => {
    renderPagination(
      <SorimaruPagination
        currentPage={1}
        totalPages={184}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('1 / 184')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '4' })).toBeNull();
  });

  it('moves only through the cursor-compatible previous and next controls', () => {
    const onPageChange = vi.fn();
    renderPagination(
      <SorimaruPagination
        currentPage={4}
        totalPages={184}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '이전 페이지' }));
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 5);
  });
});
