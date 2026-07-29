'use client';

import React from 'react';
import HanokViewerLayout from './HanokViewerLayout';
import IntroSection from './components/sections/IntroSection';
import HeroSection from './components/sections/HeroSection';
import AssemblySection from './components/sections/AssemblySection';
import AboutHanokSection from './components/sections/AboutHanokSection';

export default function HanokViewerApp() {
  return (
    <HanokViewerLayout>
      <IntroSection />
      <HeroSection />
      <AssemblySection />
      <AboutHanokSection />
    </HanokViewerLayout>
  );
}
