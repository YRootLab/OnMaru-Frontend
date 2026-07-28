'use client';

import React from 'react';
import HanokViewerLayout from './HanokViewerLayout';
import HeroSection from './components/sections/HeroSection';
import AssemblySection from './components/sections/AssemblySection';

export default function HanokViewerApp() {
  return (
    <HanokViewerLayout>
      <HeroSection />
      <AssemblySection />
    </HanokViewerLayout>
  );
}
