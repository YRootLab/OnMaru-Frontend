import { apiRequest } from '@/lib/api/client';
import {
  ADMIN_PIPELINE_DATASET,
  type AdminPipelineFailurePage,
  type AdminPipelineRun,
  type AdminPipelineStatus,
} from '@/features/admin/domain/adminPipeline';

type FetchOptions = {
  method: 'GET';
  cache: 'no-store';
  params?: Record<string, unknown>;
};

type PipelineFetcher = (path: string, options: FetchOptions) => Promise<unknown>;

export interface AdminPipelineRepository {
  getStatus(): Promise<AdminPipelineStatus>;
  getRun(runId: string): Promise<AdminPipelineRun>;
  getFailures(
    runId: string,
    query?: { limit?: number; cursor?: string },
  ): Promise<AdminPipelineFailurePage>;
}

const defaultFetcher: PipelineFetcher = (path, options) => apiRequest(path, options);

export function createAdminPipelineRepository(
  fetcher: PipelineFetcher = defaultFetcher,
): AdminPipelineRepository {
  const basePath = `/admin/pipelines/${ADMIN_PIPELINE_DATASET}`;

  return {
    getStatus: () => fetcher(`${basePath}/status`, {
      method: 'GET',
      cache: 'no-store',
    }) as Promise<AdminPipelineStatus>,
    getRun: (runId) => fetcher(`${basePath}/runs/${runId}`, {
      method: 'GET',
      cache: 'no-store',
    }) as Promise<AdminPipelineRun>,
    getFailures: (runId, query = {}) => {
      const params: Record<string, unknown> = {
        limit: Math.max(1, Math.min(100, query.limit ?? 20)),
      };
      if (query.cursor) params.cursor = query.cursor;
      return fetcher(`${basePath}/runs/${runId}/failures`, {
        method: 'GET',
        cache: 'no-store',
        params,
      }) as Promise<AdminPipelineFailurePage>;
    },
  };
}

export const adminPipelineRepository = createAdminPipelineRepository();
