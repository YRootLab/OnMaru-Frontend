import type { Metadata } from 'next';
import { SorimaruAudioFeature } from '@/features/sorimaru-audio/components/SorimaruAudioFeature';

export const metadata: Metadata = {
  title: '소리마루 배경 시안 4 — 소리가 머무는 온마루 | 온마루',
  description: '한지, 환대의 빛, 창호와 뜰 그림자, 정이 모이는 온기를 엮은 소리마루 배경 시안입니다.',
};

export default function SorimaruBackgroundVersionFourPage() {
  return <SorimaruAudioFeature backgroundVariant="onmaru-signature" />;
}
