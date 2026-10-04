// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InfoPlaceItem } from '../types';
import { useMapStore } from '../hooks/useMapStore';

const { listInfoPlaces } = vi.hoisted(() => ({ listInfoPlaces: vi.fn() }));

vi.mock('../services/infoMap.service', () => ({ listInfoPlaces }));

vi.mock('./PlaceListItem', () => ({
  PlaceListItem: ({ item }: { item: { name: string } }) => <li>{item.name}</li>,
}));

vi.mock('./feed/LiveNoticeBanner', () => ({ default: () => <div>실시간 한옥 소식</div> }));
vi.mock('./feed/FestivalExhibitionCarousel', () => ({ default: () => <div>축제·기획전</div> }));
vi.mock('./feed/SorimaruSpotlightBanner', () => ({ default: () => <div>이번 주 소리마루</div> }));
vi.mock('./feed/SmartAroundFeed', () => ({ default: () => <div>추천 한옥 명소</div> }));

let observerCallback: IntersectionObserverCallback | null = null;

class IntersectionObserverStub {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {}
}

import InfoPlaceList from './InfoPlaceList';

const item: InfoPlaceItem = {
  placeId: 'canonical-1',
  name: '유지되는 한옥',
  category: 'HANOK',
  coordinates: { lat: 37.5, lng: 127 },
  region: { regionCode: '11', name: '서울' },
  thumbnailUrl: null,
  summary: '',
};

describe('InfoPlaceList', () => {
  beforeEach(() => {
    listInfoPlaces.mockReset();
    observerCallback = null;
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      infoCategory: 'hanok',
      listItems: [item],
      listTotalCount: 23_675,
      listNextCursor: null,
      listSnapshotId: 'snap-1',
      listError: null,
    }, true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the server totalCount instead of the loaded item count', () => {
    render(<InfoPlaceList />);

    expect(screen.getByText('한옥 23,675곳')).toBeTruthy();
    expect(screen.getByText('유지되는 한옥')).toBeTruthy();
  });

  it('restores the editorial discovery modules above the canonical list on initial ALL mode', () => {
    useMapStore.setState({ infoCategory: 'all' });

    render(<InfoPlaceList />);

    expect(screen.getByText('실시간 한옥 소식')).toBeTruthy();
    expect(screen.getByText('축제·기획전')).toBeTruthy();
    expect(screen.getByText('이번 주 소리마루')).toBeTruthy();
    expect(screen.getByText('추천 한옥 명소')).toBeTruthy();
    expect(screen.getByText('전체 23,675곳')).toBeTruthy();
    expect(screen.getByText('유지되는 한옥')).toBeTruthy();
  });

  it('keeps existing items visible when a later request fails', () => {
    useMapStore.setState({ listError: '목록 서비스 연결이 원활하지 않아요. 다시 시도해 주세요' });

    render(<InfoPlaceList />);

    expect(screen.getByText('유지되는 한옥')).toBeTruthy();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  });

  it('does not append a cursor response from an expired request scope', async () => {
    let resolvePage!: (value: ReturnType<typeof pageResponse>) => void;
    listInfoPlaces.mockReturnValue(new Promise((resolve) => { resolvePage = resolve; }));
    useMapStore.setState({ listNextCursor: 'cursor-1' });
    render(<InfoPlaceList />);

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    act(() => {
      useMapStore.getState().setInfoCategory('all');
      useMapStore.getState().setInfoCategory('hanok');
      useMapStore.getState().setListItems(
        [{ ...item, placeId: 'current-2', name: '현재 snapshot 장소' }],
        1,
        'cursor-current',
        'snap-2',
      );
    });

    await act(async () => {
      resolvePage(pageResponse());
      await Promise.resolve();
    });

    expect(useMapStore.getState().listItems.map((value) => value.placeId)).toEqual(['current-2']);
  });

  it('aborts an in-flight cursor request when the list unmounts', () => {
    listInfoPlaces.mockReturnValue(new Promise(() => {}));
    useMapStore.setState({ listNextCursor: 'cursor-1' });
    const view = render(<InfoPlaceList />);

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    const signal = listInfoPlaces.mock.calls[0][0].signal as AbortSignal;

    view.unmount();

    expect(signal.aborted).toBe(true);
  });

  it('limits automatic cursor snapshot recovery to one restart', async () => {
    listInfoPlaces.mockRejectedValue({
      status: 409,
      code: 'SNAPSHOT_EXPIRED',
      message: 'expired',
    });
    useMapStore.setState({ listNextCursor: 'cursor-1' });
    render(<InfoPlaceList />);

    await act(async () => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => expect(useMapStore.getState().isListLoading).toBe(false));
    const firstRecoveryNonce = useMapStore.getState().infoListReloadNonce;

    await act(async () => {
      useMapStore.getState().setListItems([item], 1, 'cursor-2', 'snap-2');
      await Promise.resolve();
    });
    await waitFor(() => expect(observerCallback).not.toBeNull());
    await act(async () => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => expect(listInfoPlaces).toHaveBeenCalledTimes(2));

    expect(firstRecoveryNonce).toBe(1);
    expect(useMapStore.getState().infoListReloadNonce).toBe(1);
    expect(useMapStore.getState().listError).toBe('목록 기준이 만료됐어요. 다시 시도해 주세요');
  });
});

function pageResponse() {
  return {
    query: { category: 'HANOK' },
    snapshot: { id: 'snap-1', publishedAt: '2026-10-03T00:00:00Z' },
    totalCount: 2,
    items: [{ ...item, placeId: 'stale-2', name: '이전 snapshot 장소' }],
    nextCursor: 'cursor-2',
    appliedCategories: ['HANOK', 'HANOK_STAY', 'HANOK_CAFE', 'HANOK_EXPERIENCE'],
    coverage: 'COMPLETE',
  };
}
