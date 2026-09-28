import { getApiErrorDetails, isOnmaruApiError, OnmaruApiError } from '@/lib/api/errors';

export interface ResolvedSectionErrorState {
  title: string;
  description: string;
  requestId: string | null;
  classification: string;
  isWaking: boolean;
  canRetry: boolean;
}

export function resolveSectionErrorState(
  error?: OnmaruApiError | unknown,
  customTitle?: string,
  customDescription?: string,
  customRequestId?: string | null
): ResolvedSectionErrorState {
  const isApiError = isOnmaruApiError(error);
  const classification = isApiError ? error.classification : 'UNKNOWN_ERROR';
  const defaultDetails = getApiErrorDetails(classification);

  const title = customTitle || (isApiError ? defaultDetails.title : '데이터를 불러오는 중 문제가 발생했어요.');
  const description =
    customDescription ||
    (isApiError
      ? error.message || defaultDetails.description
      : typeof (error as any)?.message === 'string'
      ? (error as any).message
      : '잠시 후 다시 시도해 주세요.');

  const requestId = customRequestId !== undefined ? customRequestId : isApiError ? error.requestId : null;
  const isWaking = classification === 'SERVER_WAKING';

  return {
    title,
    description,
    requestId,
    classification,
    isWaking,
    canRetry: !isWaking,
  };
}
