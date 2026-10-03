// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SorimaruRequestErrorState } from './SorimaruRequestErrorState';

afterEach(cleanup);

describe('SorimaruRequestErrorState', () => {
  it('shows calm server guidance and delegates retry', () => {
    const onRetry = vi.fn();
    const { container } = render(<SorimaruRequestErrorState onRetry={onRetry} />);

    expect(screen.getByText('잠시 연결이 불안정해요')).toBeTruthy();
    expect(screen.getByText('이야기를 불러오는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해 주세요.')).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('src')).toContain('/images/character/Oni_server_error.png');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
