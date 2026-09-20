import React from 'react';
import styled from '@emotion/styled';
import { meok , fontSize } from '@/design-system/tokens';

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
  font-size: ${fontSize.xs};
  font-weight: 500;
  padding: 3px 8.5px;
  border-radius: 9999px;
  white-space: nowrap;
  background: rgba(78, 89, 104, 0.07);
  color: ${meok[700]};
  border: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.07);
    color: ${meok[400]};
  }
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
