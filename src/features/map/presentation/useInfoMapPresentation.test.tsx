// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMapStore } from '../hooks/useMapStore';
import { useInfoMapPresentation } from './useInfoMapPresentation';

describe('useInfoMapPresentation', () => {
  beforeEach(() => useMapStore.setState({ ...useMapStore.getInitialState(), mode: 'info' }, true));

  it('uses discovery only for a root hanok view without a direct query', () => {
    const { result } = renderHook(useInfoMapPresentation);
    expect(result.current).toMatchObject({ isDiscovery: true, collectionScope: 'hanok-home' });
  });

  it('uses utility presentation for text, category, region, and warmth intent', () => {
    useMapStore.setState({ searchQuery: '북촌' });
    expect(renderHook(useInfoMapPresentation).result.current.isUtility).toBe(true);
    useMapStore.setState({ searchQuery: '', infoCategory: 'cafe' });
    expect(renderHook(useInfoMapPresentation).result.current.isDiscovery).toBe(false);
    useMapStore.setState({ infoCategory: 'hanok', infoRegionCode: '11' });
    expect(renderHook(useInfoMapPresentation).result.current.collectionScope).toBe('region-home');
    useMapStore.setState({ mode: 'warmth' });
    expect(renderHook(useInfoMapPresentation).result.current.isUtility).toBe(true);
  });
});
