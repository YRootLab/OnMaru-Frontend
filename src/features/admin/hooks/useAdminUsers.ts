'use client';

import { useAdminCursorPagination } from './useAdminCursorPagination';
import type { AdminUser } from '@/features/admin/types';
import { getUsers } from '@/features/admin/api/adminApi';

export interface UseAdminUsersOptions {
  status?: string;
  limit?: number;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const { status, limit = 20 } = options;
  return useAdminCursorPagination<AdminUser, { status?: string }>({
    fetchFn: getUsers,
    filters: { status },
    limit,
  });
}
