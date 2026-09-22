'use client';

import React from 'react';
import type { Village } from '@/features/hanok-archive/types';
import HanokDogamDetailModal from './HanokDogamDetailModal';
import HanokStayDetailModal from './HanokStayDetailModal';

export interface VillageDetailModalProps {
  village: Village;
  onClose: () => void;
}






export default function VillageDetailModal({ village, onClose }: VillageDetailModalProps) {
  if (village.type === '한옥스테이') {
    return <HanokStayDetailModal stay={village} onClose={onClose} />;
  }
  return <HanokDogamDetailModal village={village} onClose={onClose} />;
}
