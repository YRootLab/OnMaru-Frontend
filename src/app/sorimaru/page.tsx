import { Suspense } from 'react';
import { SorimaruAudioFeature } from '@/features/sorimaru-audio/components/SorimaruAudioFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '소리마루 — 한국의 소리와 문화유산 오디오 도슨트 | 온마루',
  description: '한국 문화유산의 숨결과 온기, 고품격 한옥 서사를 들려주는 온마루의 전문 오디오 도슨트 스트리밍 서비스입니다.',
};

export default function SoriMaruPage() {
  return (
    <Suspense fallback={null}>
      <SorimaruAudioFeature backgroundVariant="hanji-journey" />
    </Suspense>
  );
}

