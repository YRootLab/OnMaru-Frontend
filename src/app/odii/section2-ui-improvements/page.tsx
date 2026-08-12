import type { Metadata } from 'next';
import { Section2UiImprovements } from '@/features/odii-audio/section2-study/Section2UiImprovements';

export const metadata: Metadata = {
  title: 'Section 2 UI Improvements — 온마루',
  description: '장면을 골라 듣다 섹션의 네 가지 카드 UI 비교 시안.',
};

export default function Section2UiImprovementsPage() {
  return <Section2UiImprovements />;
}
