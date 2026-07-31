import HanokViewerLayout from '@/archive/hanok-viewer/HanokViewerLayout';
import HeroSection from '@/archive/hanok-viewer/components/sections/HeroSection';
import AssemblySection from '@/archive/hanok-viewer/components/sections/AssemblySection';

export const metadata = {
  title: '온마루 — 전통 한옥 공간 스토리텔링 🇰🇷 (아카이브)',
  description: '전통 한옥 아카이브 뷰어',
};

export default function HanokPage() {
  return (
    <HanokViewerLayout>
      <HeroSection />
      <AssemblySection />
    </HanokViewerLayout>
  );
}
