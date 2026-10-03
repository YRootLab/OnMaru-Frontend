import { isOnmaruApiError } from '@/lib/api/errors';

export type MapLoadErrorKind =
  | 'network'
  | 'timeout'
  | 'rate-limited'
  | 'server'
  | 'unavailable'
  | 'unknown';

export class MapLoadError extends Error {
  readonly name = 'MapLoadError';

  constructor(
    public readonly kind: MapLoadErrorKind,
    public readonly status: number | null = null,
    message = 'Map data request failed',
    public readonly original?: unknown,
  ) {
    super(message);
  }
}

function kindForStatus(status: number): MapLoadErrorKind {
  if (status === 408 || status === 504) return 'timeout';
  if (status === 429) return 'rate-limited';
  if (status === 502 || status === 503) return 'unavailable';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function mapLoadErrorFromStatus(status: number, message?: string, original?: unknown): MapLoadError {
  return new MapLoadError(kindForStatus(status), status, message, original);
}

export function toMapLoadError(reason: unknown): MapLoadError {
  if (reason instanceof MapLoadError) return reason;
  if (isOnmaruApiError(reason)) {
    return mapLoadErrorFromStatus(reason.status, reason.message, reason);
  }
  if (typeof reason === 'object' && reason !== null && 'status' in reason) {
    const status = Number((reason as { status?: unknown }).status);
    if (Number.isFinite(status)) return mapLoadErrorFromStatus(status, undefined, reason);
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new MapLoadError('network', null, 'Browser is offline', reason);
  }
  if (reason instanceof TypeError) {
    return new MapLoadError('network', null, reason.message, reason);
  }
  return new MapLoadError('unknown', null, reason instanceof Error ? reason.message : undefined, reason);
}
