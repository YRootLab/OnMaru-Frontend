// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useInfoListScrollRestoration } from './useInfoListScrollRestoration';

function Harness({ surface }: { surface: 'desktop' | 'mobile' }) {
  const binding = useInfoListScrollRestoration(surface);
  return <div data-testid="scroller" {...binding} />;
}

describe('useInfoListScrollRestoration', () => {
  beforeEach(() => {
    useMapStore.setState(useMapStore.getInitialState(), true);
  });

  afterEach(cleanup);

  it('records the active list surface scroll offset', () => {
    render(<Harness surface="desktop" />);
    const scroller = screen.getByTestId('scroller');
    Object.defineProperty(scroller, 'scrollTop', { value: 325, writable: true });

    fireEvent.scroll(scroller);

    expect(useMapStore.getState().infoListScrollTops.desktop).toBe(325);
  });

  it('applies each restore request once to its matching surface', () => {
    const view = render(<Harness surface="mobile" />);
    const scroller = screen.getByTestId('scroller');
    Object.defineProperty(scroller, 'scrollTop', { value: 0, writable: true });

    useMapStore.setState({
      infoListRestoreRequest: {
        id: 7,
        scrollTops: { desktop: 400, mobile: 175 },
      },
    });
    view.rerender(<Harness surface="mobile" />);

    expect(scroller.scrollTop).toBe(175);
  });
});
