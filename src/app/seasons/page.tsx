import type { Metadata } from 'next';
import { getHanokYearSnapshot } from '@/features/hanok-year/infrastructure/hanokYearSnapshot';
import { buildSeasonsGuide, SEASON_PLACE_IDS } from '@/features/seasons/application/buildSeasonsGuide';
import { getSeasonPlaceDetails } from '@/features/seasons/infrastructure/getSeasonPlaceDetails';
import { getNearbySeasonPlaces } from '@/features/seasons/infrastructure/getNearbySeasonPlaces';
import SeasonsLanding from '@/features/seasons/presentation/SeasonsLanding';

export const metadata: Metadata = {
  title: '한옥의 사계 — 온마루',
  description: '봄·여름·가을·겨울, 한옥이 계절을 만나는 장면과 실제 한옥 장소를 따라 걷습니다.',
  openGraph: { title: '한옥의 사계 | Onmaru', description: '지금의 계절에서 시작해 네 계절의 한옥을 걷는 온마루의 여행.', type: 'website' },
};


export default function JournalRoute() {
  const snapshot = getHanokYearSnapshot();
  const month = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'numeric' }).format(new Date()));

  // Render immediately with snapshot data (0ms latency, zero Next.js loading screen flash)
  // This guarantees seamless View Transition / Shared Element Transition from /hanok
  const scenes = buildSeasonsGuide({
    month,
    villages: snapshot.villages,
    snapshotAt: snapshot.meta.generatedAt,
  });

  return <SeasonsLanding scenes={scenes} />;
}

