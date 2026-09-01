import type { Warmth, WarmthCell, WarmthFilter } from '../types';
import { seedWarmth } from './seed';

const STORAGE_KEY = 'onmaru.warmth.v1';

// ponytail: 저장소는 localStorage 하나. 계정/공유가 필요해지면 이 파일의
// read/append 두 함수만 Supabase(warmth 테이블)로 갈아끼우면 된다.
function readLocal(): Warmth[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Warmth[]) : [];
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

/** 씨앗 + 내가 남긴 온기. 최신순. */
export function loadWarmth(): Warmth[] {
  return [...readLocal(), ...seedWarmth()].sort((a, b) =>
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

const DAY = 86_400_000;

export function filterWarmth(list: Warmth[], filter: WarmthFilter): Warmth[] {
  switch (filter) {
    case 'busy':
      return list.filter((w) => w.mood === '북적');
    case 'quiet':
      return list.filter((w) => w.mood === '한적');
    case 'today':
      return list.filter((w) => Date.now() - Date.parse(w.createdAt) < DAY);
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
  }));
}
