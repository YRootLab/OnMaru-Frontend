// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerTranscriptPanel } from './PlayerTranscriptPanel';

describe('PlayerTranscriptPanel overflow fades', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('shows fades only where more transcript content can be scrolled into view', () => {
    const { container } = render(
      <PlayerTranscriptPanel
        lines={[{ id: 1, timeSec: 0, text: '첫 문장' }]}
        activeLineId={undefined}
        onSeek={vi.fn()}
      />,
    );
    const scroller = container.querySelector('[data-playing]') as HTMLDivElement;
    Object.defineProperty(scroller, 'clientHeight', { value: 100 });
    Object.defineProperty(scroller, 'scrollHeight', { value: 400 });

    fireEvent.scroll(scroller);
    expect(screen.queryByTestId('transcript-top-fade')).toBeNull();
    expect(screen.getByTestId('transcript-bottom-fade')).toBeTruthy();

    scroller.scrollTop = 160;
    fireEvent.scroll(scroller);
    expect(screen.getByTestId('transcript-top-fade')).toBeTruthy();
    expect(screen.getByTestId('transcript-bottom-fade')).toBeTruthy();

    scroller.scrollTop = 300;
    fireEvent.scroll(scroller);
    expect(screen.getByTestId('transcript-top-fade')).toBeTruthy();
    expect(screen.queryByTestId('transcript-bottom-fade')).toBeNull();
  });
});
