import HanokViewerLayout from '@/features/hanok-viewer/HanokViewerLayout';
import HeroSection from '@/features/hanok-viewer/components/sections/HeroSection';
import AboutHanokSection from '@/features/hanok-viewer/components/sections/AboutHanokSection';
import AssemblySection from '@/features/hanok-viewer/components/sections/AssemblySection';

export const metadata = {
  title: '온마루 — 안채 3D 모델 뷰어 🇰🇷',
  description: '한옥 안채 3D GLB 모델 뷰어',
};

export default function Home() {
  return (
    <HanokViewerLayout>
      <HeroSection />
      <AssemblySection />
      <AboutHanokSection />
    </HanokViewerLayout>
  );
}
