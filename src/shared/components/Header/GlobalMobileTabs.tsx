'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { Home, BookOpen, Map, Headphones } from 'lucide-react';
import { transientProps } from '@/design-system/styled';
import { lightPalette } from '@/design-system/tokens';

interface TabProps {
  $isLanding?: boolean;
  $isSoriMaru?: boolean;
  $isSorimaru?: boolean;
  $isActive?: boolean;
}

const Nav = styled.nav`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: stretch;
`;

const TabLink = styled(Link, transientProps)<TabProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  color: ${({ $isLanding, $isSoriMaru, $isSorimaru, $isActive }) => {
    if ($isActive && ($isSoriMaru || $isSorimaru)) return lightPalette.jangmi[500];
    if ($isActive) return $isLanding ? '#f8e6bd' : lightPalette.juhong[700];
    return $isLanding ? 'rgba(250, 250, 250, 0.68)' : 'rgba(33, 30, 25, 0.68)';
  }};
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  font-size: 10px;
  /* 10px에선 500과 400이 구분되지 않는다. 활성 탭만 bold로 갈라 준다 */
  font-weight: ${({ $isActive }) => ($isActive ? 700 : 400)};
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: color 180ms ease, transform 180ms ease;

  &:active {
    transform: scale(0.94);
  }
`;

/** 사이트 공통 하단 탭 (홈 / 한옥 마루 / 지도 / 소리마루) — Header의 데스크톱 GNB를 모바일 폭에서 대체한다. */
export default function GlobalMobileTabs({ isLanding }: { isLanding: boolean }) {
  const pathname = usePathname();
  const isSoriMaruPage = pathname.startsWith('/sorimaru') || pathname.startsWith('/sorimaru');

  return (
    <Nav aria-label="주요 탐색">
      <TabLink href="/" $isLanding={isLanding} $isActive={pathname === '/'}>
        <Home size={19} strokeWidth={2} aria-hidden="true" />
        <span>홈</span>
      </TabLink>
      <TabLink href="/hanok" $isLanding={isLanding} $isActive={pathname.startsWith('/hanok')}>
        <BookOpen size={19} strokeWidth={2} aria-hidden="true" />
        <span>한옥 마루</span>
      </TabLink>
      <TabLink href="/map" $isLanding={isLanding} $isActive={pathname.startsWith('/map')}>
        <Map size={19} strokeWidth={2} aria-hidden="true" />
        <span>지도</span>
      </TabLink>
      <TabLink href="/sorimaru" $isLanding={isLanding} $isSoriMaru $isActive={isSoriMaruPage}>
        <Headphones size={19} strokeWidth={2} aria-hidden="true" />
        <span>소리마루</span>
      </TabLink>
    </Nav>
  );
}
