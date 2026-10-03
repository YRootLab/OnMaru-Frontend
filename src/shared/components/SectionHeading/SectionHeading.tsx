'use client';

import React from 'react';
import styled from '@emotion/styled';
import { lightPalette, meok, fontSize } from '@/design-system/tokens';

const Root = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  min-width: 0;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const Title = styled.h2`
  --section-heading-size: clamp(24px, 3.2vw, 36px);
  display: inline-block;
  width: fit-content;
  margin: 0;
  background-image: linear-gradient(to right, #211e19, #403b35, #6a6158);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-family: var(--font-hanok);
  font-size: var(--section-heading-size);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1.2;

  [data-theme='dark'] & {
    background-image: linear-gradient(to right, #ffffff, #d9d9d7, #b0b8c1);
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${meok[500]};
  font-size: ${fontSize.sm};
  line-height: 1.5;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: ${lightPalette.juhong[500]};
  font-size: ${fontSize.xs};
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.18s ease;

  &:hover {
    color: ${lightPalette.juhong[700]};
  }

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};

    &:hover {
      color: ${lightPalette.juhong[200]};
    }
  }
`;

interface SectionHeadingProps {
  id?: string;
  title: string;
  subtitle?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  headingLevel?: 2 | 3;
  className?: string;
}

export default function SectionHeading({
  id,
  title,
  subtitle,
  actionLabel,
  actionHref,
  headingLevel = 2,
  className,
}: SectionHeadingProps) {
  return (
    <Root className={className} data-section-heading="true">
      <Copy>
        <Title as={`h${headingLevel}`} id={id}>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Copy>
      {actionLabel && actionHref && (
        <ActionLink href={actionHref}>{actionLabel}</ActionLink>
      )}
    </Root>
  );
}
