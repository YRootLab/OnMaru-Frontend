// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('@/lib/api/client', () => ({ apiRequest }));

import { usePlaceDetail } from './usePlaceDetail';

describe('usePlaceDetail information-mode boundary', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads a canonical place without calling the legacy TourAPI route', async () => {
    apiRequest.mockResolvedValue({
      placeId: 'p-canonical-1',
      name: '정식 장소',
      address: '서울',
      coordinates: { lat: 37.5, lng: 127 },
      images: [],
      description: '설명',
      contentTags: [],
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => usePlaceDetail('p-canonical-1', undefined, 'canonical'));
    await act(async () => Promise.resolve());

    expect(apiRequest).toHaveBeenCalledWith('/places/p-canonical-1', expect.objectContaining({
      method: 'GET',
    }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
