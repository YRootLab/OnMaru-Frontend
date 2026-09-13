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
    한옥도감은 본문 배경을 흰색으로 못박아 둔다(위 $background). 다크모드에서 그
    흰색이 그대로 남으면 헤더 여백과 좌우 거터가 본문(Root)만 따로 어두워진 채
    하얗게 떠 보인다 — 이 컨테이너가 본문보다 바깥에 있어 본문의 다크 처리가 못 덮는다.
  */
  [data-theme='dark'] &[data-page-surface='hanok'] {
    background: ${surface.dark.app};
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
