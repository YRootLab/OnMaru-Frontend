import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import JourneyChatInterface, { findPlaces } from './JourneyChatInterface';

describe('JourneyChatInterface', () => {
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

    expect(firstPlanPlaces.map((place: { ref: { id: string } }) => place.ref.id)).toEqual(['place-plan-alpha-hanok', 'place-plan-alpha-stop-1']);
    expect(secondPlanPlaces.map((place: { ref: { id: string } }) => place.ref.id)).toEqual(['place-plan-beta-hanok', 'place-plan-beta-stop-1']);
    expect(firstPlanPlaces.every((place: { location: unknown }) => place.location === null)).toBe(true);
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
