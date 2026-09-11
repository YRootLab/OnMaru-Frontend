import type { Metadata } from 'next';
import { SorimaruAudioFeature } from '@/features/sorimaru-audio/components/SorimaruAudioFeature';

export const metadata: Metadata = {
  title: '오디 배경 시안 2 — 창호 사이의 바람 | 온마루',
  description: '밝은 창호와 뜰의 그림자가 섹션을 따라 움직이는 오디 배경 시안입니다.',
};

export default function SorimaruBackgroundVersionTwoPage() {
  return <SorimaruAudioFeature backgroundVariant="changho-breeze" />;
}
