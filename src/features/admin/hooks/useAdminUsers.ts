'use client';

import { useState, useEffect } from 'react';
import type { AdminUser } from '@/features/admin/types';
import { getUsers } from '@/features/admin/api/adminApi';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsers({ limit: 200 })
      .then((r) => {
        if (cancelled) return;
        const raw = r as unknown as Record<string, unknown>;
        const list = (Array.isArray(raw.items) ? raw.items : Array.isArray(raw.content) ? raw.content : []) as AdminUser[];
        setUsers(list);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e as Record<string, unknown>;
        const msg = `${err?.status ?? '?'} ${err?.code ?? ''} — ${err?.message ?? String(e)}`;
        setFetchError(msg);
      });
    return () => { cancelled = true; };
  }, []);

  return { users, setUsers, fetchError };
}
