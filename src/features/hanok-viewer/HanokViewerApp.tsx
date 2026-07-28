'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { surface } from '@/design-system/tokens';
import { useHanokScroll } from './hooks/useHanokScroll';
import AssemblySection from './components/sections/AssemblySection';
import DevCameraHelper from './components/ui/DevCameraHelper';

const HanokCanvas = dynamic(() => import('./components/canvas/HanokCanvas'), {
  ssr: false,
  loading: () => <CanvasLoadingFallback />,
});

const CanvasLoadingFallback = styled.div`
  position: fixed;
  inset: 0;
  background: ${surface.dark.app};
  z-index: 0;
`;

const AppContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: ${surface.dark.app};
`;

export default function HanokViewerApp() {
  const { containerRef, scrollToStage } = useHanokScroll();
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <AppContainer>
      {/* 1. 단일 페이지 고정 Fixed 3D Canvas (GLB 1회만 로드) */}
      <HanokCanvas />

      {/* 2. 스크롤 가능한 HTML UI 섹션 구획들 */}
      <AssemblySection containerRef={containerRef} onJumpStage={scrollToStage} />

      {/* 3. 개발 환경 카메라 도구 패널 */}
      {isDev && <DevCameraHelper onJumpStage={scrollToStage} />}
    </AppContainer>
  );
}
