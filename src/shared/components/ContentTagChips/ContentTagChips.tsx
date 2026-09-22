'use client';

import styled from '@emotion/styled';
import { meok, fontSize } from '@/design-system/tokens';







const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  display: inline-block;
  max-width: 200px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.07);
  color: ${meok[600]};
  font-size: ${fontSize.xs};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.07);
    color: ${meok[300]};
  }
`;

export interface ContentTagChipsProps {

  tags?: string[] | null;

  max?: number;
  className?: string;
}

export default function ContentTagChips({ tags, max = 7, className }: ContentTagChipsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <Row className={className} aria-label="자동 추출 콘텐츠 태그">
      {tags.slice(0, max).map((tag) => (
        <Chip key={tag}>#{tag}</Chip>
      ))}
    </Row>
  );
}
