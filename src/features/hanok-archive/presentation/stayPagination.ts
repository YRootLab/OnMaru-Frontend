export const STAYS_PER_PAGE = 7;

export type StayPageDirection = -1 | 1;

export function getStayPageCount(total: number, pageSize = STAYS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getStayPage<T>(
  items: readonly T[],
  page: number,
  pageSize = STAYS_PER_PAGE,
): T[] {
  const safePage = Math.min(
    Math.max(page, 0),
    getStayPageCount(items.length, pageSize) - 1,
  );
  const start = safePage * pageSize;
  return items.slice(start, start + pageSize);
}

export function moveStayPage(
  page: number,
  direction: StayPageDirection,
  pageCount: number,
): number {
  return Math.min(Math.max(page + direction, 0), Math.max(pageCount - 1, 0));
}
