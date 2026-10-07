// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import WarmthLayer from './WarmthLayer';

vi.mock('@/design-system/ThemeProvider', () => ({
  useOnmaruTheme: () => ({ mode: 'light' }),
}));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));
vi.mock('./HeatCanvas', () => ({
  default: () => <div data-testid="warmth-canvas" />,
}));

afterEach(cleanup);

describe('warmth map layers', () => {
  it('keeps the visited district fill visible in district mode', () => {
    useMapStore.setState({ mode: 'warmth', warmthViewType: 'district', map: null });

    render(<WarmthLayer />);

    expect(screen.getByTestId('warmth-canvas')).toBeTruthy();
  });

  it('keeps the circular heatmap canvas in heatmap mode', () => {
    useMapStore.setState({ mode: 'warmth', warmthViewType: 'heatmap', map: null });

    render(<WarmthLayer />);

    expect(screen.getByTestId('warmth-canvas')).toBeTruthy();
  });

  it('does not mount the warmth canvas in info mode', () => {
    useMapStore.setState({ mode: 'info', warmthViewType: 'district', map: null });

    render(<WarmthLayer />);

    expect(screen.queryByTestId('warmth-canvas')).toBeNull();
  });
});
