// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { CursorPagination } from './Pagination';

afterEach(cleanup);

describe('CursorPagination total count', () => {
  it('shows the filtered total, current range, and total page progress', () => {
    render(
      <CursorPagination
        currentPage={2}
        totalPages={7}
        totalCount={128}
        rangeStart={21}
        rangeEnd={40}
        hasNext
        hasPrev
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );

    expect(screen.getByText('전체 128건')).toBeTruthy();
    expect(screen.getByText('21–40건 표시')).toBeTruthy();
    expect(screen.getByText('2 / 7 페이지')).toBeTruthy();
  });

  it('keeps count visible for a single-page result', () => {
    render(
      <CursorPagination
        currentPage={1}
        totalPages={1}
        totalCount={3}
        rangeStart={1}
        rangeEnd={3}
        hasNext={false}
        hasPrev={false}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );

    expect(screen.getByText('전체 3건')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps opaque cursor navigation wired to previous and next actions', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <CursorPagination
        currentPage={2}
        totalPages={3}
        totalCount={41}
        rangeStart={21}
        rangeEnd={40}
        hasNext
        hasPrev
        onNext={onNext}
        onPrev={onPrev}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '이전 페이지' }));
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(onPrev).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });
});
