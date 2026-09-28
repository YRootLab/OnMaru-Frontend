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

export function normalizeApiError(status: number, body: unknown, headers?: Headers): OnmaruApiError {
  const payload = isRecord(body) ? body : {};
  const details = isRecord(payload.details) ? payload.details : {};
  const isWakeErrorHeader = headers?.get('x-render-routing') === 'hibernate-wake-error';
  const isEmptyBody =
    body === undefined ||
    body === null ||
    (typeof body === 'string' && body.trim() === '') ||
    (isRecord(body) && Object.keys(body).length === 0 && !('code' in body));

  let defaultCode = `HTTP_${status}`;
  if (status === 503) {
    if (isWakeErrorHeader || isEmptyBody) {
      defaultCode = 'SERVER_WAKING';
    } else if (payload.code === 'SERVICE_UNAVAILABLE') {
      defaultCode = 'SERVICE_UNAVAILABLE';
    } else {
      defaultCode = 'SERVICE_UNAVAILABLE';
    }
  }

  const defaultMessage =
    defaultCode === 'SERVER_WAKING'
      ? '서비스를 준비하고 있어요.\n잠시 후 다시 불러올게요.'
      : defaultCode === 'SERVICE_UNAVAILABLE'
      ? '온기 데이터를 잠시 불러오지 못했어요.'
      : `HTTP Error ${status}`;

  return {
    status,
    code: typeof payload.code === 'string' ? (payload.code as ApiErrorCode) : defaultCode,
    message: typeof payload.message === 'string' ? payload.message : defaultMessage,
    requestId: typeof payload.requestId === 'string' ? payload.requestId : null,
    details,
  };
}

export function isOnmaruApiError(error: unknown): error is OnmaruApiError {
  return isRecord(error) && typeof error.status === 'number' && typeof error.code === 'string';
}
