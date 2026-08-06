'use client';

import React from 'react';
import styled from '@emotion/styled';
import { meok, lightPalette } from '@/design-system/tokens';

const Wrapper = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(20px, 2.4vw, 28px);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: ${meok[900]};
  margin: 0;
  line-height: 1.25;
  flex-shrink: 0;
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
  font-size: 13.5px;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.5;
  text-align: right;
`;

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: ${lightPalette.kobalt[500]};
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.18s ease;

  &:hover {
    color: ${lightPalette.kobalt[700]};
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
