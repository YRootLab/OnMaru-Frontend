'use client';

import React from 'react';
import type { Village } from '@/features/hanok-archive/types';
import HanokDogamDetailModal from './HanokDogamDetailModal';
import HanokStayDetailModal from './HanokStayDetailModal';

export interface VillageDetailModalProps {
  village: Village;
  onClose: () => void;
}

/**
 * 하위 호환성 어댑터 컴포넌트:
 * 한옥스테이인 경우 HanokStayDetailModal(숙박/예약 특화)로,
 * 전통 건축 문화유산인 경우 HanokDogamDetailModal(건축/역사/도슨트 특화)로 분기 렌더링합니다.
 */
export default function VillageDetailModal({ village, onClose }: VillageDetailModalProps) {
  if (village.type === '한옥스테이') {
    return <HanokStayDetailModal stay={village} onClose={onClose} />;
  }
  return <HanokDogamDetailModal village={village} onClose={onClose} />;
}
