import styled from '@emotion/styled';

import { fontSize, meok, palette, surface } from '@/design-system/tokens';
import { buildHomeCourseTags, type HomeCourseTag } from '../presentation/homeCourseTags';

type HomeCourseTagListProps = {
  category?: string | null;
  tags?: string[] | null;
  savedByMe?: boolean;
};

const TagList = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
`;

const Tag = styled.span<{ $kind: HomeCourseTag['kind'] }>`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ $kind }) => ($kind === 'category' ? palette.juhong[50] : '#f5f5f4')};
  color: ${({ $kind }) => ($kind === 'category' ? palette.juhong[700] : meok[600])};
  font-size: ${fontSize.xs};
  font-weight: ${({ $kind }) => ($kind === 'category' ? 600 : 500)};
  line-height: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;

  &[data-tag-kind='category'] {
    flex-shrink: 0;
  }

  [data-theme='dark'] & {
    background: ${({ $kind }) => ($kind === 'category' ? palette.juhong[950] : surface.dark.card)};
    color: ${({ $kind }) => ($kind === 'category' ? palette.juhong[200] : meok[300])};
  }
`;

export function HomeCourseTagList(props: HomeCourseTagListProps) {
  const displayTags = buildHomeCourseTags(props);

  return (
    <TagList role="list" aria-label="코스 태그">
      {displayTags.map((tag) => (
        <Tag
          key={`${tag.kind}-${tag.label}`}
          role="listitem"
          data-tag-kind={tag.kind}
          $kind={tag.kind}
        >
          {tag.label}
        </Tag>
      ))}
    </TagList>
  );
}
