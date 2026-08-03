/*
  =============================================================
  📢 [안내 / NOTICE] 이 파일은 데모 / 프로토타입 임시 페이지입니다!
  =============================================================
  - 이 페이지는 소리마루(오디 오디오 가이드) 확인용 데모 페이지입니다.
  - 정식 오디오 서비스 개발 시 이 구조에 국한되지 않고 자유롭게 
    기능 확장 및 디자인을 마음껏 꾸미실 수 있습니다! 🇰🇷
  =============================================================
*/

import { OdiiAudioFeature } from '@/features/odii-audio/components/OdiiAudioFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '마음 여행 — 오디(Odii) 오디오 도슨트 | 온마루',
  description: '한국관광공사의 오디 오디오 가이드와 온마루의 고품격 한옥 서사, 한국의 정(情)과 온기를 만나는 미디엄 스크롤리텔링 서비스입니다.',
};

export default function OdiiPage() {
  return <OdiiAudioFeature />;
}
