import type { Warmth, WarmthCell, WarmthFilter, WarmthReview } from '@/map/types';
import { seedWarmth } from './seed';

const STORAGE_KEY = 'onmaru.warmth.v1';
const HELPFUL_KEY = 'onmaru.warmth.helpful.v1';

// ponytail: 저장소는 localStorage 하나. 계정/공유가 필요해지면 이 파일의
// read/append 두 함수만 Supabase(warmth 테이블)로 갈아끼우면 된다.
function readLocal(): Warmth[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as Warmth[]) : [];
    return list.filter((w) => !w.id.startsWith('visitor-'));
  } catch {
    return [];
  }
}

function writeLocal(list: Warmth[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 사파리 프라이빗 모드 등. 저장만 실패하고 화면은 계속 돈다.
  }
}

/** 씨앗 + API 온기 + 내가 남긴 온기. 최신순. */
export function loadWarmth(apiWarmths?: Warmth[]): Warmth[] {
  const local = readLocal();
  const base = apiWarmths && apiWarmths.length > 0 ? apiWarmths : seedWarmth();
  const map = new Map<string, Warmth>();
  for (const w of base) {
    map.set(w.id, w);
  }
  for (const w of local) {
    map.set(w.id, w);
  }
  return Array.from(map.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function addWarmth(input: Omit<Warmth, 'id' | 'createdAt' | 'mine'>): Warmth {
  const created: Warmth = {
    ...input,
    id: `me-${Date.now()}`,
    createdAt: new Date().toISOString(),
    mine: true,
  };
  writeLocal([created, ...readLocal()]);
  return created;
}

// ─────────────────────────────────────────
// 도움돼요
//
// 서버가 없으므로 이 브라우저에서 누른 것만 센다.
// 예전에는 순위 인덱스로 숫자를 지어냈다(95, 89, 83…). 지금은 실제로 누른 수만 센다.
// ─────────────────────────────────────────

function readHelpful(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HELPFUL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function isHelpful(warmthId: string): boolean {
  return readHelpful()[warmthId] === true;
}

export function toggleHelpful(warmthId: string): boolean {
  const map = readHelpful();
  const next = !map[warmthId];

  if (next) map[warmthId] = true;
  else delete map[warmthId];

  try {
    window.localStorage.setItem(HELPFUL_KEY, JSON.stringify(map));
  } catch {
    /* 저장 실패는 화면 동작을 막지 않는다 */
  }

  return next;
}

const DAY = 86_400_000;

/**
 * 온기 필터.
 *
 * 여기 없는 id는 전부 '전체'로 떨어진다. 예전에는 칩에만 있고 여기 없는 'review'가
 * 아무 일도 하지 않는 칩으로 남아 있었다 — 지금은 칩 목록과 이 switch가 1:1이다.
 */
export function filterWarmth(list: Warmth[], filter: WarmthFilter): Warmth[] {
  switch (filter) {
    case 'busy':
      return list.filter((w) => w.mood === '북적');
    case 'quiet':
      return list.filter((w) => w.mood === '한적');
    case 'today':
      return list.filter((w) => Date.now() - Date.parse(w.createdAt) < DAY);
    case 'mine':
      return list.filter((w) => w.mine === true);
    default:
      return list;
  }
}

/**
 * 줌 레벨에 맞춘 격자 크기(도). 레벨이 한 단계 오를 때마다 화면 축척이 대략 두 배가
 * 되므로 셀도 두 배로 키운다 — 그래야 blob 개수가 화면에서 일정하게 유지된다.
 */
function cellSize(level: number): number {
  return 0.0015 * 2 ** Math.max(0, level - 3);
}

/** 온기를 격자로 묶어 blob 하나당 한 셀을 만든다. */
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
    // items는 loadWarmth가 최신순으로 넘겨준 순서를 유지한다.
    latest: items[0],
    items,
  }));
}

// ─────────────────────────────────────────
// 피드용 변환
//
// 지도(말풍선·히트맵)와 왼쪽 피드가 서로 다른 데이터를 보던 것을 여기서 합친다.
// 피드 카드가 필요로 하는 모양은 Warmth에서 전부 유도할 수 있다 — 지어내지 않는다.
// ─────────────────────────────────────────

/** 좌표로 광역 지역을 되짚는다. 지도 칩(전주·안동·…)과 같은 이름을 쓴다. */
const REGION_ANCHORS: { name: string; lat: number; lng: number }[] = [
  { name: '서울', lat: 37.5826, lng: 126.9832 },
  { name: '전주', lat: 35.8156, lng: 127.15 },
  { name: '안동', lat: 36.5391, lng: 128.5175 },
  { name: '경주', lat: 35.832, lng: 129.216 },
  { name: '담양', lat: 35.28, lng: 126.995 },
  { name: '강릉', lat: 37.783, lng: 128.882 },
  { name: '제주', lat: 33.386, lng: 126.802 },
  { name: '아산', lat: 36.736, lng: 126.935 },
  { name: '논산', lat: 36.205, lng: 127.09 },
  { name: '순천', lat: 34.907, lng: 127.34 },
];

/** 가장 가까운 기준점의 이름. 80km를 넘으면 지역을 단정하지 않는다. */
export function regionOf(lat: number, lng: number): string {
  let best = { name: '', d: Infinity };

  for (const anchor of REGION_ANCHORS) {
    // 지역 판정은 대략적인 근접도면 충분하다 (도 단위 제곱거리).
    const d = (anchor.lat - lat) ** 2 + (anchor.lng - lng) ** 2;
    if (d < best.d) best = { name: anchor.name, d };
  }

  return best.d <= 0.55 ? best.name : '';
}

/** '북적'/'한적'을 카드가 쓰는 5단계 눈금으로 옮긴다. */
const MOOD_SCALE: Record<Warmth['mood'], 1 | 2 | 3 | 4 | 5> = { 한적: 2, 북적: 4 };

const SEASON_BY_MONTH: WarmthReview['season'][] = [
  '겨울', '겨울', '봄', '봄', '봄', '여름',
  '여름', '여름', '가을', '가을', '가을', '겨울',
];

/**
 * Warmth 한 건을 피드 카드가 읽는 모양으로 옮긴다.
 *
 * 없는 값은 만들지 않는다 — placeType/badTags처럼 원본에 없는 항목은 비워 둔다.
 * 카드가 비어 있는 항목을 그리지 않도록 되어 있으므로 화면에는 사실만 남는다.
 */
export function toReview(w: Warmth): WarmthReview {
  const month = new Date(w.createdAt).getMonth();

  return {
    id: w.id,
    placeId: w.placeId,
    placeName: w.placeName,
    placeRegion: regionOf(w.lat, w.lng),
    placeType: '',
    mood: w.score ?? MOOD_SCALE[w.mood],
    season: SEASON_BY_MONTH[Number.isNaN(month) ? 0 : month],
    goodTags: w.tags ?? [],
    goodText: w.text,
    badTags: [],
    createdAt: w.createdAt,
    helpfulCount: isHelpful(w.id) ? 1 : 0,
    isHelpful: isHelpful(w.id),
    mine: w.mine,
  };
}

/** 장소별 온기 개수. 피드의 '온기가 많이 쌓인 곳'이 이 집계를 쓴다. */
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
