import type { Metadata } from 'next';
import Header from '@/shared/components/Header/Header';
import JourneyHeroSearch from '@/features/journey-curator/components/JourneyHeroSearch';
import KnowledgeGraphView from '@/features/journey-curator/components/KnowledgeGraphView';
import BentoJourneyGrid from '@/features/journey-curator/components/BentoJourneyGrid';
import JourneyRefineBar from '@/features/journey-curator/components/JourneyRefineBar';

export const metadata: Metadata = {
  title: 'AI 여정 큐레이터 — 온마루 (OnMaru)',
  description:
    '당신의 기분과 정취에 맞춰 한옥 문화재, 공간 오디오, 실시간 온기 지도를 유기적으로 엮어내는 인공지능 여정 동행자.',
};

export default function DiscoverPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        paddingTop: '74px',
      }}
    >
      <Header />
      <JourneyHeroSearch />
      <KnowledgeGraphView />
      <BentoJourneyGrid />
      <JourneyRefineBar />
    </main>
  );
}
