'use client';

import React from 'react';
import styled from '@emotion/styled';
import SharedSectionHeading from '@/shared/components/SectionHeading';

const Heading = styled(SharedSectionHeading)`
  position: relative;
  z-index: 1;
  margin-bottom: 28px;
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
    <Heading
      id={id}
      title={title}
      subtitle={subtitle}
      actionLabel={actionLabel}
      actionHref={actionHref}
    />
  );
}
