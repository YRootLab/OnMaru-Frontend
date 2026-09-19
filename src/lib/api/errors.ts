export type ApiErrorCode = string;

export type OnmaruApiError = {
  status: number;
  code: ApiErrorCode;
  message: string;
  requestId: string | null;
  details: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeApiError(status: number, body: unknown): OnmaruApiError {
  const payload = isRecord(body) ? body : {};
  const details = isRecord(payload.details) ? payload.details : {};

  return {
    status,
    code: typeof payload.code === 'string' ? payload.code : `HTTP_${status}`,
    message: typeof payload.message === 'string' ? payload.message : `HTTP Error ${status}`,
    requestId: typeof payload.requestId === 'string' ? payload.requestId : null,
    details,
  };
}

export function isOnmaruApiError(error: unknown): error is OnmaruApiError {
  return isRecord(error) && typeof error.status === 'number' && typeof error.code === 'string';
}
