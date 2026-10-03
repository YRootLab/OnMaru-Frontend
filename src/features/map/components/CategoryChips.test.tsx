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
      infoCategory: 'all',
    }, true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('selecting 한옥 updates infoCategory without changing the legacy category', () => {
    render(<CategoryChips />);

    fireEvent.click(screen.getByRole('button', { name: '한옥' }));

    expect(useMapStore.getState().infoCategory).toBe('hanok');
    expect(useMapStore.getState().category).toBeNull();
    expect(useMapStore.getState().searchQuery).toBe('한옥');
  });

  it('selecting 전체 resets the server category to ALL', () => {
    useMapStore.setState({ infoCategory: 'hanok' });
    render(<CategoryChips />);

    fireEvent.click(screen.getByRole('button', { name: '전체' }));

    expect(useMapStore.getState().infoCategory).toBe('all');
  });
});
