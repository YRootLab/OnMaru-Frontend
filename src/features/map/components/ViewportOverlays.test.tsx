// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useMapStore } from '../hooks/useMapStore';
import ViewportOverlays from './ViewportOverlays';

afterEach(() => {
  cleanup();
  useMapStore.setState(useMapStore.getInitialState(), true);
});

describe('ViewportOverlays', () => {
  it('explains that retained markers are updating while the viewport loads', () => {
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      mode: 'info',
      isViewportLoading: true,
      viewportError: null,
    }, true);

    render(<ViewportOverlays />);

    expect(screen.getByRole('status').textContent).toContain('지도 장소를 업데이트하고 있어요');
  });
});
