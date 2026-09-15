import type { Metadata } from 'next';
import { SorimaruAudioFeature } from '@/features/sorimaru-audio/components/SorimaruAudioFeature';

export const metadata: Metadata = {
  title: '소리마루 배경 시안 1 — 온기의 결 | 온마루',
  description: '한지의 결, 밝은 빛과 작은 온기점으로 이어지는 소리마루 배경 시안입니다.',
};

export default function SorimaruBackgroundVersionOnePage() {
  return <SorimaruAudioFeature backgroundVariant="warmth-grain" />;
}
