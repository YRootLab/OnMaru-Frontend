// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Village } from '@/features/hanok-archive/types';
import VillageCard from './VillageCard';

const village: Village = {
  id: 'hanok-1',
  name: '제목이 길어도 두 줄까지 온전히 보이는 오래된 한옥',
  region: '서울',
  addr: '서울특별시 종로구',
  lat: 37.5,
  lng: 127,
  type: 'HANOK',
  badges: [],
  image: 'https://example.com/hanok.jpg',
  hasImage: true,
  summary: '',
  overview: '',
};

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

describe('VillageCard', () => {
  it('groups the Korean category and docent tags in the image top-left tag area', () => {
    render(<VillageCard village={{ ...village, name: '경복궁' }} onClick={vi.fn()} />);

    const tagArea = screen.getByLabelText('한옥 태그');
    expect(tagArea.textContent).toContain('한옥');
    expect(tagArea.textContent).toContain('소리마루 도슨트');
    expect(getComputedStyle(tagArea.children[0]).fontSize).toBe('0.75rem');
    expect(getComputedStyle(tagArea.children[1]).fontSize).toBe('0.75rem');
  });

  it('keeps the complete title available while limiting it to two visual lines', () => {
    render(<VillageCard village={village} onClick={vi.fn()} />);

    const title = screen.getByRole('heading', { level: 3, name: village.name });
    expect(title.textContent).toBe(village.name);
    expect(getComputedStyle(title).webkitLineClamp).toBe('2');
  });

  it('exposes reveal layers and a card target for grid-level pointer lighting', () => {
    render(<VillageCard village={village} onClick={vi.fn()} />);

    const card = screen.getByRole('button', { name: `${village.name} 자세히 보기` });
    expect(card.getAttribute('data-reveal-card')).not.toBeNull();
    expect(screen.getByTestId('village-card-spotlight').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByTestId('village-card-glass-lens').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByTestId('village-card-spotlight-edge').getAttribute('aria-hidden')).toBe('true');
  });

  it('uses theme-tuned white reveals in light and dark modes', () => {
    const { rerender } = render(<VillageCard village={village} onClick={vi.fn()} />);
    const spotlight = screen.getByTestId('village-card-spotlight');
    const lightReveal = getComputedStyle(spotlight).getPropertyValue('--spotlight-background');

    document.documentElement.dataset.theme = 'dark';
    rerender(<VillageCard village={village} onClick={vi.fn()} />);
    const darkReveal = getComputedStyle(spotlight).getPropertyValue('--spotlight-background');

    expect(lightReveal).not.toBe('');
    expect(darkReveal).not.toBe('');
    expect(lightReveal).not.toBe(darkReveal);
  });

  it('keeps the light-mode highlight restrained without a dark contrast wash', () => {
    render(<VillageCard village={village} onClick={vi.fn()} />);
    const spotlight = screen.getByTestId('village-card-spotlight');
    const glassLens = screen.getByTestId('village-card-glass-lens');
    const style = getComputedStyle(spotlight);
    const glassStyle = getComputedStyle(glassLens);

    expect(style.getPropertyValue('--spotlight-core-opacity')).toBe('0.33');
    expect(style.getPropertyValue('--spotlight-core-mid-opacity')).toBe('0.135');
    expect(style.getPropertyValue('--spotlight-color')).toBe('232,237,242');
    expect(style.getPropertyValue('--spotlight-outer-color')).toBe('var(--spotlight-color)');
    expect(style.getPropertyValue('--spotlight-outer-opacity')).toBe('0.06');
    expect(glassStyle.getPropertyValue('--glass-core-opacity')).toBe('0.06');
    expect(glassStyle.getPropertyValue('--glass-mid-opacity')).toBe('0.0225');
    expect(style.getPropertyValue('--spotlight-core-radius')).toBe('150px');
    expect(style.getPropertyValue('--spotlight-outer-radius')).toBe('340px');
    expect(glassStyle.getPropertyValue('--glass-light-radius')).toBe('125px');
    expect(glassStyle.getPropertyValue('--glass-mask-radius')).toBe('140px');
    expect(glassStyle.backdropFilter).toBe('none');
  });

  it('keeps the light reveal edge thin but longer without changing the dark edge', () => {
    const { rerender } = render(<VillageCard village={village} onClick={vi.fn()} />);
    const edge = screen.getByTestId('village-card-spotlight-edge');

    expect(getComputedStyle(edge).getPropertyValue('--spotlight-edge-width')).toBe('1.2px');
    expect(getComputedStyle(edge).getPropertyValue('--spotlight-edge-radius')).toBe('220px');

    document.documentElement.dataset.theme = 'dark';
    rerender(<VillageCard village={village} onClick={vi.fn()} />);

    expect(getComputedStyle(edge).getPropertyValue('--spotlight-edge-width')).toBe('1px');
    expect(getComputedStyle(edge).getPropertyValue('--spotlight-edge-radius')).toBe('190px');
  });
});
