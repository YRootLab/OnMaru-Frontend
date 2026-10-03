// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminCursorPagination } from './useAdminCursorPagination';
import type { CursorPageResponse, ApiError } from '@/features/admin/types';

describe('useAdminCursorPagination hook tests (#262 / BE #509)', () => {
  it('requests first page with cursor undefined and limit, and tracks hasNext correctly', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      items: [{ id: '1', name: 'Item 1' }],
      totalCount: 41,
      nextCursor: 'cursor_2',
      hasNext: true,
    } as CursorPageResponse<{ id: string; name: string }>);

    const { result } = renderHook(() =>
      useAdminCursorPagination({
        fetchFn,
        limit: 20,
      })
    );

    // Initial render initiates fetch
    await act(async () => {});

    expect(fetchFn).toHaveBeenCalledWith({ limit: 20 });
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.totalCount).toBe(41);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.rangeStart).toBe(1);
    expect(result.current.rangeEnd).toBe(1);
    expect(result.current.items).toEqual([{ id: '1', name: 'Item 1' }]);
  });

  it('navigates to next page with nextCursor and back to previous page', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({
        items: [{ id: '1' }],
        totalCount: 41,
        nextCursor: 'cursor_page_2',
        hasNext: true,
      })
      .mockResolvedValueOnce({
        items: [{ id: '2' }],
        totalCount: 41,
        nextCursor: 'cursor_page_3',
        hasNext: true,
      })
      .mockResolvedValueOnce({
        items: [{ id: '1' }],
        totalCount: 41,
        nextCursor: 'cursor_page_2',
        hasNext: true,
      });

    const { result } = renderHook(() =>
      useAdminCursorPagination({
        fetchFn,
        limit: 20,
      })
    );

    await act(async () => {});
    expect(result.current.pageNumber).toBe(1);

    // Go to next page
    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(fetchFn).toHaveBeenLastCalledWith({ limit: 20, cursor: 'cursor_page_2' });
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.totalCount).toBe(41);
    expect(result.current.rangeStart).toBe(21);
    expect(result.current.rangeEnd).toBe(21);
    expect(result.current.hasPrev).toBe(true);

    // Go to previous page
    await act(async () => {
      await result.current.goToPrevPage();
    });

    expect(fetchFn).toHaveBeenLastCalledWith({ limit: 20 });
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.hasPrev).toBe(false);
  });

  it('discards prior cursors and resets to page 1 when filter changes', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ items: [{ id: '10' }], totalCount: 25, nextCursor: 'cursor_next', hasNext: true })
      .mockResolvedValueOnce({ items: [{ id: '20' }], totalCount: 25, nextCursor: null, hasNext: false })
      .mockResolvedValueOnce({ items: [{ id: '30' }], totalCount: 1, nextCursor: null, hasNext: false });

    let currentFilter = { status: 'PUBLISHED' };
    const { result, rerender } = renderHook(() =>
      useAdminCursorPagination({
        fetchFn,
        filters: currentFilter,
        limit: 20,
      })
    );

    await act(async () => {});
    expect(fetchFn).toHaveBeenCalledWith({ status: 'PUBLISHED', limit: 20 });

    // Navigate to page 2
    await act(async () => {
      await result.current.goToNextPage();
    });
    expect(result.current.pageNumber).toBe(2);

    // Filter changes to HIDDEN
    currentFilter = { status: 'HIDDEN' };
    rerender();
    await act(async () => {});

    // Must reset to page 1 with no cursor
    expect(fetchFn).toHaveBeenLastCalledWith({ status: 'HIDDEN', limit: 20 });
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it('ignores stale late responses from earlier requests (race condition protection)', async () => {
    let resolveFirst: (val: any) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    let resolveSecond: (val: any) => void;
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    const fetchFn = vi.fn()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

    let currentFilter = { query: 'first' };
    const { result, rerender } = renderHook(() =>
      useAdminCursorPagination({
        fetchFn,
        filters: currentFilter,
      })
    );

    // First request is pending...
    // User quickly updates filter before first resolves
    currentFilter = { query: 'second' };
    rerender();

    // Now resolve second request FIRST
    await act(async () => {
      resolveSecond({
        items: [{ id: 'second_result' }],
        hasNext: false,
        nextCursor: null,
      });
    });

    expect(result.current.items).toEqual([{ id: 'second_result' }]);

    // Now first (stale) request resolves LATER
    await act(async () => {
      resolveFirst({
        items: [{ id: 'stale_first_result' }],
        hasNext: true,
        nextCursor: 'stale_cursor',
      });
    });

    // Stale result MUST NOT overwrite the current state!
    expect(result.current.items).toEqual([{ id: 'second_result' }]);
  });

  it('recovers from 400 VALIDATION_ERROR (expired/invalid cursor) by refetching page 1', async () => {
    const error400: ApiError = {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Cursor is invalid or expired',
    };

    const fetchFn = vi.fn()
      .mockResolvedValueOnce({
        items: [{ id: '1' }],
        nextCursor: 'expired_cursor',
        hasNext: true,
      })
      // When page 2 is called with expired_cursor, it fails with 400
      .mockRejectedValueOnce(error400)
      // Automatic recovery fetch of page 1 succeeds
      .mockResolvedValueOnce({
        items: [{ id: 'fresh_page_1' }],
        nextCursor: 'fresh_cursor_2',
        hasNext: true,
      });

    const { result } = renderHook(() =>
      useAdminCursorPagination({
        fetchFn,
        limit: 20,
      })
    );

    await act(async () => {});
    expect(result.current.pageNumber).toBe(1);

    // Try going to next page (with expired_cursor)
    await act(async () => {
      await result.current.goToNextPage();
    });

    // Should detect cursor error and recover by refetching page 1 without cursor
    expect(fetchFn).toHaveBeenLastCalledWith({ limit: 20 });
    expect(result.current.items).toEqual([{ id: 'fresh_page_1' }]);
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.hasPrev).toBe(false);
  });

  it('stops pagination when hasNext is false even if item count equals limit', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      // 20 items exactly (equals limit), but hasNext: false
      items: Array.from({ length: 20 }, (_, i) => ({ id: `item_${i}` })),
      nextCursor: null,
      hasNext: false,
    });

    const { result } = renderHook(() =>
      useAdminCursorPagination({
        fetchFn,
        limit: 20,
      })
    );

    await act(async () => {});

    expect(result.current.items.length).toBe(20);
    expect(result.current.hasNext).toBe(false);

    // Attempting to call goToNextPage must do nothing
    await act(async () => {
      await result.current.goToNextPage();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
