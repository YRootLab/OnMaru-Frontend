// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '../hooks/useMapStore';
import ViewportOverlays from './ViewportOverlays';

afterEach(() => {
  cleanup();
  useMapStore.setState(useMapStore.getInitialState(), true);
});

describe('ViewportOverlays', () => {
  it('shows region name and a gently larger count badge for denser clusters', () => {
    const contents: HTMLElement[] = [];
    const previousKakao = window.kakao;
    window.kakao = { maps: {
      LatLng: class { constructor(public lat: number, public lng: number) {} },
      CustomOverlay: class {
        constructor({ content }: { content: HTMLElement }) { contents.push(content); }
        setMap = vi.fn();
      },
    } } as typeof window.kakao;
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      map: { getLevel: () => 7 },
      mode: 'info',
      infoCategory: 'hanok',
      viewportRenderMode: 'CLUSTER',
      viewportItems: [
        { type: 'CLUSTER', name: '청주', count: 7, center: { lat: 36.6, lng: 127.4 } },
        { type: 'CLUSTER', name: '대전', count: 80, center: { lat: 36.3, lng: 127.3 } },
        { type: 'PLACE', placeId: 'singleton', name: '단독 장소', center: { lat: 36.4, lng: 127.5 } },
      ],
    }, true);

    try {
      render(<ViewportOverlays />);
      expect(contents).toHaveLength(3);
      expect(contents[0].textContent).toBe('청주7');
      expect(contents[0].querySelector('svg')).toBeNull();
      expect(contents[0].getAttribute('aria-label')).toContain('청주 7곳');
      expect(Number.parseInt(contents[1].style.getPropertyValue('--aggregate-badge-size'), 10))
        .toBeGreaterThan(Number.parseInt(contents[0].style.getPropertyValue('--aggregate-badge-size'), 10));
      expect(contents[2].textContent).toBe('단독 장소1');
      expect(contents[2].querySelector('svg')).toBeNull();
    } finally {
      window.kakao = previousKakao;
    }
  });

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
