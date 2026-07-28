import AnchaeViewer from '@/components/hanok/AnchaeViewer';

export const metadata = {
  title: '안채 3D 모델 뷰어 | 온마루',
  description: 'public/anchae.glb 모델 뷰어',
};

export default function AnchaePage() {
  return (
    // 스크롤리텔링 트랙(700vh)이 잘리지 않도록 높이/overflow를 제한하지 않는다.
    // height:100vh + overflow:hidden 이면 스크롤 자체가 생기지 않아 ScrollTrigger가 발화하지 않음.
    <main style={{ width: '100%', background: '#0e1016' }}>
      <AnchaeViewer />
    </main>
  );
}
