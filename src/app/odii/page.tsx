import { OdiiAudioFeature } from '@/features/odii-audio/components/OdiiAudioFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '마음 여행 — 오디(Odii) 오디오 도슨트 | 온마루',
  description: '한국관광공사의 오디 오디오 가이드와 온마루의 고품격 한옥 서사, 한국의 정(情)과 온기를 만나는 미디엄 스크롤리텔링 서비스입니다.',
};

export default function OdiiPage() {
  return <OdiiAudioFeature />;
}
