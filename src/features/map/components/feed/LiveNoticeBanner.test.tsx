// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LiveNoticeBanner from './LiveNoticeBanner';

describe('LiveNoticeBanner', () => {
  it('renders the first localized notice key', () => {
    render(<LiveNoticeBanner />);

    expect(screen.getByText('지도에서 전국 한옥 공간과 전통 체험을 찾아보세요')).toBeTruthy();
  });
});
