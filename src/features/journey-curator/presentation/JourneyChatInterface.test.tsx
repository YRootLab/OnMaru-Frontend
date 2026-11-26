import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import JourneyChatInterface, { extractPlaces, findPlaces } from './JourneyChatInterface';

describe('JourneyChatInterface', () => {
  it('extracts PLACE resources from a proposal board when the turn board is empty', () => {
    const place = {
      ref: { type: 'PLACE', id: 'place-gyeongbokgung' },
      title: '경복궁',
      category: '궁궐',
      regionRef: { type: 'REGION', id: 'kr-11' },
      summary: '조선의 정궁',
      image: null,
      location: null,
      sourceRefs: [],
      unavailableFields: [],
    };
    const turn = {
      turnId: 'turn-1',
      query: '서울 경복궁과 같은 궁궐이나 한옥 추천해줘',
      createdAt: '2026-11-25T00:00:00Z',
      runId: 'run-1',
      response: {
        status: 'COMPLETED',
        outcome: 'PROPOSAL',
        summary: null,
        board: null,
        proposal: {
          id: 'proposal-1',
          baseVersion: 1,
          expiresAt: '2026-11-26T00:00:00Z',
          keptRefs: [],
          addedRefs: [place.ref],
          removedRefs: [],
          board: { resources: [place], candidates: [] },
          unknowns: [],
        },
        clarification: null,
        error: null,
      },
    };

    expect(extractPlaces(turn as never).map((p) => p.title)).toEqual(['경복궁']);
  });

  it('shows the hanok placeholder image when a place has no photo', () => {
    const place = {
      ref: { type: 'PLACE', id: 'place-gyeongbokgung' },
      title: '경복궁',
      category: '궁궐',
      regionRef: { type: 'REGION', id: 'kr-11' },
      summary: null,
      image: null,
      location: null,
      sourceRefs: [],
      unavailableFields: [],
    };
    const markup = renderToStaticMarkup(
      <JourneyChatInterface
        explorations={[]}
        activeExplorationId="exp-1"
        turns={[
          {
            turnId: 'turn-1',
            query: '서울 경복궁 추천해줘',
            createdAt: '2026-11-25T00:00:00Z',
            runId: 'run-1',
            response: {
              status: 'COMPLETED',
              outcome: 'PROPOSAL',
              summary: '요약',
              board: { resources: [place], candidates: [] },
              proposal: null,
              clarification: null,
              error: null,
            },
          },
        ] as never}
        pendingQuery={null}
        progressMessage={null}
        loading={false}
        loadingOlder={false}
        hasOlderTurns={false}
        error={null}
        onSelectConversation={vi.fn()}
        onLoadOlder={vi.fn()}
        onSend={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    expect(markup).toContain('src="/images/hanok/hanok-main.png"');
    expect(markup).not.toContain('등록된 사진이 없어요.');
  });

  it('renders proposal place cards in the assistant response', () => {
    const place = {
      ref: { type: 'PLACE', id: 'place-gyeongbokgung' },
      title: '경복궁',
      category: '궁궐',
      regionRef: { type: 'REGION', id: 'kr-11' },
      summary: '조선의 정궁',
      image: null,
      location: null,
      sourceRefs: [],
      unavailableFields: [],
    };
    const markup = renderToStaticMarkup(
      <JourneyChatInterface
        explorations={[]}
        activeExplorationId="exp-1"
        turns={[
          {
            turnId: 'turn-1',
            query: '서울 경복궁 추천해줘',
            createdAt: '2026-11-25T00:00:00Z',
            runId: 'run-1',
            response: {
              status: 'COMPLETED',
              outcome: 'PROPOSAL',
              summary: '서울 궁궐 코스를 준비했어요.',
              board: null,
              proposal: {
                id: 'proposal-1',
                baseVersion: 1,
                expiresAt: '2026-11-26T00:00:00Z',
                keptRefs: [],
                addedRefs: [place.ref],
                removedRefs: [],
                board: { resources: [place], candidates: [] },
                unknowns: [],
              },
              clarification: null,
              error: null,
            },
          },
        ] as never}
        pendingQuery={null}
        progressMessage={null}
        loading={false}
        loadingOlder={false}
        hasOlderTurns={false}
        error={null}
        onSelectConversation={vi.fn()}
        onLoadOlder={vi.fn()}
        onSend={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    expect(markup).toContain('aria-label="추천 장소"');
    expect(markup).toContain('경복궁');
    expect(markup).toContain('서울 궁궐 코스를 준비했어요.');
  });

  it('uses the Bento plan ID for fallback place IDs without inventing coordinates', () => {
    const createBentoBoard = (id: string) => ({
      id,
      title: '같은 제목의 여정',
      querySummary: '같은 조건의 여정',
      hanokCard: { title: '한옥', location: '주소', architecturalPoint: '건축 특징' },
      routeCard: { stops: [{ name: '첫 번째 정류장', category: '명소', description: '설명', time: '10:00' }] },
    });

    const firstPlanPlaces = findPlaces(createBentoBoard('plan-alpha') as never);
    const secondPlanPlaces = findPlaces(createBentoBoard('plan-beta') as never);

    expect(firstPlanPlaces.map((place) => place.ref.id)).toEqual(['place-plan-alpha-hanok', 'place-plan-alpha-stop-1']);
    expect(secondPlanPlaces.map((place) => place.ref.id)).toEqual(['place-plan-beta-hanok', 'place-plan-beta-stop-1']);
    expect(firstPlanPlaces.every((place) => place.location === null)).toBe(true);
  });

  it('presents a focused conversation canvas for a new journey', () => {
    const markup = renderToStaticMarkup(
      <JourneyChatInterface
        explorations={[]}
        activeExplorationId={null}
        turns={[]}
        pendingQuery={null}
        progressMessage={null}
        loading={false}
        loadingOlder={false}
        hasOlderTurns={false}
        error={null}
        onSelectConversation={vi.fn()}
        onLoadOlder={vi.fn()}
        onSend={async () => undefined}
        onCancel={async () => undefined}
      />,
    );

    expect(markup).toContain('여행을 같이 짜볼까요?');
    expect(markup).toContain('data-chat-surface="conversation"');
    expect(markup).toContain('data-message-role="assistant"');
    expect(markup).not.toContain('AI 여정 대화');
  });
});
