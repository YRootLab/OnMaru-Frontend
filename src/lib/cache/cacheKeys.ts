export const TTL_MS = {
  HOME_CURATED: 60 * 60_000,        // 1시간
  HOME_POPULAR: 10 * 60_000,        // 10분
  HANOK_ARCHIVE: 12 * 60 * 60_000,  // 12시간
  SORIMARU_BASE: 6 * 60 * 60_000,   // 6시간
  SORIMARU_SEARCH: 30 * 60_000,     // 30분
  SORIMARU_NEARBY: 60_000,          // 1분
} as const;

function normQ(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

function roundCoord(v: number): number {
  return Math.round(v * 100) / 100;
}

export const CK = {
  homeCuratedCourses: (category?: string) =>
    `home:curated-courses:${category ?? ''}`,
  homeTrendingSounds: (lang = 'ko-KR') =>
    `home:trending-sounds:${lang}`,
  homePopularSounds: (window = 'week', lang = 'ko-KR') =>
    `home:popular-sounds:${window}:${lang}`,
  homePopularRegions: (lang = 'ko-KR') =>
    `home:popular-regions:${lang}`,
  hanokArchive: () =>
    'hanok:archive',
  sorimaruStories: (category: string, keyword: string, page: number, rows: number, lang = 'ko-KR') =>
    `sorimaru:stories:${category}:${normQ(keyword)}:${page}:${rows}:${lang}`,
  sorimaruNearby: (lat: number, lng: number) =>
    `sorimaru:nearby:${roundCoord(lat)}:${roundCoord(lng)}`,
} as const;
