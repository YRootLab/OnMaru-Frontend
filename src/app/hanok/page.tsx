import HanokViewerApp from '@/features/hanok-viewer/HanokViewerApp';

export const metadata = {
  title: '온마루 — 전통 한옥 공간 스토리텔링 🇰🇷',
  description: '전통 한옥의 구조와 지혜를 담은 하이엔드 7단 스크롤리텔링',
};

export default function HanokPage() {
  return (
    <main style={{ width: '100%', background: '#1C1A17' }}>
      <HanokViewerApp />
    </main>
  );
}
