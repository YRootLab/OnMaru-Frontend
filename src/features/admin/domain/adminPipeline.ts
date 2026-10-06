export const ADMIN_PIPELINE_DATASET = 'kto-korean-tour';

export type AdminPipelineSummaryStatus =
  | 'MISSING'
  | 'IDLE'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export type AdminPipelineRunStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABANDONED';

export interface AdminPipelineProgress {
  completed: number;
  total: number | null;
  percent: number | null;
  currentStage: string | null;
}

export interface AdminPipelineRun {
  runId: string;
  dataset: string;
  scope: 'ALL' | 'VILLAGES' | 'STAYS' | 'ROUTES';
  status: AdminPipelineRunStatus;
  progress: AdminPipelineProgress | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  failureCount: number;
}

export interface AdminPipelineContentStats {
  villageCount?: number | null;
  villageImageRate?: number | null;
  stayCount?: number | null;
  stayImageRate?: number | null;
  routeCount?: number | null;
}

export interface AdminPipelineApiEndpointUsage {
  endpoint: string;
  used: number;
  limit: number | null;
}

export interface AdminPipelineApiUsage {
  used?: number | null;
  limit?: number | null;
  measuredAt?: string | null;
  endpoints?: AdminPipelineApiEndpointUsage[];
}

export interface AdminPipelineStatus {
  schemaVersion: '1.1' | string;
  dataset: string;
  status: AdminPipelineSummaryStatus;
  lastSuccessAt: string | null;
  failureCount: number;
  cumulativeFailureRunCount: number;
  lastRun: AdminPipelineRun | null;
  contentStats?: AdminPipelineContentStats | null;
  apiUsage?: AdminPipelineApiUsage | null;
}

export interface AdminPipelineFailure {
  id: string;
  occurredAt: string;
  endpoint: string | null;
  contentId: string | null;
  errorCode: string;
  message: string;
  retryable: boolean;
}

export interface AdminPipelineFailurePage {
  schemaVersion: '1.0' | string;
  items: AdminPipelineFailure[];
  totalCount: number;
  hasNext: boolean;
  nextCursor: string | null;
}
