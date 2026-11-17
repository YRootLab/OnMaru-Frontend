// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `translated:${key}`,
}));

import LiveNoticeBanner from './LiveNoticeBanner';

describe('LiveNoticeBanner', () => {
  it('renders the first localized notice key', () => {
    render(<LiveNoticeBanner />);

    expect(screen.getByText('translated:notice1')).toBeTruthy();
  });
});
