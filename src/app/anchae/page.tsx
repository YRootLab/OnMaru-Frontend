import AnchaeViewer from '@/archive/components-hanok/AnchaeViewer';

export const metadata = {
  title: '안채 3D 모델 뷰어 (아카이브) | 온마루',
  description: 'public/anchae.glb 모델 뷰어',
};

export default function AnchaePage() {
  return (
    <main style={{ width: '100%', background: '#0e1016' }}>
      <AnchaeViewer />
    </main>
  );
}
