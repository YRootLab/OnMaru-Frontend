import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import type { JourneyBoard, ResourceRef, SavedJourneyDetail } from '../types/exploration.types';
import type { RunAccepted } from './journeyApi';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

/*
  GET/POST /saved-journeys, GET/DELETE /saved-journeys/{id}, POST /saved-journeys/{id}/resume.

  OpenAPI 스펙이 이 엔드포인트들의 success response를 아직 문서화하지 않았고
  로그인 세션이 있어야 호출 가능해 이 세션에서 실제 응답을 확인하지 못했다.
  요청/응답 모두 프런트가 이미 쓰고 있는 SavedJourneyDetail 계약을 그대로
  가정했다 — 실제 필드명이 다르면 이 파일의 매핑만 고치면 된다. 그래서
  useSavedExplorationStore는 이 repository가 실패하면 항상 기존 localStorage
  경로로 폴백한다(아래 스토어 참고) — 가정이 틀려도 저장 기능 자체는
  절대 깨지지 않는다.
*/
export interface SavedJourneysRepository {
  list(): Promise<SavedJourneyDetail[]>;
  create(board: JourneyBoard, pinnedRefs: ResourceRef[], title: string): Promise<SavedJourneyDetail>;
  remove(id: string): Promise<void>;
  resume(id: string, idempotencyKey: string): Promise<RunAccepted>;
}

export function createSavedJourneysRepository(request: RequestFn = apiRequest): SavedJourneysRepository {
  return {
    async list() {
      const res = await request<{ items: SavedJourneyDetail[] }>('/saved-journeys', { method: 'GET', cache: 'no-store' });
      return res.items;
    },
    create(board, pinnedRefs, title) {
      return request<SavedJourneyDetail>('/saved-journeys', {
        method: 'POST',
        body: { title, board, pinnedRefs },
        csrf: true,
      });
    },
    remove(id) {
      return request<void>(`/saved-journeys/${encodeURIComponent(id)}`, { method: 'DELETE', csrf: true });
    },
    resume(id, idempotencyKey) {
      return request<RunAccepted>(`/saved-journeys/${encodeURIComponent(id)}/resume`, {
        method: 'POST',
        body: {},
        csrf: true,
        idempotencyKey,
      });
    },
  };
}

export const defaultSavedJourneysRepository = createSavedJourneysRepository();
