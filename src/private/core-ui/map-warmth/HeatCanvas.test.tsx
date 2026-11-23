// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { HeatSpot } from '@/features/map/types';
import HeatCanvas, { computePointerProximity } from './HeatCanvas';

let mockReducedMotion = false;

vi.mock('@/design-system/ThemeProvider', () => ({
  useOnmaruTheme: () => ({ mode: 'light' }),
}));

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockReducedMotion,
}));

const SAMPLE_SPOTS: HeatSpot[] = [
  {
    id: 'spot-1',
    placeId: 'place-1',
    name: '북촌 한옥마을',
    lat: 37.5826,
    lng: 126.983,
    district: '서울 종로구',
    visitorCount: 4200,
    congestionScore: 86,
    congestionLevel: 'surge',
    surgeMultiplier: 1.8,
    intensity: 0.9,
  },
];

function createMockCanvasContext() {
  const grad = { addColorStop: vi.fn() };
  return {
    createLinearGradient: vi.fn(() => grad),
    createRadialGradient: vi.fn(() => grad),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(Math.max(4, w * h * 4)),
    })),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    lineJoin: 'round',
    filter: 'none',
  };
}

describe('HeatCanvas interactive circular heatmap', () => {
  let mapNode: HTMLDivElement;
  let capturedHolder: HTMLElement | null = null;
  let addListenerMock: ReturnType<typeof vi.fn>;
  let removeListenerMock: ReturnType<typeof vi.fn>;
  let overlaySetMapMock: ReturnType<typeof vi.fn>;
  let rafQueue: FrameRequestCallback[];
  let nextRafId: number;
  let cancelRafSpy: ReturnType<typeof vi.fn>;
  let ctxByCanvas: WeakMap<HTMLCanvasElement, ReturnType<typeof createMockCanvasContext>>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    mockReducedMotion = false;
    capturedHolder = null;
    rafQueue = [];
    nextRafId = 1;
    ctxByCanvas = new WeakMap();

    mapNode = document.createElement('div');
    Object.defineProperty(mapNode, 'clientWidth', { value: 600, configurable: true });
    Object.defineProperty(mapNode, 'clientHeight', { value: 400, configurable: true });
    document.body.appendChild(mapNode);

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      let ctx = ctxByCanvas.get(this);
      if (!ctx) {
        ctx = createMockCanvasContext();
        ctxByCanvas.set(this, ctx);
      }
      return ctx as unknown as CanvasRenderingContext2D;
    });

    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return nextRafId++;
    });

    cancelRafSpy = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelRafSpy);

    originalFetch = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ features: [] }),
      }),
    );

    addListenerMock = vi.fn();
    removeListenerMock = vi.fn();
    overlaySetMapMock = vi.fn();

    class MockLatLng {
      constructor(
        private lat: number,
        private lng: number,
      ) {}
      getLat() {
        return this.lat;
      }
      getLng() {
        return this.lng;
      }
    }

    class MockCustomOverlay {
      constructor(opts: { content: HTMLElement }) {
        capturedHolder = opts.content;
      }
      setMap = overlaySetMapMock;
      setPosition = vi.fn();
    }

    (window as unknown as { kakao: unknown }).kakao = {
      maps: {
        LatLng: MockLatLng,
        CustomOverlay: MockCustomOverlay,
        event: {
          addListener: addListenerMock,
          removeListener: removeListenerMock,
        },
      },
    };

    const mockMap = {
      getCenter: () => new MockLatLng(37.5826, 126.983),
      getNode: () => mapNode,
      getProjection: () => ({
        pointFromCoords: (ll: MockLatLng) => ({
          x: 300 + (ll.getLng() - 126.983) * 10000,
          y: 200 - (ll.getLat() - 37.5826) * 10000,
        }),
      }),
    };

    useMapStore.setState({
      map: mockMap,
      mode: 'warmth',
      warmthViewType: 'heatmap',
      level: 6,
      selectedHeatSpot: null,
      hoveredId: null,
    });
  });

  afterEach(() => {
    cleanup();
    mapNode.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
  });

  it('computes smooth pointer proximity decay within influence radius', () => {
    const centerHit = computePointerProximity(100, 100, 100, 100, 80);
    const midHit = computePointerProximity(145, 100, 100, 100, 80);
    const farHit = computePointerProximity(300, 300, 100, 100, 80);

    expect(centerHit.proximity).toBe(1);
    expect(midHit.proximity).toBeGreaterThan(0);
    expect(midHit.proximity).toBeLessThan(1);
    expect(farHit.proximity).toBe(0);
  });

  it('activates the interactive FX canvas loop in heatmap mode and draws frames', () => {
    const { unmount } = render(<HeatCanvas spots={SAMPLE_SPOTS} />);

    const baseCanvas = capturedHolder?.querySelector('.om-heat-canvas') as HTMLCanvasElement | null;
    const fxCanvas = capturedHolder?.querySelector('.om-heat-fx-canvas') as HTMLCanvasElement | null;

    expect(baseCanvas).toBeTruthy();
    expect(fxCanvas).toBeTruthy();
    expect(baseCanvas?.style.opacity).toBe('0.74');
    expect(fxCanvas?.style.display).toBe('block');
    expect(fxCanvas?.style.opacity).toBe('1');
    expect(rafQueue.length).toBeGreaterThan(0);

    // Run one FX animation frame and verify drawing occurred on fxCanvas
    const frameCb = rafQueue.shift();
    frameCb?.(1000);

    const fxCtx = fxCanvas ? ctxByCanvas.get(fxCanvas) : null;
    expect(fxCtx?.clearRect).toHaveBeenCalled();
    expect(fxCtx?.createRadialGradient).toHaveBeenCalled();
    expect(fxCtx?.stroke).toHaveBeenCalled();

    unmount();

    expect(cancelRafSpy).toHaveBeenCalled();
    expect(removeListenerMock).toHaveBeenCalledWith(expect.anything(), 'idle', expect.any(Function));
    expect(removeListenerMock).toHaveBeenCalledWith(expect.anything(), 'dragstart', expect.any(Function));
    expect(removeListenerMock).toHaveBeenCalledWith(expect.anything(), 'zoom_start', expect.any(Function));
    expect(overlaySetMapMock).toHaveBeenCalledWith(null);
  });

  it('disables the FX canvas loop when prefers-reduced-motion is enabled', () => {
    mockReducedMotion = true;

    render(<HeatCanvas spots={SAMPLE_SPOTS} />);

    const baseCanvas = capturedHolder?.querySelector('.om-heat-canvas') as HTMLCanvasElement | null;
    const fxCanvas = capturedHolder?.querySelector('.om-heat-fx-canvas') as HTMLCanvasElement | null;

    expect(baseCanvas?.style.opacity).toBe('1');
    expect(fxCanvas?.style.display).toBe('none');
    expect(rafQueue.length).toBe(0);
  });

  it('keeps the FX canvas hidden in district mode', () => {
    useMapStore.setState({ warmthViewType: 'district' });

    render(<HeatCanvas spots={SAMPLE_SPOTS} />);

    const baseCanvas = capturedHolder?.querySelector('.om-heat-canvas') as HTMLCanvasElement | null;
    const fxCanvas = capturedHolder?.querySelector('.om-heat-fx-canvas') as HTMLCanvasElement | null;

    expect(baseCanvas?.style.opacity).toBe('1');
    expect(fxCanvas?.style.display).toBe('none');
    expect(rafQueue.length).toBe(0);
  });
});
