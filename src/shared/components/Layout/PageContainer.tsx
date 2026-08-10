'use client';

import React from 'react';
import styled from '@emotion/styled';
import type { OnmaruTheme } from '@/design-system/tokens';

const StyledPageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 66px; /* 플로팅 고정 헤더(상단 여백 포함)와 콘텐츠가 겹치지 않도록 확보 */
  padding-left: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.lg || '75px'};
  padding-right: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.lg || '75px'};

  @media (max-width: 1279px) {
    padding-left: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.md || '16px'};
    padding-right: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.md || '16px'};
  }

  @media (max-width: 767px) {
    padding-top: 0;
    padding-bottom: calc(88px + env(safe-area-inset-bottom));
  }
`;

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return <StyledPageContainer>{children}</StyledPageContainer>;
}
