import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserPositionProvider } from './browserGeolocation';

describe('browser position provider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests a fresh high-accuracy position and returns only the request payload fields', async () => {
    const getCurrentPosition = vi.fn((
      success: PositionCallback,
      _failure?: PositionErrorCallback | null,
      _options?: PositionOptions,
    ) => success({
      coords: { latitude: 37.5, longitude: 127, accuracy: 12 },
    } as GeolocationPosition));
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });

    await expect(browserPositionProvider.getCurrentPosition()).resolves.toEqual({
      latitude: 37.5,
      longitude: 127,
      accuracyMeters: 12,
    });
    expect(getCurrentPosition.mock.calls[0][2]).toEqual({
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 0,
    });
  });

  it.each([
    [1, 'GEOLOCATION_PERMISSION_DENIED'],
    [2, 'GEOLOCATION_POSITION_UNAVAILABLE'],
    [3, 'GEOLOCATION_TIMEOUT'],
  ])('maps browser error %s without exposing browser text', async (code, expectedCode) => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, failure: PositionErrorCallback) => {
      failure({ code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    });
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });

    await expect(browserPositionProvider.getCurrentPosition()).rejects.toMatchObject({
      code: expectedCode,
      requestId: null,
    });
  });
});
