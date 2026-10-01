import { describe, expect, it } from 'vitest';
import { createAdminRepository } from './adminApi';

describe('Admin API cursor pagination contract tests (#262 / BE #509)', () => {
  it('requests reviews first page without cursor, using default limit 20', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createAdminRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasNext: false };
    }) as never);

    await repository.listReviews();

    expect(calls).toEqual([
      {
        path: '/admin/reviews',
        options: {
          method: 'GET',
          params: { limit: 20 },
        },
      },
    ]);
  });

  it('passes status and query server filters for reviews and clamps limit between 1 and 100', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createAdminRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: 'cursor_abc123', hasNext: true };
    }) as never);

    await repository.listReviews({
      status: 'PUBLISHED',
      query: '북촌 한옥',
      limit: 150, // exceeds 100 -> clamped to 100
    });

    await repository.listReviews({
      status: 'ALL', // ALL -> omitted
      search: '  경기전  ', // whitespace trimmed
      cursor: 'cursor_abc123',
      limit: -5, // below 1 -> clamped to 1
    });

    expect(calls).toEqual([
      {
        path: '/admin/reviews',
        options: {
          method: 'GET',
          params: {
            limit: 100,
            status: 'PUBLISHED',
            query: '북촌 한옥',
          },
        },
      },
      {
        path: '/admin/reviews',
        options: {
          method: 'GET',
          params: {
            limit: 1,
            cursor: 'cursor_abc123',
            query: '경기전',
          },
        },
      },
    ]);
  });

  it('requests reports with reason filter and cursor', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createAdminRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: 'cursor_rep_1', hasNext: true };
    }) as never);

    await repository.listReports({ reason: 'SPAM', limit: 20 });
    await repository.listReports({ reason: 'ALL', cursor: 'cursor_rep_1', limit: 20 });

    expect(calls).toEqual([
      {
        path: '/admin/reports',
        options: {
          method: 'GET',
          params: { limit: 20, reason: 'SPAM' },
        },
      },
      {
        path: '/admin/reports',
        options: {
          method: 'GET',
          params: { limit: 20, cursor: 'cursor_rep_1' },
        },
      },
    ]);
  });

  it('passes status=ACTIVE|DELETING only for users and excludes unsupported client-only params', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createAdminRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasNext: false };
    }) as never);

    // Valid server status
    await repository.listUsers({ status: 'ACTIVE', limit: 20 });
    await repository.listUsers({ status: 'DELETING', cursor: 'cursor_usr', limit: 20 });
    // Client-side only or ALL status should NOT be sent as query param to avoid 400 VALIDATION_ERROR
    await repository.listUsers({ status: 'ALL', search: 'admin', limit: 20 });
    await repository.listUsers({ status: 'SUSPENDED', limit: 20 });

    expect(calls).toEqual([
      {
        path: '/admin/users',
        options: {
          method: 'GET',
          params: { limit: 20, status: 'ACTIVE' },
        },
      },
      {
        path: '/admin/users',
        options: {
          method: 'GET',
          params: { limit: 20, cursor: 'cursor_usr', status: 'DELETING' },
        },
      },
      {
        path: '/admin/users',
        options: {
          method: 'GET',
          params: { limit: 20 },
        },
      },
      {
        path: '/admin/users',
        options: {
          method: 'GET',
          params: { limit: 20 },
        },
      },
    ]);
  });

  it('requests curations with category and included filters', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createAdminRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return { items: [], nextCursor: null, hasNext: false };
    }) as never);

    await repository.listCurations({ category: 'VILLAGE', included: true, limit: 20 });
    await repository.listCurations({ category: 'STAY', included: false, cursor: 'cur_1', limit: 20 });

    expect(calls).toEqual([
      {
        path: '/admin/curations',
        options: {
          method: 'GET',
          params: { limit: 20, category: 'VILLAGE', included: true },
        },
      },
      {
        path: '/admin/curations',
        options: {
          method: 'GET',
          params: { limit: 20, cursor: 'cur_1', category: 'STAY', included: false },
        },
      },
    ]);
  });

  it('requests admin moderation queue and operations moderation queue without filters', async () => {
    const calls: Array<{ path: string; options: unknown }> = [];
    const repository = createAdminRepository((async (path: string, options: unknown) => {
      calls.push({ path, options });
      return {
        schemaVersion: '1.2',
        generatedAt: '2026-10-01T12:00:00Z',
        oldestOpenReportAgeSeconds: 120,
        items: [],
        nextCursor: null,
        hasNext: false,
      };
    }) as never);

    await repository.getModerationQueue({ limit: 20 });
    await repository.getOperationsModerationQueue({ limit: 20, cursor: 'queue_cursor' });

    expect(calls).toEqual([
      {
        path: '/admin/moderation/queue',
        options: {
          method: 'GET',
          params: { limit: 20 },
        },
      },
      {
        path: '/operations/moderation/queue',
        options: {
          method: 'GET',
          params: { limit: 20, cursor: 'queue_cursor' },
        },
      },
    ]);
  });
});
