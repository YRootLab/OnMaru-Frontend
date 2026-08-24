import type { Metadata } from 'next';
import { OdiiAudioFeature } from '@/features/odii-audio/components/OdiiAudioFeature';

export const metadata: Metadata = {
  title: '오디 배경 시안 3 — 한지로 이어진 여행 | 온마루',
  description: '한지 기록물과 절제된 종이 깊이로 장소 이야기를 잇는 오디 배경 시안입니다.',
};

export default function OdiiBackgroundVersionThreePage() {
  return <OdiiAudioFeature backgroundVariant="hanji-journey" />;
}
