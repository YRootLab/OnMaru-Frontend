import type { PositionProvider } from '../application/ports';

export class GeolocationClientError extends Error {
  readonly code: string;
  readonly requestId = null;

  constructor(code: string) {
    super(code);
    this.name = 'GeolocationClientError';
    this.code = code;
  }
}

function geolocationErrorCode(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return 'GEOLOCATION_PERMISSION_DENIED';
  if (error.code === error.POSITION_UNAVAILABLE) return 'GEOLOCATION_POSITION_UNAVAILABLE';
  return 'GEOLOCATION_TIMEOUT';
}

export const browserPositionProvider: PositionProvider = {
  getCurrentPosition: () => new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeolocationClientError('GEOLOCATION_UNSUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
      }),
      (error) => reject(new GeolocationClientError(geolocationErrorCode(error))),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }),
};
