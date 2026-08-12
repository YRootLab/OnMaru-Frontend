import type { Metadata } from 'next';
import { OdiiAudioFeature } from '@/features/odii-audio/components/OdiiAudioFeature';

export const metadata: Metadata = {
  title: '오디 배경 시안 4 — 소리가 머무는 온마루 | 온마루',
  description: '한지, 환대의 빛, 창호와 뜰 그림자, 정이 모이는 온기를 엮은 오디 배경 시안입니다.',
};

export default function OdiiBackgroundVersionFourPage() {
  return <OdiiAudioFeature backgroundVariant="onmaru-signature" />;
}
