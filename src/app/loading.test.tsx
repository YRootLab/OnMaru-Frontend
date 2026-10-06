// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Loading from './loading';

vi.mock('@/shared/hooks/useIsAppleDevice', () => ({ useIsAppleDevice: () => true }));

describe('global route loading footprint', () => {
  afterEach(cleanup);

  it('reserves a viewport in document flow so the footer stays below the initial screen', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    expect(getComputedStyle(status).position).not.toBe('fixed');
    expect(getComputedStyle(status).width).toBe('100%');
    expect(getComputedStyle(status).minHeight).toBe('100dvh');
    expect(screen.getByText('페이지 로딩 중')).toBeTruthy();
  });
});
