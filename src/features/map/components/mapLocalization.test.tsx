// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapStore } from '../hooks/useMapStore';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `translated:${key}`,
}));
vi.mock('./feed/LiveNoticeBanner', () => ({ default: () => <div /> }));
vi.mock('./feed/SorimaruSpotlightBanner', () => ({ default: () => <div /> }));
vi.mock('./feed/SmartAroundFeed', () => ({ default: () => <div /> }));

import InfoMapEditorialFeed from './InfoMapEditorialFeed';
import JourneyOverlay from './JourneyOverlay';

describe('map localization', () => {
  beforeEach(() => {
    useMapStore.setState({
      ...useMapStore.getInitialState(),
      journeyPlaces: [{ id: 'one', name: 'Hanok', lat: 37.5665, lng: 126.978 }],
    }, true);
  });

  afterEach(cleanup);

  it('localizes the journey summary and actions', () => {
    render(<JourneyOverlay />);

    expect(screen.getByText('translated:summary')).toBeTruthy();
    expect(screen.getByText('translated:navigate')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'translated:reset' })).toBeTruthy();
  });

  it('localizes the editorial discovery landmark', () => {
    render(
      <InfoMapEditorialFeed
        items={[]}
        onPlaceSelect={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('translated:ariaLabel')).toBeTruthy();
  });
});
