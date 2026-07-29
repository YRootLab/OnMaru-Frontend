import OneLongScrollStage from '@/features/one-long-scroll/OneLongScrollStage';

export const metadata = {
  title: '온마루 — 한옥의 온기를 잇다',
  description: '페이지 전체를 하나의 긴 스크롤로 경험하는 한옥 스토리텔링',
};

export default function Home() {
  return (
    <main style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* 스크롤 트리거 · 배경 그라데이션 · 고정 캔버스 · 오버레이를 한곳에서 엮는다.
          개별 조각을 여기서 직접 조립하면 initBackgroundSystem 연결이 빠지기 쉽다. */}
      <OneLongScrollStage />
    </main>
  );
}
