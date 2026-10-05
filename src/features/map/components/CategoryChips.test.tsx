// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '../hooks/useMapStore';
import CategoryChips from './CategoryChips';

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

describe('CategoryChips information mode', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      mode: 'info',
      category: null,
      infoCategory: 'hanok',
    }, true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('keeps 한옥 selected when the active information category is clicked again', () => {
    render(<CategoryChips />);

    fireEvent.click(screen.getByRole('button', { name: '한옥' }));

    expect(useMapStore.getState().infoCategory).toBe('hanok');
    expect(useMapStore.getState().category).toBeNull();
    expect(useMapStore.getState().searchQuery).toBe('한옥');
  });

  it('does not expose an unsupported 전체 information category', () => {
    render(<CategoryChips />);

    expect(screen.queryByRole('button', { name: '전체' })).toBeNull();
    expect(useMapStore.getState().infoCategory).toBe('hanok');
  });
});
