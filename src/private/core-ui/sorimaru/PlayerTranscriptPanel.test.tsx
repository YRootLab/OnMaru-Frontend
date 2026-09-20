import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PlayerTranscriptPanel } from './PlayerTranscriptPanel';

describe('PlayerTranscriptPanel', () => {
  it('renders all supplied lines and exposes only the active line as current', () => {
    const markup = renderToStaticMarkup(
      <PlayerTranscriptPanel
        lines={[
          { id: 1, timeSec: 0, text: '첫 문장입니다.' },
          { id: 2, timeSec: 4, text: '현재 들리는 문장입니다.' },
        ]}
        activeLineId={2}
        onSeek={vi.fn()}
      />,
    );

    expect(markup).toContain('첫 문장입니다.');
    expect(markup).toContain('현재 들리는 문장입니다.');
    expect(markup).toContain('aria-current="true"');
    expect(markup).toContain('aria-current="false"');
  });

  it('reserves transcript line space while loading', () => {
    const markup = renderToStaticMarkup(
      <PlayerTranscriptPanel lines={[]} activeLineId={undefined} onSeek={vi.fn()} isLoading />,
    );

    expect(markup).toContain('data-testid="transcript-skeleton"');
  });
});
