// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enMessages from '../../../../../messages/en.json';

function lookupEn(key: string, params?: Record<string, string | number>): string {
  const parts = key.split('.');
  let current: unknown = enMessages.kCulture;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  let text = typeof current === 'string' ? current : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

vi.mock('next-intl', () => ({
  useTranslations: () => lookupEn,
  useLocale: () => 'en',
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/script', () => ({
  default: () => null,
}));

vi.mock('../hooks/useTourApiImage', () => ({
  useTourApiImage: (_id: string, img: string | { url: string } | null | undefined) =>
    typeof img === 'string' ? img : img?.url ?? null,
}));

vi.mock('../hooks/useWorkLocations', () => ({
  useWorkLocations: vi.fn(),
}));

import FeaturedCarousel from './FeaturedCarousel';
import KContentRelationCard from './KContentRelationCard';
import WorkLocationsMapSection from './WorkLocationsMapSection';
import { useWorkLocations } from '../hooks/useWorkLocations';
import type { DiscoveryPlaceSummary, KContentRelation } from '../../domain/types';

const samplePlaces: DiscoveryPlaceSummary[] = [
  {
    placeId: 'p-1',
    name: 'Bukchon Hanok Village',
    region: { code: '1', nameKo: '서울특별시' },
    placeRoles: [{ code: 'VILLAGE', labelKo: '한옥마을' }],
    topics: ['K_DRAMA'],
    placeImage: 'https://example.com/1.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-1',
      workId: 'w-goblin',
      workTitle: 'Goblin',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 2,
    saveAvailable: true,
    savedByMe: false,
  },
  {
    placeId: 'p-2',
    name: 'Jumunjin Breakwater',
    region: { code: '32', nameKo: '강원특별자치도' },
    placeRoles: [],
    topics: ['K_DRAMA'],
    placeImage: 'https://example.com/2.jpg',
    odiiLinked: false,
    featuredRelation: {
      relationId: 'r-2',
      workId: 'w-goblin',
      workTitle: 'Goblin',
      type: 'DRAMA',
      relationType: 'FILMING_LOCATION',
    },
    matchingWorkCount: 1,
    saveAvailable: true,
    savedByMe: false,
  },
];

describe('K-Maru enhancements & localization', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders FeaturedCarousel with localized labels and navigates between slides', () => {
    const onPlaceClick = vi.fn();
    render(<FeaturedCarousel places={samplePlaces} onPlaceClick={onPlaceClick} />);

    expect(screen.getByText('Bukchon Hanok Village')).toBeTruthy();
    expect(screen.getByText('Curated Pick')).toBeTruthy();
    expect(screen.getByText('Seoul')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next featured place' }));
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it('renders enhanced KContentRelationCard with scene context, work link, and expandable evidence', () => {
    const relation: KContentRelation = {
      relationId: 'rel-1',
      relationType: 'FILMING_LOCATION',
      work: {
        workId: 'w-goblin',
        canonicalTitle: '도깨비',
        type: 'DRAMA',
        releaseYear: 2016,
      },
      contextSummary: 'Iconic umbrella walk scene filmed along the stone wall.',
      relationTags: ['autumn', 'stonewall'],
      evidence: [
        {
          sourceTitle: 'Korea Tourism Organization Filming Guide',
          sourceUrl: 'https://example.com/source',
          sourceType: 'OFFICIAL',
          publisherName: 'KTO',
          checkedAt: '2026-01-10T00:00:00Z',
        },
      ],
      evidenceCount: 1,
      verifiedAt: '2026-01-10T00:00:00Z',
    };

    render(<KContentRelationCard relation={relation} />);

    expect(screen.getByText('Scene Context')).toBeTruthy();
    expect(screen.getByText(relation.contextSummary!)).toBeTruthy();
    expect(screen.getByText('Explore work locations').closest('a')?.getAttribute('href')).toBe(
      '/discover/works/w-goblin',
    );

    const toggle = screen.getByRole('button', { name: '1 source references' });
    fireEvent.click(toggle);
    expect(screen.getByText('Korea Tourism Organization Filming Guide')).toBeTruthy();
  });

  it('renders WorkLocationsMapSection with numbered stops and graceful no-coordinate notice', () => {
    vi.mocked(useWorkLocations).mockReturnValue({
      locations: [
        {
          placeId: 'p-1',
          name: 'Deoksugung Stone Wall Road',
          region: { code: '1', nameKo: '서울특별시' },
          placeRoles: [],
          placeImage: null,
          address: '99 Sejong-daero, Jung-gu, Seoul',
          coordinates: null,
          featuredRelation: null,
        },
      ],
      totalCount: 1,
      isLoading: false,
      isError: false,
    });

    render(
      <WorkLocationsMapSection workId="w-goblin" workTitle="Goblin" publicPlaceCount={1} />,
    );

    expect(screen.getByText('Filming Map & Journey')).toBeTruthy();
    expect(screen.getByText('1 stops')).toBeTruthy();
    expect(screen.getByText('Deoksugung Stone Wall Road')).toBeTruthy();
    expect(
      screen.getByText('Coordinates are not yet available. Explore the filming spots below.'),
    ).toBeTruthy();
    expect(screen.getByText('Place details').closest('a')?.getAttribute('href')).toBe(
      '/discover/places/p-1',
    );
  });
});
