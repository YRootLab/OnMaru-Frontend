import type { Warmth, WarmthCell, WarmthFilter, WarmthReview } from '@/features/map/types';

// Single Source of Truth: 백엔드 API에서만 데이터 로드
// 프론트는 백엔드 응답을 그대로 사용 (필터링, 저장 제거)

export function loadWarmth(apiWarmths?: Warmth[]): Warmth[] {
  // 백엔드에서 받은 데이터를 그대로 반환
  return apiWarmths && apiWarmths.length > 0 ? apiWarmths : [];
}

// addWarmth 는 백엔드 API 호출로 대체
// 예: await apiPost('/api/warmth', { mood, placeId, ... })
// helpful 토글은 백엔드 API로 대체
// 예: await apiPut(`/api/warmth/${warmthId}/helpful`, { helpful: boolean })

export function isHelpful(warmthId: string): boolean {
  // 백엔드 응답의 helpfulCount 또는 isHelpful 필드 사용
  return false;
}

export function toggleHelpful(warmthId: string): boolean {
  // 백엔드 API 호출로 처리
  return false;
}

const DAY = 86_400_000;


// filterWarmth는 백엔드에서 처리
// 프론트는 이미 필터링된 데이터를 받음
// 예: GET /api/warmth?filter=busy&filter=quiet&filter=today





function cellSize(level: number): number {
  return 0.0015 * 2 ** Math.max(0, level - 3);
}


export function clusterWarmth(list: Warmth[], level: number): WarmthCell[] {
  const size = cellSize(level);
  const cells = new Map<string, { sumLat: number; sumLng: number; items: Warmth[] }>();

  for (const w of list) {
    const key = `${Math.floor(w.lat / size)}:${Math.floor(w.lng / size)}`;
    const cell = cells.get(key) ?? { sumLat: 0, sumLng: 0, items: [] };
    cell.sumLat += w.lat;
    cell.sumLng += w.lng;
    cell.items.push(w);
    cells.set(key, cell);
  }

  return Array.from(cells, ([key, { sumLat, sumLng, items }]) => ({
    key,
    lat: sumLat / items.length,
    lng: sumLng / items.length,
    count: items.length,

    latest: items[0],
    items,
  }));
}









const REGION_ANCHORS: { name: string; lat: number; lng: number }[] = [
  { name: '서울', lat: 37.5826, lng: 126.9832 },
  { name: '경기', lat: 37.2636, lng: 127.0286 },
  { name: '인천', lat: 37.4563, lng: 126.7052 },
  { name: '강원', lat: 37.783, lng: 128.882 },
  { name: '대전', lat: 36.3504, lng: 127.3845 },
  { name: '세종', lat: 36.4800, lng: 127.2890 },
  { name: '충북', lat: 36.6424, lng: 127.4890 },
  { name: '충남', lat: 36.736, lng: 126.935 },
  { name: '충남', lat: 36.205, lng: 127.09 },
  { name: '전북', lat: 35.8156, lng: 127.15 },
  { name: '전남광주통합특별시', lat: 35.1595, lng: 126.8526 },
  { name: '전남광주통합특별시', lat: 35.28, lng: 126.995 },
  { name: '전남광주통합특별시', lat: 34.907, lng: 127.34 },
  { name: '대구', lat: 35.8714, lng: 128.6014 },
  { name: '대구', lat: 36.5391, lng: 128.5175 },
  { name: '부산', lat: 35.1796, lng: 129.0756 },
  { name: '부산', lat: 35.832, lng: 129.216 },
  { name: '제주', lat: 33.386, lng: 126.802 },
];


export function regionOf(lat: number, lng: number): string {
  let best = { name: '전북', d: Infinity };

  for (const anchor of REGION_ANCHORS) {
    const d = (anchor.lat - lat) ** 2 + (anchor.lng - lng) ** 2;
    if (d < best.d) best = { name: anchor.name, d };
  }

  return best.d <= 2.5 ? best.name : '전국';
}


const DEFAULT_MOOD_BY_CROWD: Record<Warmth['mood'], 2 | 4> = { 한적: 2, 북적: 4 };

const SEASON_BY_MONTH: WarmthReview['season'][] = [
  '겨울', '겨울', '봄', '봄', '봄', '여름',
  '여름', '여름', '가을', '가을', '가을', '겨울',
];






export function toReview(w: Warmth): WarmthReview {
  const month = new Date(w.createdAt).getMonth();

  return {
    id: w.id,
    placeId: w.placeId,
    placeName: w.placeName,
    placeRegion: regionOf(w.lat, w.lng),
    placeType: '',
    mood: w.score ?? DEFAULT_MOOD_BY_CROWD[w.mood] ?? 2,
    crowdMood: w.mood,
    season: SEASON_BY_MONTH[Number.isNaN(month) ? 0 : month],
    goodTags: w.tags ?? [],
    goodText: w.text,
    badTags: [],
    createdAt: w.createdAt,
    helpfulCount: w.helpfulCount ?? 0,  // 백엔드에서 제공
    isHelpful: w.isHelpful ?? false,    // 백엔드에서 제공
    mine: w.mine,
  };
}


export function countByPlace(list: Warmth[]): Map<string, { name: string; count: number; lat: number; lng: number }> {
  const out = new Map<string, { name: string; count: number; lat: number; lng: number }>();

  for (const w of list) {
    const key = w.placeId || w.placeName;
    const prev = out.get(key);
    if (prev) prev.count += 1;
    else out.set(key, { name: w.placeName, count: 1, lat: w.lat, lng: w.lng });
  }

  return out;
}
