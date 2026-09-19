'use client';

import styled from '@emotion/styled';
import { meok, fontSize } from '@/design-system/tokens';

/*
  이슈 #82 — BE가 설명/대본에서 LLM 없이 자동 추출해 내려주는 contentTags.
  손으로 붙인 기존 badges/tags와는 출처가 다른 정보라 시각적으로도 살짝
  낮은 톤(회색, 클릭 불가)으로 구분한다 — 이 칩은 절대 버튼이 아니다.
*/

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
  /** BE가 중요도순으로 내려주는 값 — # 없이, FE에서 순서를 바꾸지 않는다. */
  tags?: string[] | null;
  /** 상세 화면은 7(기본, BE가 보내는 최대치), 목록/카드는 2~3으로 좁혀 쓴다. */
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
