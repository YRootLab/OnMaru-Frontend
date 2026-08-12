import type { Metadata } from 'next';
import { OdiiAudioFeature } from '@/features/odii-audio/components/OdiiAudioFeature';

export const metadata: Metadata = {
  title: '오디 배경 시안 1 — 온기의 결 | 온마루',
  description: '한지의 결, 밝은 빛과 작은 온기점으로 이어지는 오디 배경 시안입니다.',
};

export default function OdiiBackgroundVersionOnePage() {
  return <OdiiAudioFeature backgroundVariant="warmth-grain" />;
}
