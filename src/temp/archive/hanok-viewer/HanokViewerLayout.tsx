'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { surface } from '@/design-system/tokens';
import { useHanokScroll } from './hooks/useHanokScroll';
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

const ShellContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: ${surface.dark.app};
`;

interface HanokViewerLayoutProps {
  children: React.ReactNode;
}

export function HanokViewerLayout({ children }: HanokViewerLayoutProps) {
  const { containerRef, scrollToStage } = useHanokScroll();
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <ShellContainer ref={containerRef}>
      {/* 3D 메인 캔버스 영역 */}
      <HanokCanvas />

      {/* 하위 UI 섹션 레이아웃 */}
      {children}

      {/* 개발자 조명 및 카메라 패널 영역 */}
      {isDev && <DevCameraHelper onJumpStage={scrollToStage} />}
    </ShellContainer>
  );
}

export default HanokViewerLayout;
