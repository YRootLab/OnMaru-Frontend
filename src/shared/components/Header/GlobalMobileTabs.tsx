'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { Home, BookOpen, Map, Headphones, User } from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { lightPalette, fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '@/features/journey-curator/store/useJourneyStore';
import { useAuth } from '@/features/auth';

interface TabProps {
  $isLanding?: boolean;
  $isSoriMaru?: boolean;
  $isActive?: boolean;
}

const Nav = styled.nav`
  width: 100%;
  height: 100%;
  display: grid;

  grid-template-columns: repeat(5, 1fr);
  align-items: stretch;
`;

const TabLink = styled(Link, transientProps)<TabProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  margin: 4px 6px;
  border-radius: 12px;
  color: ${({ $isLanding, $isActive }) => {
    if ($isActive) return $isLanding ? '#f8e6bd' : lightPalette.juhong[700];
    return $isLanding ? 'rgba(250, 250, 250, 0.68)' : 'rgba(33, 30, 25, 0.68)';
  }};
  background-color: ${({ $isActive, $isLanding }) => {
    if (!$isActive) return 'transparent';
    return $isLanding ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.05)';
  }};
  border: 1px solid ${({ $isActive, $isLanding }) => {
    if (!$isActive) return 'transparent';
    return $isLanding ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.06)';
  }};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: ${fontSize.micro};
  font-weight: ${({ $isActive }) => ($isActive ? 700 : 400)};
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, transform 180ms ease;

  &:active {
    transform: scale(0.94);
  }

  [data-theme='dark'] & {
    color: ${({ $isLanding, $isActive }) => {
      if ($isActive) return '#f8e6bd';
      return 'rgba(250, 250, 250, 0.68)';
    }};
    background-color: ${({ $isActive }) =>
      $isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
    border-color: ${({ $isActive }) =>
      $isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent'};
  }
`;


export default function GlobalMobileTabs({ isLanding }: { isLanding: boolean }) {
  const pathname = usePathname();
  const resetJourney = useJourneyStore((s) => s.resetJourney);
  const { isLoggedIn } = useAuth();
  const isSoriMaruPage = pathname.startsWith('/sorimaru');

  const tabs = [
    { href: '/', label: '홈', icon: Home, active: pathname === '/' },
    { href: '/hanok', label: '한옥 이야기', icon: BookOpen, active: pathname.startsWith('/hanok') },
    { href: '/sorimaru', label: '소리마루', icon: Headphones, active: isSoriMaruPage },
    { href: '/map', label: '지도', icon: Map, active: pathname.startsWith('/map') },
    {
      href: isLoggedIn ? '/mypage' : '/auth/login',
      label: isLoggedIn ? '나의 마루' : '로그인',
      icon: User,
      active: pathname.startsWith('/mypage') || pathname.startsWith('/auth/login')
    },
  ];

  return (
    <Nav aria-label="주요 탐색">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isSelected = tab.active;
        return (
          <TabLink
            key={tab.href}
            href={tab.href}
            $isLanding={isLanding}
            $isSoriMaru={isSoriMaruPage}$isActive={isSelected}
            onClick={tab.href === '/' ? resetJourney : undefined}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
              <span>{tab.label}</span>
            </span>
          </TabLink>
        );
      })}
    </Nav>
  );
}