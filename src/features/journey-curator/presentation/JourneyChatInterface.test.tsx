import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import JourneyChatInterface from './JourneyChatInterface';

describe('JourneyChatInterface', () => {
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
