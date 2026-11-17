import type { Metadata } from 'next';
import { Suspense } from 'react';
import JourneyChatPage from '@/features/journey-curator/presentation/JourneyChatPage';

export const metadata: Metadata = {
  title: 'AI 여정 대화 — 온마루',
  description: '조건을 말해 주시면 사진과 장소를 보며 함께 나만의 한옥 여정을 만들어 가요.',
};

export default function JourneyRoute() {
  return (
    <Suspense fallback={null}>
      <JourneyChatPage />
    </Suspense>
  );
}
