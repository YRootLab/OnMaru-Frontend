import { apiRequest, type ApiRequestOptions, USE_MOCK } from '@/lib/api/client';
import type { MemberTimeline } from './memberTimelineContract';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

export type MemberTimelineRepository = {
  getTimeline(input?: { month?: string; limit?: number; cursor?: string }): Promise<MemberTimeline>;
};

export function createMemberTimelineRepository(request: RequestFn = apiRequest): MemberTimelineRepository {
  return {
    getTimeline(input = {}) {
      return request<MemberTimeline>('/me/timeline', {
        method: 'GET',
        cache: 'no-store',
        params: { month: input.month, limit: input.limit ?? 20, cursor: input.cursor },
      });
    },
  };
}

export const fixtureMemberTimelineRepository: MemberTimelineRepository = {
  async getTimeline(input = {}) {
    const month = input.month ?? '2026-09';
    return {
      month,
      groups: [
        {
          date: `${month}-13`,
          items: [
            {
              id: 'timeline-place-1',
              type: 'SAVED_PLACE',
              occurredAt: `${month}-13T09:00:00.000Z`,
              title: '전주 한옥마을',
              subtitle: '한옥 · 전주',
              thumbnailUrl: null,
              target: { type: 'PLACE', placeId: 'p-hanok-01' },
            },
            {
              id: 'timeline-journey-1',
              type: 'SAVED_JOURNEY',
              occurredAt: `${month}-13T08:30:00.000Z`,
              title: '전주 반나절 한옥 산책',
              subtitle: '기본 탐색 결과에서 저장한 여정',
              thumbnailUrl: null,
              target: { type: 'SAVED_JOURNEY', savedJourneyId: 'saved-journey-1' },
            },
          ],
        },
      ],
      nextCursor: null,
      hasMore: false,
      unavailableCount: 1,
    };
  },
};

export const defaultMemberTimelineRepository = USE_MOCK
  ? fixtureMemberTimelineRepository
  : createMemberTimelineRepository();
