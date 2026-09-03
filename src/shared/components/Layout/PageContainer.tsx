'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import type { OnmaruTheme } from '@/design-system/tokens';

const StyledPageContainer = styled.div<{ $isFullBleed: boolean }>`
  width: 100%;
  min-height: 100vh;
  padding-top: ${({ $isFullBleed }) => ($isFullBleed ? '0' : '66px')};
  padding-left: ${({ $isFullBleed, theme }) => ($isFullBleed ? '0' : (theme as OnmaruTheme).layout?.margin?.lg || '75px')};
  padding-right: ${({ $isFullBleed, theme }) => ($isFullBleed ? '0' : (theme as OnmaruTheme).layout?.margin?.lg || '75px')};

  @media (max-width: 1279px) {
    padding-left: ${({ $isFullBleed, theme }) => ($isFullBleed ? '0' : (theme as OnmaruTheme).layout?.margin?.md || '16px')};
    padding-right: ${({ $isFullBleed, theme }) => ($isFullBleed ? '0' : (theme as OnmaruTheme).layout?.margin?.md || '16px')};
  }

  @media (max-width: 767px) {
    padding-top: 0;
    padding-bottom: calc(88px + env(safe-area-inset-bottom));
  }
`;

export default function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname.startsWith('/odii') || pathname.startsWith('/map') || pathname === '/';

  return <StyledPageContainer $isFullBleed={isFullBleed}>{children}</StyledPageContainer>;
}
