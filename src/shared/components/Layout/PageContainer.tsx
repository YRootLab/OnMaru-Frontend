'use client';

import React from 'react';
import styled from '@emotion/styled';
import type { OnmaruTheme } from '@/design-system/tokens';

const StyledPageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 49px; /* 고정 헤더(49px) 높이만큼 상단 여백 확보하여 콘텐츠 잘림 방지 */
  padding-left: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.lg || '75px'};
  padding-right: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.lg || '75px'};

  @media (max-width: 1279px) {
    padding-left: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.md || '16px'};
    padding-right: ${({ theme }) => (theme as OnmaruTheme).layout?.margin?.md || '16px'};
  }
`;

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return <StyledPageContainer>{children}</StyledPageContainer>;
}
