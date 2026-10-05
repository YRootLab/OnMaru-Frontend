// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HanokArchiveIntroHeading from './HanokArchiveIntroHeading';

afterEach(cleanup);

describe('HanokArchiveIntroHeading', () => {
  it('uses the shared section scale with a primary-color title accent and gray context', () => {
    render(<HanokArchiveIntroHeading total={322} />);

    const kicker = screen.getByText('사라지기 전에 기록한다 · 전국 322곳');
    const title = screen.getByRole('heading', {
      level: 1,
      name: /지금 한옥은 어디에 남아\s있을까?/,
    });
    const accent = screen.getByText('지금 한옥', { exact: true });
    const titleStyle = getComputedStyle(title);

    expect(kicker.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(getComputedStyle(kicker).color).toBe('rgb(139, 149, 161)');
    expect(getComputedStyle(accent).color).toBe('rgb(255, 85, 0)');
    expect(titleStyle.getPropertyValue('--section-heading-size')).toBe('clamp(24px,3.2vw,36px)');
    expect(titleStyle.backgroundImage).toContain('linear-gradient');
  });
});
