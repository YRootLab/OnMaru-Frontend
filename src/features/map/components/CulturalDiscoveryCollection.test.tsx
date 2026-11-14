// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CulturalDiscoveryCollection from './CulturalDiscoveryCollection';

const collection = {
  id: 'hanok-neighborhoods',
  scope: 'hanok-home' as const,
  title: { ko: '동네 이야기', en: 'Stories in the neighborhood' },
  subtitle: { ko: '동네의 이야기를 발견하세요.', en: 'Discover how Hanok culture connects this neighborhood.' },
  provenance: 'OnMaru editorial collection',
  placeRefs: [{ placeId: 'p-1' }],
  paths: [
    { id: 'stay', label: '한옥에 머물다', category: 'stay' as const, searchQuery: '한옥스테이' },
    { id: 'food', label: '지역을 맛보다', category: 'food' as const, searchQuery: '향토음식' },
  ],
};
const place = { id: 'p-1', name: '북촌 한옥', category: 'spot' as const, lat: 37.58, lng: 126.98, addr: '서울', image: null, tel: null, dist: null, isTraditional: true };
const unrelatedPlace = { id: 'p-2', name: '일반 카페', category: 'cafe' as const, lat: 37.58, lng: 126.98, addr: '서울', image: null, tel: null, dist: null, isTraditional: false };

describe('CulturalDiscoveryCollection', () => {
  it('renders title before cultural context and uses supplied place selection', () => {
    const onPlaceSelect = vi.fn();
    const onPathSelect = vi.fn();
    render(
      <CulturalDiscoveryCollection
        collection={collection}
        places={[place, unrelatedPlace]}
        loading={false}
        onPlaceSelect={onPlaceSelect}
        onPathSelect={onPathSelect}
      />,
    );
    expect(screen.getByRole('heading', { name: collection.title.ko })).toBeTruthy();
    expect(screen.queryByText(collection.title.en!)).toBeNull();
    expect(screen.getByRole('link', { name: 'HANOK CULTURE WALK' }).getAttribute('href')).toBe('/hanok');
    screen.getByRole('button', { name: place.name }).click();
    expect(onPlaceSelect).toHaveBeenCalledWith(place);
    expect(screen.queryByRole('button', { name: unrelatedPlace.name })).toBeNull();
    screen.getByRole('button', { name: '지역을 맛보다' }).click();
    expect(onPathSelect).toHaveBeenCalledWith(collection.paths[1]);
  });
});
