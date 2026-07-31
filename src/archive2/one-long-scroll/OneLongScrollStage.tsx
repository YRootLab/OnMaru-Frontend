'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useOneLongScroll } from './hooks/useOneLongScroll';
import { subscribeScrollProgress } from './store/scrollProgress';
import { initBackgroundSystem } from '@/archive2/components/BackgroundSystem';
import ProgressOverlay from './components/ProgressOverlay';
import ScrollTrack from './components/ScrollTrack';

// three는 SSR이 불가능하므로 클라이언트에서만 올린다.
const FixedBackgroundCanvas = dynamic(() => import('./components/canvas/FixedBackgroundCanvas'), {
  ssr: false,
});

interface OneLongScrollStageProps {
  /** 본문 섹션. 없으면 테스트용 빈 패널로 스크롤 길이만 만든다. */
  children?: React.ReactNode;
}

/**
 * One Long Scroll 기반 구조.
 *
 * 페이지 전체가 하나의 스크롤 구간이고, 배경(body 그라데이션 + fixed 3D 캔버스)은
 * 고정된 채 진행도(scrollProgress)만 받아 변한다. 본문은 그 위를 지나가는 투명한 레이어다.
 *
 * 레이어 순서 (뒤 → 앞)
 *   body 그라데이션  … BackgroundSystem이 그린다 (루트 캔버스로 전파)
 *   3D 캔버스        … position: fixed / z-index: -1 / 알파
 *   본문 트랙        … 일반 흐름
 *   오버레이 텍스트  … z-index: 10 / pointer-events: none
 */
export default function OneLongScrollStage({ children }: OneLongScrollStageProps) {
  // 페이지 전체를 덮는 ScrollTrigger 하나가 진행도의 단일 출처다.
  // 배경 시스템은 여기서 나온 값을 구독만 하므로 트리거가 중복되지 않는다.
  useOneLongScroll({ debug: false });

  useEffect(() => initBackgroundSystem({ subscribe: subscribeScrollProgress }), []);

  return (
    <>
      {/* 1. 고정 배경 캔버스 (fixed / 100vh / z-index: -1) */}
      <FixedBackgroundCanvas />

      {/* 2. 본문 — 스크롤 길이를 만드는 투명 트랙 */}
      <ScrollTrack>{children}</ScrollTrack>

      {/* 3. 진행도 오버레이 텍스트 (pointer-events: none) */}
      <ProgressOverlay />
    </>
  );
}
