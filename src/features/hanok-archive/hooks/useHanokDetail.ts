import { useEffect, useState } from 'react';
import type { Village, VillageDetailResponse } from '@/features/hanok-archive/types';


export function useHanokDetail(village: Village) {
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/tourapi/detail?id=${encodeURIComponent(village.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: VillageDetailResponse) => {
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
  }, [village]);

  return { detailData, isLoadingOverview };
}
