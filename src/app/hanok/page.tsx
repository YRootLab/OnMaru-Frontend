import HanokViewerLayout from '@/features/hanok-viewer/HanokViewerLayout';
import HeroSection from '@/features/hanok-viewer/components/sections/HeroSection';
import AssemblySection from '@/features/hanok-viewer/components/sections/AssemblySection';

export const metadata = {
  title: '온마루 — 전통 한옥 공간 스토리텔링 🇰🇷',
  description: '전통 한옥의 구조와 지혜를 담은 하이엔드 7단 스크롤리텔링',
};

export default function HanokPage() {
  return (
    <HanokViewerLayout>
      <HeroSection />
      <AssemblySection />
    </HanokViewerLayout>
  );
}
