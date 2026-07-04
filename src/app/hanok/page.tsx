import type { Metadata } from 'next';
import HanokExplorer from '@/components/hanok/HanokExplorer';

export const metadata: Metadata = {
  title: '한옥 A to Z — 공간의 해부학 | 온마루',
  description:
    '한옥의 기와, 기둥, 주춧돌, 온돌, 창호, 대청마루 — 한국 전통 건축의 지혜를 인터랙티브하게 탐험하세요. 온마루가 전하는 한옥 A to Z 스토리텔링.',
};

export default function HanokPage() {
  return <HanokExplorer />;
}
