import type { Metadata } from 'next';
import { OdiiFreeformFeature } from '@/features/odii-audio/components/OdiiFreeformFeature';

export const metadata: Metadata = {
  title: 'Odii Field Notes — 온마루',
  description: '소리를 따라 한국의 장면을 걷는 오디오 여행.',
};

export default function OdiiFreePage() {
  return <OdiiFreeformFeature />;
}
