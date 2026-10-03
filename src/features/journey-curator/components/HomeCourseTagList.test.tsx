// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HomeCourseTagList } from './HomeCourseTagList';

afterEach(cleanup);

describe('HomeCourseTagList', () => {
  it('renders localized semantic chips within the saved-course budget', () => {
    render(
      <HomeCourseTagList
        category="HANOK_EXPERIENCE"
        tags={['#한옥 체험', '#공예', '#전통', '#가족']}
        savedByMe
      />,
    );

    expect(screen.queryByText('HANOK_EXPERIENCE')).toBeNull();
    expect(screen.getByText('한옥 체험').getAttribute('data-tag-kind')).toBe('category');
    expect(screen.getByText('공예').getAttribute('data-tag-kind')).toBe('content');
    expect(screen.getByText('저장됨').getAttribute('data-tag-kind')).toBe('saved');
    expect(screen.queryByText('#공예')).toBeNull();
    expect(screen.queryByText('전통')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('labels the chip collection for assistive technology', () => {
    render(<HomeCourseTagList category="GARDEN_ECOLOGY" tags={['정원']} />);

    expect(screen.getByRole('list', { name: '코스 태그' })).toBeTruthy();
    expect(screen.getByText('정원 생태')).toBeTruthy();
  });
});
