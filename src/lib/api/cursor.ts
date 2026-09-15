export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function shouldLoadNextPage(page: CursorPage<unknown>): boolean {
  return page.hasMore === true && typeof page.nextCursor === 'string' && page.nextCursor.length > 0;
}
