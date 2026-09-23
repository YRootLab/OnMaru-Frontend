import { fetchBackendHanoks } from '@/features/hanok-archive/infrastructure/backendHanokSource';

export const HanokArchiveService = {
  fetchHanoks: fetchBackendHanoks,
  fetchRealtimeHanoks: (_signal?: AbortSignal) => fetchBackendHanoks(),
};
