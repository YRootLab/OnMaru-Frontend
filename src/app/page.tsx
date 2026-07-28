import AnchaeViewer from '@/components/hanok/AnchaeViewer';

export const metadata = {
  title: '온마루 — 안채 3D 모델 뷰어 🇰🇷',
  description: '한옥 안채 3D GLB 모델 뷰어',
};

export default function Home() {
  return (
    <main style={{ width: '100%', background: '#1C1A17' }}>
      <AnchaeViewer />
    </main>
  );
}
