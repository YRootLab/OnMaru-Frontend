// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import FestivalExhibitionCarousel from './FestivalExhibitionCarousel';

describe('FestivalExhibitionCarousel', () => {
  beforeEach(() => {
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      loading: true,
      items: [{
        id: 'legacy-place',
        name: '이전 장소',
        category: 'spot',
        lat: 37.5,
        lng: 127,
        addr: '서울',
        image: null,
        tel: null,
        dist: 100,
      }],
    }, true);
  });

  afterEach(() => {
    cleanup();
  });

  it('uses the information-list loading state and category callback when provided', () => {
    const onShowAll = vi.fn();
    const onSelect = vi.fn();

    render(
      <FestivalExhibitionCarousel
        festivals={[]}
        loading={false}
        onShowAll={onShowAll}
        onSelect={onSelect}
      />,
    );

    expect(screen.queryByLabelText('진행 중인 축제 및 기획전 불러오는 중')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '전체보기' }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
    expect(useMapStore.getState().category).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: /2026 전주 한옥마을 문화재 야행/ })[0]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(useMapStore.getState().detailId).toBeNull();
  });

  it('shows the canonical skeleton even when legacy items remain', () => {
    render(<FestivalExhibitionCarousel festivals={[]} loading />);

    expect(screen.getByLabelText('진행 중인 축제 및 기획전 불러오는 중')).toBeTruthy();
  });
});
