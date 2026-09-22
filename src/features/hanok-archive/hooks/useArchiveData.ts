import { useEffect, useRef, useState } from 'react';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { decodeHanokArchivePayload } from '@/features/hanok-archive/data/hanokArchiveFallback';





export function useArchiveData(villages: Village[], meta: VillageMeta) {
  const [archiveData, setArchiveData] = useState(() => ({ villages, meta }));





  const hasSwappedRef = useRef(false);

  useEffect(() => {
    if (hasSwappedRef.current) return undefined;

    let isActive = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    async function refreshArchive() {
      try {
        const response = await fetch('/api/tourapi', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;
        const nextData = decodeHanokArchivePayload(await response.json());
        if (isActive && nextData && !hasSwappedRef.current) {
          hasSwappedRef.current = true;
          setArchiveData(nextData);
        }
      } catch {

      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void refreshArchive();
    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return archiveData;
}
