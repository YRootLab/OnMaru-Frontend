import type { CuratedCourse } from '../api/homeApi';

// 운영 API의 HANOK_EXPERIENCE 분류에는 한옥과 무관한 체험 장소도 섞여 있다.
const VERIFIED_HANOK_EXPERIENCE_IDS = new Set([
  'p-tourapi-130903', // 북촌문화센터
  'p-tourapi-1594374', // 전주전통한지원
  'p-tourapi-1594500', // 전주목판서화체험관
]);

export function selectHomeFeaturedCourses(courses: CuratedCourse[]): CuratedCourse[] {
  return courses
    .filter((course) => course.category !== 'HANOK_EXPERIENCE' || VERIFIED_HANOK_EXPERIENCE_IDS.has(course.placeId))
    .sort((a, b) => Number(Boolean(b.thumbnailUrl?.trim())) - Number(Boolean(a.thumbnailUrl?.trim())));
}
