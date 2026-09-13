import type { Metadata } from 'next';
import { SorimaruFreeformFeature } from '@/features/sorimaru-audio/components/SorimaruFreeformFeature';

export const metadata: Metadata = {
  title: 'Sorimaru Field Notes — 온마루',
  description: '소리를 따라 한국의 장면을 걷는 오디오 여행.',
};

export default function SorimaruFreePage() {
  return <SorimaruFreeformFeature />;
}
