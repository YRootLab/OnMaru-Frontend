export type ApiErrorCode = string;

export type ApiErrorClassification =
  | 'SERVER_WAKING'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'CLIENT_ERROR'
  | 'UNKNOWN_ERROR';

export type OnmaruApiError = {
  status: number;
  code: ApiErrorCode;
  message: string;
  requestId: string | null;
  details: Record<string, unknown>;
  classification: ApiErrorClassification;
  headers?: Record<string, string>;
  isWaking?: boolean;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Render 절전(Hibernation) 복귀 중인지 판단합니다.
 * - HTTP 503 상태
 * - x-render-routing: hibernate-wake-error 헤더 존재
 * - 또는 응답 본문(body/text)이 비어있음 (fallback)
 */
export function isRenderHibernateWakeError(
  headers?: Record<string, string> | Headers | null,
  body?: unknown,
  rawText?: string | null
): boolean {
  if (headers) {
    let headerVal: string | null = null;
    if (typeof (headers as Headers).get === 'function') {
      headerVal = (headers as Headers).get('x-render-routing');
    } else {
      const rec = headers as Record<string, string>;
      const matchKey = Object.keys(rec).find((k) => k.toLowerCase() === 'x-render-routing');
      if (matchKey) headerVal = rec[matchKey];
    }
    if (headerVal && headerVal.trim().toLowerCase() === 'hibernate-wake-error') {
      return true;
    }
  }

  // Fallback: 503 + 빈 본문
  if (rawText !== undefined && rawText !== null) {
    return rawText.trim() === '';
  }

  if (body === undefined || body === null) {
    return true;
  }

  if (typeof body === 'string') {
    return body.trim() === '';
  }

  if (isRecord(body) && Object.keys(body).length === 0) {
    return true;
  }

  return false;
}

/**
 * 최종 분류 우선순위:
 * 1. 503 & Render Hibernate Wake Error -> SERVER_WAKING
 * 2. 503 -> SERVICE_UNAVAILABLE
 * 3. >= 500 -> SERVER_ERROR
 * 4. 429 -> RATE_LIMITED
 */
export function classifyApiError(
  status: number,
  isHibernateWake = false
): ApiErrorClassification {
  if (status === 503 && isHibernateWake) {
    return 'SERVER_WAKING';
  }
  if (status === 503) {
    return 'SERVICE_UNAVAILABLE';
  }
  if (status >= 500) {
    return 'SERVER_ERROR';
  }
  if (status === 429) {
    return 'RATE_LIMITED';
  }
  if (status >= 400 && status < 500) {
    return 'CLIENT_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

/**
 * 분류에 따른 표준 사용자 문구를 반환합니다.
 */
export function getApiErrorMessage(
  classification: ApiErrorClassification | string,
  fallbackMessage?: string
): string {
  switch (classification) {
    case 'SERVER_WAKING':
      return '서비스를 준비하고 있어요. 첫 요청은 최대 30초 정도 걸릴 수 있습니다.';
    case 'SERVICE_UNAVAILABLE':
      return '서비스 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.';
    case 'SERVER_ERROR':
      return '데이터를 불러오는 중 문제가 발생했어요.';
    case 'RATE_LIMITED':
      return fallbackMessage || '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return fallbackMessage || '오류가 발생했습니다.';
  }
}

export function getApiErrorDetails(classification: ApiErrorClassification | string): {
  title: string;
  description: string;
} {
  switch (classification) {
    case 'SERVER_WAKING':
      return {
        title: '서비스를 준비하고 있어요.',
        description: '첫 요청은 최대 30초 정도 걸릴 수 있습니다.',
      };
    case 'SERVICE_UNAVAILABLE':
      return {
        title: '서비스 연결이 원활하지 않아요.',
        description: '잠시 후 다시 시도해 주세요.',
      };
    case 'SERVER_ERROR':
      return {
        title: '데이터를 불러오는 중 문제가 발생했어요.',
        description: '잠시 후 다시 시도해 주세요.',
      };
    case 'RATE_LIMITED':
      return {
        title: '요청이 너무 많습니다.',
        description: '잠시 후 다시 시도해 주세요.',
      };
    default:
      return {
        title: '오류가 발생했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
      };
  }
}

export function normalizeApiError(
  status: number,
  body?: unknown,
  headers?: Record<string, string> | Headers | null,
  rawText?: string | null
): OnmaruApiError {
  const headerMap: Record<string, string> = {};
  if (headers) {
    if (typeof (headers as Headers).forEach === 'function') {
      (headers as Headers).forEach((value, key) => {
        headerMap[key.toLowerCase()] = value;
      });
    } else {
      Object.entries(headers as Record<string, string>).forEach(([k, v]) => {
        headerMap[k.toLowerCase()] = String(v);
      });
    }
  }

  const payload = isRecord(body) ? body : {};
  const details = isRecord(payload.details) ? payload.details : {};
  const isWake = status === 503 && isRenderHibernateWakeError(headerMap, body, rawText);
  const classification = classifyApiError(status, isWake);

  const code: ApiErrorCode =
    typeof payload.code === 'string' && payload.code.trim() !== ''
      ? payload.code
      : classification !== 'UNKNOWN_ERROR' && classification !== 'CLIENT_ERROR'
      ? classification
      : `HTTP_${status}`;

  const message =
    classification === 'SERVER_WAKING'
      ? getApiErrorMessage('SERVER_WAKING')
      : typeof payload.message === 'string' && payload.message.trim() !== ''
      ? payload.message
      : getApiErrorMessage(classification, `HTTP Error ${status}`);

  const requestId = typeof payload.requestId === 'string' ? payload.requestId : null;

  return {
    status,
    code,
    message,
    requestId,
    details,
    classification,
    headers: headerMap,
    isWaking: classification === 'SERVER_WAKING',
  };
}
    details,
    classification,
    headers: headerMap,
    isWaking: classification === 'SERVER_WAKING',
  };
}

export function isOnmaruApiError(error: unknown): error is OnmaruApiError {
  return isRecord(error) && typeof error.status === 'number' && typeof error.code === 'string';
}

