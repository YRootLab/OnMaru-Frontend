// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapLoadError } from '../application/mapLoadError';
import { useMapStore } from '../hooks/useMapStore';
import PlaceList from './PlaceList';

vi.mock('./feed/LiveNoticeBanner', () => ({ default: () => null }));
vi.mock('./feed/FestivalExhibitionCarousel', () => ({ default: () => null }));
vi.mock('./feed/SorimaruSpotlightBanner', () => ({ default: () => null }));
vi.mock('./feed/SmartAroundFeed', () => ({ default: () => null }));

beforeEach(() => {
  useMapStore.setState({
    items: [],
    loading: false,
    placeLoadError: null,
    category: null,
    searchQuery: '',
    reloadNonce: 0,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PlaceList request states', () => {
  it('replaces the skeleton with a classified timeout state and restarts loading on retry', () => {
    useMapStore.setState({ loading: false, placeLoadError: new MapLoadError('timeout', 408) });
    render(<PlaceList />);

    expect(screen.queryByLabelText('장소 목록을 불러오는 중이에요')).toBeNull();
    expect(screen.getByText('지도 정보를 불러오는 데 시간이 걸리고 있어요')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(useMapStore.getState()).toMatchObject({ loading: true, placeLoadError: null, reloadNonce: 1 });
  });

  it('keeps successful zero results as an empty state', () => {
    render(<PlaceList />);
    expect(screen.getByText('주변에 등록된 한옥이 없어요')).toBeTruthy();
    expect(screen.queryByText('지도 정보를 불러오지 못했어요')).toBeNull();
  });

  it('keeps stale places visible with a non-blocking notice after refresh failure', () => {
    useMapStore.setState({
      items: [{
        id: 'stale-place', name: '이전에 불러온 한옥', category: 'spot', lat: 37.5, lng: 127,
        addr: '서울', image: null, tel: null, dist: 100,
      }],
      placeLoadError: new MapLoadError('unavailable', 503),
    });
    render(<PlaceList />);

    expect(screen.getByText('이전에 불러온 한옥')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('지도 서버와 연결이 원활하지 않아요');

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(useMapStore.getState()).toMatchObject({ loading: false, placeLoadError: null, reloadNonce: 1 });
  });
});
