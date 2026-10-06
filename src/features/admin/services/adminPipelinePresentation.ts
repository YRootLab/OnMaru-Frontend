import type { OnmaruApiError } from '@/lib/api/errors';
import type {
  AdminPipelineRunStatus,
  AdminPipelineSummaryStatus,
} from '@/features/admin/domain/adminPipeline';

export function formatPipelineDuration(seconds: number | null): string {
  if (seconds === null) return '집계 중';
  if (seconds < 60) return `${seconds}초`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
}

export function getPipelineStatusPresentation(
  status: AdminPipelineSummaryStatus | AdminPipelineRunStatus,
): { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' } {
  switch (status) {
    case 'SUCCEEDED': return { label: '성공', tone: 'success' };
    case 'RUNNING': return { label: '실행 중', tone: 'success' };
    case 'FAILED': return { label: '실패', tone: 'danger' };
    case 'CANCELLED': return { label: '취소됨', tone: 'warning' };
    case 'ABANDONED': return { label: '중단·건너뜀', tone: 'warning' };
    case 'IDLE':
    case 'QUEUED': return { label: '대기', tone: 'neutral' };
    case 'MISSING': return { label: '실행 이력 없음', tone: 'neutral' };
  }
}

export function getAdminPipelineErrorPresentation(error: OnmaruApiError): {
  title: string;
  description: string;
} {
  const title = error.code === 'AUTH_REQUIRED'
    ? '관리자 로그인이 필요해요.'
    : error.code === 'SERVICE_UNAVAILABLE'
      ? '파이프라인 기록 서버가 잠시 응답하지 않아요.'
      : error.code === 'NOT_FOUND'
        ? '최근 실행 기록이 변경되었어요.'
        : '파이프라인 상태를 불러오지 못했어요.';
  const baseDescription = error.code === 'AUTH_REQUIRED'
    ? '다시 로그인한 뒤 확인해 주세요.'
    : '잠시 후 다시 시도해 주세요.';
  return {
    title,
    description: error.requestId
      ? `${baseDescription} 문의 코드: ${error.requestId}`
      : baseDescription,
  };
}
