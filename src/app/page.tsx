import type { Metadata } from 'next';
import JourneyHome from '@/features/journey-curator/components/JourneyHome';

export const metadata: Metadata = {
  title: '온마루 — 한옥의 온기를 잇다',
  description:
    '기분과 정취를 말하면 한옥 문화재, 공간 오디오, 실시간 온기 지도를 하나의 여정으로 엮어 드립니다.',
};

// 헤더는 app/layout.tsx가 전역으로 렌더하고, 헤더 높이만큼의 여백은 PageContainer가 준다.
export default function Home() {
  return <JourneyHome />;
}
