'use client';

import React from 'react';
import styled from '@emotion/styled';
import { lightPalette } from '@/design-system/tokens';

interface TagGroupProps {
  tags: string[];
}

const Wrapper = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagBadge = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 3.5px 9px;
  border-radius: 9999px;
  border: none;
  white-space: nowrap;
  background: ${lightPalette.juhong[50]};
  color: ${lightPalette.juhong[700]};
`;

export default function TagGroup({ tags }: TagGroupProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <Wrapper>
      {tags.map((tag, idx) => (
        <TagBadge key={idx}>
          #{tag.replace(/^#/, '')}
        </TagBadge>
      ))}
    </Wrapper>
  );
}
