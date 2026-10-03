// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SorimaruArchiveBrowse } from './SorimaruArchiveBrowse';

afterEach(cleanup);

describe('SorimaruArchiveBrowse request states', () => {
  it('shows a retryable server state instead of filter-empty guidance on failure', () => {
    const onRetry = vi.fn();
    render(
      <SorimaruArchiveBrowse
        stories={[]}
        isLoading={false}
        error={new Error('offline')}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('잠시 연결이 불안정해요')).toBeTruthy();
    expect(screen.queryByText('조건에 맞는 이야기가 아직 없어요')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('keeps filter-empty guidance after a successful empty response', () => {
    render(<SorimaruArchiveBrowse stories={[]} isLoading={false} />);
    expect(screen.getByText('조건에 맞는 이야기가 아직 없어요')).toBeTruthy();
    expect(screen.queryByText('잠시 연결이 불안정해요')).toBeNull();
  });
});
