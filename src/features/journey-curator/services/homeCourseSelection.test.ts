import { describe, expect, it } from 'vitest';
import type { CuratedCourse } from '../api/homeApi';
import { selectHomeFeaturedCourses } from './homeCourseSelection';

const course = (placeId: string, category: string): CuratedCourse => ({
  placeId,
  category,
  name: placeId,
  regionName: '서울',
  thumbnailUrl: null,
  summary: '',
  tags: [],
  savedByMe: false,
});

describe('selectHomeFeaturedCourses', () => {
  it('keeps verified Hanok experiences and excludes unrelated API results from the home carousel', () => {
    const result = selectHomeFeaturedCourses([
      course('p-tourapi-130903', 'HANOK_EXPERIENCE'),
      course('p-tourapi-unknown', 'HANOK_EXPERIENCE'),
      course('stay-1', 'HANOK_STAY'),
    ]);

    expect(result.map(({ placeId }) => placeId)).toEqual(['p-tourapi-130903', 'stay-1']);
  });

  it('shows more than seven courses and moves missing thumbnails to the right', () => {
    const courses = Array.from({ length: 9 }, (_, index) => course(`hanok-${index}`, 'HANOK'));
    courses[0].thumbnailUrl = null;
    for (const item of courses.slice(1)) item.thumbnailUrl = 'https://example.com/hanok.jpg';

    const result = selectHomeFeaturedCourses(courses);

    expect(result).toHaveLength(9);
    expect(result[0].placeId).toBe('hanok-1');
    expect(result.at(-1)?.placeId).toBe('hanok-0');
  });
});
