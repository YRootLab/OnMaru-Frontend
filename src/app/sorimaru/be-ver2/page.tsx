import type { Metadata } from 'next';
import { SorimaruAudioFeature } from '@/features/sorimaru-audio/components/SorimaruAudioFeature';

export const metadata: Metadata = {
  title: '소리마루 배경 시안 2 — 창호 사이 여백 | 온마루',
  description: '문살 그림자와 은은한 입자가 섹션을 따라 움직이는 소리마루 배경 시안입니다.',
};

export default function SorimaruBackgroundVersionTwoPage() {
  return <SorimaruAudioFeature backgroundVariant="changho-breeze" />;
}
