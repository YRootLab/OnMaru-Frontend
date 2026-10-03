// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OniSearchEmpty } from './OniSearchEmpty';

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock('framer-motion', () => ({
  useReducedMotion: () => motionState.reduced,
}));

afterEach(() => {
  motionState.reduced = false;
});

describe('OniSearchEmpty', () => {
  it('renders title, description and action', () => {
    render(
      <OniSearchEmpty
        title="검색 결과가 없어요"
        description="다른 검색어로 시도해 보세요."
        action={<button type="button">다시 검색</button>}
      />
    );

    expect(screen.getByText('검색 결과가 없어요')).toBeTruthy();
    expect(screen.getByText('다른 검색어로 시도해 보세요.')).toBeTruthy();
    expect(screen.getByRole('button', { name: '다시 검색' })).toBeTruthy();
  });

  it('renders transparent video by default with /videos/Oni_search.webm', () => {
    const { container } = render(
      <OniSearchEmpty title="결과 없음" />
    );

    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    const source = video?.querySelector('source');
    expect(source?.getAttribute('src')).toBe('/videos/Oni_search.webm');
  });

  it('renders video when videoSrc is explicitly provided', () => {
    const { container } = render(
      <OniSearchEmpty title="결과 없음" videoSrc="/videos/Oni_search.webm" />
    );

    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    const source = video?.querySelector('source');
    expect(source?.getAttribute('src')).toBe('/videos/Oni_search.webm');
  });

  it('preserves typography hierarchy with main title on top and description below', () => {
    render(
      <OniSearchEmpty
        title="메인 타이틀"
        description="설명 문구"
      />
    );

    const titleEl = screen.getByText('메인 타이틀');
    const descEl = screen.getByText('설명 문구');

    expect(titleEl.tagName).toBe('H4');
    expect(descEl.tagName).toBe('P');
    expect(titleEl.compareDocumentPosition(descEl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('honors an explicit static image during reduced motion', () => {
    motionState.reduced = true;
    const { container } = render(
      <OniSearchEmpty
        title="잠시 연결이 불안정해요"
        videoSrc=""
        imageSrc="/images/character/Oni_server_error.png"
      />
    );

    const image = container.querySelector('img');
    expect(image).toBeTruthy();
    expect(image?.getAttribute('src')).toContain('/images/character/Oni_server_error.png');
  });
});
