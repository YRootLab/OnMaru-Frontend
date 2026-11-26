import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import JourneyChatInterface, { extractPlaces, findPlaces } from './JourneyChatInterface';
import { applyStageFrame, createProgress, type JourneyProgress } from '../domain/journeyProgress';

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
        progress={null}
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
        progress={null}
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
        progress={null}
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

  describe('answer states and progress', () => {
    const turn = (response: Record<string, unknown>) => ({
      turnId: 'turn-1',
      query: '서울 궁궐 추천해줘',
      createdAt: '2026-11-25T00:00:00Z',
      runId: 'run-1',
      response: {
        status: 'COMPLETED',
        outcome: null,
        summary: null,
        board: null,
        proposal: null,
        clarification: null,
        error: null,
        ...response,
      },
    });

    const renderChat = (options: { turns?: unknown[]; progress?: JourneyProgress | null; pendingQuery?: string | null }) =>
      renderToStaticMarkup(
        <JourneyChatInterface
          explorations={[]}
          activeExplorationId="exp-1"
          turns={(options.turns ?? []) as never}
          pendingQuery={options.pendingQuery ?? null}
          progress={options.progress ?? null}
          loading={false}
          loadingOlder={false}
          hasOlderTurns={false}
          error={null}
          onSelectConversation={vi.fn()}
          onLoadOlder={vi.fn()}
          onSend={async () => undefined}
          onCancel={async () => undefined}
          onToggleProgress={vi.fn()}
        />,
      );

    const runningProgress = (status: 'QUEUED' | 'RUNNING') => {
      const base = createProgress({ runId: 'run-1', now: Date.now(), status });
      return applyStageFrame(base, { runId: 'run-1', sequence: 1, stage: 'RETRIEVING', status }, Date.now());
    };

    it('shows the step timeline and a cancel button only while the run is RUNNING', () => {
      const markup = renderChat({ pendingQuery: '서울 궁궐 추천해줘', progress: runningProgress('RUNNING') });
      expect(markup).toContain('조건에 맞는 장소를 찾는 중');
      expect(markup).toContain('>취소</button>');
    });

    it('does not offer cancel while the run is still queued', () => {
      const markup = renderChat({ pendingQuery: '서울 궁궐 추천해줘', progress: runningProgress('QUEUED') });
      expect(markup).not.toContain('>취소</button>');
    });

    it('explains a no-results completion instead of a generic summary', () => {
      const markup = renderChat({ turns: [turn({ outcome: 'NO_RESULTS' })] });
      expect(markup).toContain('조건에 맞는 장소를 찾지 못했어요. 지역이나 분위기를 조금 넓혀 볼까요?');
    });

    it('never shows the generic summary when a completed answer is empty', () => {
      const markup = renderChat({ turns: [turn({ outcome: 'INITIAL_BOARD' })] });
      expect(markup).toContain('추천 여정을 정리했어요. 아래 장소를 둘러보세요.');
      expect(markup).not.toContain('맞춤 한옥 여정 코스를 준비했어요');
    });

    it('asks the clarification question with its choices as chips', () => {
      const markup = renderChat({
        turns: [
          turn({
            outcome: 'CLARIFICATION_REQUIRED',
            clarification: {
              id: 'clar-1',
              reason: 'REGION_MISSING',
              question: '어느 지역으로 떠나 볼까요?',
              choices: [{ id: 'c-seoul', label: '서울', regionCode: 'kr-11' }],
              allowFreeText: true,
            },
          }),
        ],
      });
      expect(markup).toContain('어느 지역으로 떠나 볼까요?');
      expect(markup).toContain('서울');
    });

    it('uses the rate-limit copy for a RATE_LIMITED failure', () => {
      const markup = renderChat({ turns: [turn({ status: 'FAILED', error: { code: 'RATE_LIMITED', requestId: 'req-1' } })] });
      expect(markup).toContain('잠시 뒤에 다시 시도해 주세요.');
    });
  });

  describe('place card fields', () => {
    const renderWithBoard = (resources: unknown[]) =>
      renderToStaticMarkup(
        <JourneyChatInterface
          explorations={[]}
          activeExplorationId="exp-1"
          turns={[
            {
              turnId: 'turn-1',
              query: '서울 궁궐 추천해줘',
              createdAt: '2026-11-26T00:00:00Z',
              runId: 'run-1',
              response: { status: 'COMPLETED', outcome: 'INITIAL_BOARD', summary: '요약', board: { resources, candidates: [] }, proposal: null, clarification: null, error: null },
            },
          ] as never}
          pendingQuery={null}
          progress={null}
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

    const place = (overrides: Record<string, unknown> = {}) => ({
      ref: { type: 'PLACE', id: 'place-gyeongbokgung' },
      title: '경복궁',
      category: '궁궐',
      regionRef: { type: 'REGION', id: 'kr-11' },
      summary: null,
      image: null,
      location: null,
      sourceRefs: [],
      unavailableFields: [],
      ...overrides,
    });

    it('shows the region title from the RegionResource instead of the raw region code', () => {
      const markup = renderWithBoard([place(), { ref: { type: 'REGION', id: 'kr-11' }, title: '서울' }]);
      expect(markup).toContain('서울');
      expect(markup).not.toContain('kr-11');
    });

    it('hides the region item when no RegionResource title is available', () => {
      const markup = renderWithBoard([place()]);
      expect(markup).not.toContain('kr-11');
    });

    it('shows the address when the place has one', () => {
      const markup = renderWithBoard([place({ address: '서울 종로구 사직로 161' })]);
      expect(markup).toContain('서울 종로구 사직로 161');
    });
  });

  it('uses the reason-specific copy for a no-results turn', () => {
    const markup = renderToStaticMarkup(
      <JourneyChatInterface
        explorations={[]}
        activeExplorationId="exp-1"
        turns={[
          {
            turnId: 'turn-1',
            query: '제주 추천',
            createdAt: '2026-11-26T00:00:00Z',
            runId: 'run-1',
            response: { status: 'COMPLETED', outcome: 'NO_RESULTS', resultReason: 'NO_RELEVANT_CANDIDATES', summary: null, board: null, proposal: null, clarification: null, error: null },
          },
        ] as never}
        pendingQuery={null}
        progress={null}
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
    expect(markup).toContain('조건을 조금 완화해 볼까요?');
  });
});
