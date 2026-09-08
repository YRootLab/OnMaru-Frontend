'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { transientProps } from '@/design-system/styled';
import { lightPalette } from '@/design-system/tokens';

interface TabProps {
  $isLanding?: boolean;
  $isOdii?: boolean;
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
  color: ${({ $isLanding, $isOdii, $isActive }) => {
    if ($isActive && $isOdii) return lightPalette.jangmi[500];
    if ($isActive) return $isLanding ? '#f8e6bd' : lightPalette.juhong[700];
    return $isLanding ? 'rgba(250, 250, 250, 0.68)' : 'rgba(33, 30, 25, 0.68)';
  }};
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 10px;
  font-weight: ${({ $isActive }) => ($isActive ? 600 : 400)};
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: color 180ms ease, transform 180ms ease;

  &:active {
    transform: scale(0.94);
  }
`;

const TabIcon = styled.svg`
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

/** 사이트 공통 하단 탭 (홈 / 한옥도감 / 지도 / 오디) — Header의 데스크톱 GNB를 모바일 폭에서 대체한다. */
export default function GlobalMobileTabs({ isLanding }: { isLanding: boolean }) {
  const pathname = usePathname();
  const isOdiiPage = pathname.startsWith('/odii');

  return (
    <Nav aria-label="주요 탐색">
      <TabLink href="/" $isLanding={isLanding} $isActive={pathname === '/'}>
        <TabIcon viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-6h6v6" />
        </TabIcon>
        <span>홈</span>
      </TabLink>
      <TabLink href="/hanok" $isLanding={isLanding} $isActive={pathname.startsWith('/hanok')}>
        <TabIcon viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6.5h16" />
          <path d="M6 4h12v16H6z" />
          <path d="M9 10h6M9 14h6" />
        </TabIcon>
        <span>한옥도감</span>
      </TabLink>
      <TabLink href="/map" $isLanding={isLanding} $isActive={pathname.startsWith('/map')}>
        <TabIcon viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
          <path d="M9 3v15M15 6v15" />
        </TabIcon>
        <span>지도</span>
      </TabLink>
      <TabLink href="/odii" $isLanding={isLanding} $isOdii $isActive={isOdiiPage}>
        <TabIcon viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 14v-4M8 18V6M12 15V9M16 20V4M20 14v-4" />
        </TabIcon>
        <span>오디</span>
      </TabLink>
    </Nav>
  );
}
