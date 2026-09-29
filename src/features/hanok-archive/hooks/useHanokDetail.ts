import { useEffect, useState } from 'react';
import type { Village, VillageDetailResponse } from '@/features/hanok-archive/types';

const detailCache = new Map<string, VillageDetailResponse>();

export function useHanokDetail(village: Village) {
  const cached = detailCache.get(village.id);
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(cached ?? null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(!cached);

  useEffect(() => {
    if (detailCache.has(village.id)) return;
    let isMounted = true;

    fetch(`/api/tourapi/detail?id=${encodeURIComponent(village.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: VillageDetailResponse) => {
        detailCache.set(village.id, data);
        if (isMounted) {
          setDetailData(data);
          setIsLoadingOverview(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDetailData(null);
          setIsLoadingOverview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [village.id]);

  return { detailData, isLoadingOverview };
}
