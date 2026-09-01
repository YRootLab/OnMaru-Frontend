'use client';

import React from 'react';
import styled from '@emotion/styled';
import { lightPalette } from '@/design-system/tokens';

interface TagGroupProps {
  tags: string[];
  type?: 'good' | 'bad';
}

const Wrapper = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagBadge = styled.span<{ $type: 'good' | 'bad' }>`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  padding: 3.5px 9px;
  border-radius: 9999px;
  border: none;
  white-space: nowrap;

  background: ${({ $type }) =>
    $type === 'good' ? lightPalette.cheongrok[50] : lightPalette.juhong[50]};
  color: ${({ $type }) =>
    $type === 'good' ? lightPalette.cheongrok[700] : lightPalette.juhong[700]};
`;

export default function TagGroup({ tags, type = 'good' }: TagGroupProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <Wrapper>
      {tags.map((tag, idx) => (
        <TagBadge key={idx} $type={type}>
          #{tag}
        </TagBadge>
      ))}
    </Wrapper>
  );
}
