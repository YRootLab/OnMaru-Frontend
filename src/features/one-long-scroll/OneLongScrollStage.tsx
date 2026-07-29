'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Global, css } from '@emotion/react';
import { useOneLongScroll } from './hooks/useOneLongScroll';
import ProgressOverlay from './components/ProgressOverlay';
import ScrollTrack from './components/ScrollTrack';
import { BACKGROUND_START_HEX } from './data/scrollPalette';

// three는 SSR이 불가능하므로 클라이언트에서만 올린다.
const FixedBackgroundCanvas = dynamic(() => import('./components/FixedBackgroundCanvas'), {
  ssr: false,
});

/**
 * z-index: -1 캔버스가 body 배경 뒤로 숨지 않게 하기 위한 최소 규칙.
 *
 * html에 배경이 없으면 body의 배경은 루트 캔버스로 전파되어 음수 z-index 요소보다
 * "아래"에 깔린다. 그래서 캔버스는 정상적으로 보인다. 여기서 색을 시작색과 맞추는 건
 * WebGL 첫 프레임 전에 테마 배경(베이지)이 한 번 번쩍이는 걸 막기 위한 것이다.
 */
const pageStyles = css`
  body {
    background-color: ${BACKGROUND_START_HEX};
  }
`;

interface OneLongScrollStageProps {
  /** 본문 섹션. 없으면 테스트용 빈 패널로 스크롤 길이만 만든다. */
  children?: React.ReactNode;
}

/**
 * One Long Scroll 기반 구조.
 *
 * 페이지 전체가 하나의 스크롤 구간이고, 배경(3D 캔버스)은 fixed로 고정된 채
 * 진행도(scrollProgress)만 받아 변한다. 본문은 그 위를 지나가는 투명한 레이어다.
 */
export default function OneLongScrollStage({ children }: OneLongScrollStageProps) {
  useOneLongScroll();

  return (
    <>
      <Global styles={pageStyles} />

      {/* 1. 고정 배경 캔버스 (fixed / 100vh / z-index: -1) */}
      <FixedBackgroundCanvas />

      {/* 2. 본문 — 스크롤 길이를 만드는 투명 트랙 */}
      <ScrollTrack>{children}</ScrollTrack>

      {/* 3. 진행도 오버레이 텍스트 (pointer-events: none) */}
      <ProgressOverlay />
    </>
  );
}
