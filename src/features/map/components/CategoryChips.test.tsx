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

  it('selecting 한옥 updates infoCategory without changing the legacy category', () => {
    useMapStore.setState({ infoCategory: 'stay' });
    render(<CategoryChips />);

    fireEvent.click(screen.getByRole('button', { name: '한옥' }));

    expect(useMapStore.getState().infoCategory).toBe('hanok');
    expect(useMapStore.getState().category).toBeNull();
    expect(useMapStore.getState().searchQuery).toBe('한옥');
  });

  it('does not render the information-wide 전체 chip', () => {
    render(<CategoryChips />);

    expect(screen.queryByRole('button', { name: '전체' })).toBeNull();
    expect(screen.getByRole('button', { name: '한옥' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the selected information category when its chip is clicked again', () => {
    useMapStore.setState({ listTotalCount: 12 });
    render(<CategoryChips />);

    fireEvent.click(screen.getByRole('button', { name: '한옥' }));

    expect(useMapStore.getState().infoCategory).toBe('hanok');
    expect(useMapStore.getState().listTotalCount).toBe(12);
  });

  it('captures the Hanok home before opening another information category', () => {
    useMapStore.setState({
      committedViewport: {
        center: { lat: 37.5, lng: 127 },
        level: 5,
        radius: 900,
      },
      infoListScrollTops: { desktop: 360, mobile: 120 },
    });
    render(<CategoryChips />);

    fireEvent.click(screen.getByRole('button', { name: '전통 시장' }));

    expect(useMapStore.getState().infoHomeSnapshot).toMatchObject({
      viewport: { center: { lat: 37.5, lng: 127 }, level: 5 },
      listScrollTops: { desktop: 360, mobile: 120 },
    });
  });

  it('keeps 전체 온기 in warmth mode', () => {
    useMapStore.setState({ mode: 'warmth' });
    render(<CategoryChips />);

    expect(screen.getByRole('button', { name: '전체 온기' })).toBeTruthy();
  });
});
