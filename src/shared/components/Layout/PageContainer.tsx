'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { surface, type OnmaruTheme } from '@/design-system/tokens';
import { getPageContainerPresentation } from './pageContainerPresentation';

const StyledPageContainer = styled.div<{ $isFullBleed: boolean; $background: string }>`
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  background: ${({ $background }) => $background};

  /*
    한옥도감은 전용 배경 레이어가 바깥 컨테이너까지 자연스럽게 이어져야 하므로
    다크모드에서는 컨테이너가 별도 표면색을 덮지 않게 둔다.
  */
  [data-theme='dark'] &[data-page-surface='hanok'] {
    background: transparent;
  }

  ${({ $isFullBleed, theme }) =>
    $isFullBleed
      ? css`
          padding: 0;
          margin: 0;
          max-width: none;
        `
      : css`
          max-width: ${(theme as OnmaruTheme).layout?.maxWidth || '1340px'};
          margin: 0 auto;
          padding-top: 66px;
          padding-left: ${(theme as OnmaruTheme).layout?.padding?.lg || '16px'};
          padding-right: ${(theme as OnmaruTheme).layout?.padding?.lg || '16px'};

          @media (max-width: 767px) {
            padding-top: 0;
            padding-bottom: calc(88px + env(safe-area-inset-bottom));
          }
        `}
`;

export default function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const presentation = getPageContainerPresentation(pathname);

  return (
    <StyledPageContainer
      data-page-surface={presentation.surface}
      $isFullBleed={presentation.isFullBleed}
      $background={presentation.background}
    >
      {children}
    </StyledPageContainer>
  );
}
