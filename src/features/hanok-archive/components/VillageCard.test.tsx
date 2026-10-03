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
});
