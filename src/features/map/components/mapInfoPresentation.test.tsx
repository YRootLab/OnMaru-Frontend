// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '../hooks/useMapStore';

vi.mock('./InfoPlaceList', () => ({ default: () => <div>정보 목록 소스</div> }));
vi.mock('./PlaceList', () => ({ default: () => <div>legacy 목록 소스</div> }));
vi.mock('./ModeToggle', () => ({ default: () => <div>mode toggle</div> }));
vi.mock('./SearchBar', () => ({ default: () => <div>search bar</div> }));
vi.mock('./PlaceDetail', () => ({ default: () => <div>place detail</div> }));
vi.mock('@/private/core-ui/map-warmth/WarmthFeed', () => ({ default: () => <div>warmth feed</div> }));
vi.mock('@/private/core-ui/map-warmth/PopularPlacesPanel', () => ({ default: () => <div>popular places</div> }));

import BottomSheet from './BottomSheet';
import ListPanel from './ListPanel';

describe('map information list presentation', () => {
  beforeEach(() => {
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      mode: 'info',
      panelOpen: true,
      detailId: null,
      popularPanelOpen: false,
    }, true);
  });

  afterEach(cleanup);

  it('uses InfoPlaceList in the desktop panel', () => {
    render(<ListPanel />);

    expect(screen.getByText('정보 목록 소스')).toBeTruthy();
    expect(screen.queryByText('legacy 목록 소스')).toBeNull();
  });

  it('uses the same InfoPlaceList source in the mobile sheet', () => {
    render(<BottomSheet />);

    expect(screen.getByText('정보 목록 소스')).toBeTruthy();
    expect(screen.queryByText('legacy 목록 소스')).toBeNull();
  });
});
