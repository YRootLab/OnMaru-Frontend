import { SorimaruStoryItem, SorimaruCategory } from '@/features/sorimaru-audio/types/sorimaru.types';

export const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  '한옥/고택': '한옥',
  '서원/향교': '서원',
  '전통시장/장터': '시장',
  '마을/골목길': '마을',
  '궁궐/역사': '궁',
  '사찰/산사': '사찰',
  '소리/문화': '소리',
  '박물관/미술관': '박물관',
  '자연/둘레길': '길',
  '한옥': '한옥',
  '궁': '궁',
  '고택': '고택',
  '북촌': '북촌',
  '전주': '전주',
  '경주': '경주',
  '안동': '안동',
  '서울': '서울',
  '제주': '제주',
  '부산': '부산',
  '대구': '대구',
  '전통시장': '시장',
};

export const KEYWORD_SYNONYMS: Record<string, string[]> = {
  한옥: ['한옥', '고택', '한옥마을', '대청마루'],
  서원: ['서원', '향교', '선비', '서당', '유교'],
  시장: ['시장', '장터', '시전', '전통시장', '장사'],
  사찰: ['사찰', '산사', '절', '사원', '종소리'],
  마을: ['마을', '골목', '한옥마을', '슬로시티'],
};

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const readText = (item: Record<string, unknown>, key: string): string => toText(item[key]);

const readTextList = (item: Record<string, unknown>, key: string): string[] => {
  const value = item[key];
  if (Array.isArray(value)) return value.map(toText).filter(Boolean);

  const text = toText(value);
  return text ? [text] : [];
};

export const isPlayableStory = (story: SorimaruStoryItem): boolean => toText(story.audioUrl).length > 0;

export const matchesKeyword = (story: SorimaruStoryItem, keyword: string): boolean => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const terms = [normalizedKeyword, ...(KEYWORD_SYNONYMS[normalizedKeyword] || [])];
  const searchableText = [
    story.category,
    story.title,
    story.audioTitle,
    story.locationName,
    story.script,
    ...(story.tags ?? []),
  ]
    .map((value) => toText(value).toLowerCase())
    .join(' ');

  return terms.some((term) => searchableText.includes(term.toLowerCase()));
};

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.max(100, Math.round(distanceKm * 1000))}m`;
  return `${distanceKm.toFixed(1)}km`;
}

export function calculateDistanceKm(fromX: string, fromY: string, toX: string, toY: string): number | null {
  const longitude = Number(fromX);
  const latitude = Number(fromY);
  const targetLongitude = Number(toX);
  const targetLatitude = Number(toY);
  if (![longitude, latitude, targetLongitude, targetLatitude].every(Number.isFinite)) return null;

  const earthRadiusKm = 6371;
  const latitudeDelta = (targetLatitude - latitude) * Math.PI / 180;
  const longitudeDelta = (targetLongitude - longitude) * Math.PI / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude * Math.PI / 180) * Math.cos(targetLatitude * Math.PI / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function mapStoryItem(
  item: Record<string, unknown>,
  index: number,
  category?: string,
  origin?: { mapX: string; mapY: string },
): SorimaruStoryItem {
  const title = readText(item, 'title') || readText(item, 'storyTitle') || '한국의 문화 이야기';
  const stid = readText(item, 'stid') || readText(item, 'tid') || String(index + 1);
  const audioUrl = readText(item, 'audioUrl').replace(/^http:\/\//i, 'https://');
  const playTime = readText(item, 'playTime') || '180';
  const playTimeSeconds = Number(playTime);
  const imageUrl = readText(item, 'imageUrl') || readText(item, 'firstimage') || readText(item, 'image');
  const mapX = readText(item, 'mapX') || '126.9780';
  const mapY = readText(item, 'mapY') || '37.5665';
  const distance = origin ? calculateDistanceKm(origin.mapX, origin.mapY, mapX, mapY) : null;

  return {
    tid: readText(item, 'tid'),
    tlid: readText(item, 'tlid'),
    stid,
    stlid: readText(item, 'stlid'),
    title,
    audioTitle: readText(item, 'audioTitle') || readText(item, 'storyTitle') || title || '오디오 해설',
    speaker: '문화해설사 도슨트',
    category: (category && category !== '전체' ? category : '') as SorimaruCategory || readText(item, 'themaCategory') || '소리 이야기',
    distance: distance === null ? undefined : formatDistance(distance),
    mapX,
    mapY,
    script: readText(item, 'script') || '아직 대본이 준비되지 않았어요.',
    playTime,
    formattedDuration: Number.isFinite(playTimeSeconds)
      ? `${Math.floor(playTimeSeconds / 60)}분 ${String(playTimeSeconds % 60).padStart(2, '0')}초`
      : '3분 00초',
    audioUrl,
    imageUrl,
    tags: [
      ...readTextList(item, 'contentTags'),
      ...readTextList(item, 'tags'),
      ...readTextList(item, 'tag'),
      ...readTextList(item, 'themaCategory'),
    ],
    locationName: [readText(item, 'addr1'), readText(item, 'addr2')].filter(Boolean).join(' ') || '대한민국 문화유산',
    badgeText: (category && category !== '전체' && category !== '오디 이야기' && category !== '소리 이야기')
      ? category
      : readText(item, 'themaCategory') || [readText(item, 'addr1'), readText(item, 'addr2')].filter(Boolean).join(' ') || '대한민국 문화유산',
  };
}
