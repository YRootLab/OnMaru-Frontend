'use client';

import React from 'react';
import styled from '@emotion/styled';
import { meok, lightPalette, fluidHeading, fontSize } from '@/design-system/tokens';

const Wrapper = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fluidHeading.section};
  font-weight: 500;
  letter-spacing: -0.022em;
  color: ${meok[900]};
  margin: 0;
  line-height: 1.25;
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
`;

const Subtitle = styled.p`
  font-size: ${fontSize.xs};
  font-weight: 400;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.5;
  text-align: right;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${lightPalette.kobalt[500]};
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.18s ease;

  &:hover {
    color: ${lightPalette.kobalt[700]};
  }

  [data-theme='dark'] & {
    color: ${lightPalette.kobalt[400]};

    &:hover {
      color: ${lightPalette.kobalt[200]};
    }
  }
`;

interface SectionHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function SectionHeader({
  id,
  title,
  subtitle,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <Wrapper>
      <Title id={id}>{title}</Title>
      {(subtitle || (actionLabel && actionHref)) && (
        <RightGroup>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
          {actionLabel && actionHref && (
            <ActionLink href={actionHref}>{actionLabel}</ActionLink>
          )}
        </RightGroup>
      )}
    </Wrapper>
  );
}
