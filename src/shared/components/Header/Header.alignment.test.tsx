// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/design-system/ThemeProvider', () => ({ useOnmaruTheme: () => ({ theme: 'light' }) }));
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { displayName: '잔잔한 찻잔 8728', characterId: 'CHARACTER_01', backgroundId: 'BACKGROUND_01' },
    isLoggedIn: true,
    isLoading: false,
  }),
}));
vi.mock('@/features/profile/OniAvatar', () => ({ OniAvatar: () => <span data-testid="profile-avatar" /> }));
vi.mock('@/shared/navigation/mapEntranceState', () => ({ useMapEntranceStore: () => vi.fn() }));
vi.mock('@/features/journey-curator/store/useJourneyStore', () => ({ useJourneyStore: () => vi.fn() }));
vi.mock('./GlobalMobileTabs', () => ({
  default: () => null,
  HeadphonesFilledEars: () => <span />,
}));
vi.mock('@/features/map/components/HanokIcon', () => ({ HanokIcon: () => <span /> }));

describe('Header desktop vertical alignment', () => {
  afterEach(cleanup);

  it('centers every navigation icon and label without manual translation', () => {
    render(<Header />);

    const items = screen.getAllByTestId(/^desktop-nav-.*-content$/);
    expect(items).toHaveLength(4);
    items.forEach((item) => {
      expect(getComputedStyle(item).alignItems).toBe('center');
      expect(getComputedStyle(item).transform).toBe('none');
    });

    expect(getComputedStyle(screen.getByTestId('desktop-profile-label')).alignItems).toBe('center');
    expect(getComputedStyle(screen.getByTestId('desktop-profile-label')).transform).toBe('none');
    expect(getComputedStyle(screen.getByTestId('desktop-profile-chevron')).alignItems).toBe('center');
    expect(getComputedStyle(screen.getByTestId('desktop-profile-chevron')).transform).toBe('none');
  });
});
