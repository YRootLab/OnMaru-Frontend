import { useEffect, useState } from 'react';
import type { VillageDetailResponse } from '@/features/hanok-archive/types';

/** 스테이 상세 모달이 여는 순간 TourAPI 상세 설명을 읽어온다. */
export function useStayDetail(stayId: string) {
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/tourapi/detail?id=${encodeURIComponent(stayId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: VillageDetailResponse | null) => {
        if (isMounted && data) setDetailData(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [stayId]);

  return detailData;
}
