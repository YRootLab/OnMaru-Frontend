import { useEffect, useRef, useState } from 'react';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { decodeHanokArchivePayload } from '@/features/hanok-archive/data/hanokArchiveFallback';
import { swrFetch } from '@/lib/cache/tabMemoryCache';
import { CK, TTL_MS } from '@/lib/cache/cacheKeys';
import { reconcileArchiveCollection } from '@/features/hanok-archive/domain/reconcileArchiveCollection';

type ArchiveData = { villages: Village[]; meta: VillageMeta };

async function fetchArchive(): Promise<ArchiveData> {
  const response = await fetch('/api/tourapi', { cache: 'no-store' });
  if (!response.ok) throw new Error(`한옥 아카이브 API 오류: ${response.status}`);
  const payload = decodeHanokArchivePayload(await response.json());
  if (!payload) throw new Error('한옥 아카이브 payload 파싱 실패');
  return payload;
}

export function useArchiveData(villages: Village[], meta: VillageMeta) {
  const [archiveData, setArchiveData] = useState<ArchiveData>({ villages, meta });
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    let active = true;

    swrFetch(CK.hanokArchive(), fetchArchive, TTL_MS.HANOK_ARCHIVE, {
      validate: (v) => Array.isArray(v.villages) && v.villages.length > 0,
      onRevalidate: (fresh) => {
        if (active) setArchiveData((current) => reconcileArchiveCollection(current, fresh));
      },
    })
      .then((result) => {
        if (active) setArchiveData((current) => reconcileArchiveCollection(current, result.value));
      })
      .catch(() => {
        // fallback(초기값)으로 유지
      });

    return () => {
      active = false;
    };
  }, []);

  return archiveData;
}
