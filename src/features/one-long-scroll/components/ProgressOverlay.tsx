'use client';

import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { getScrollProgress, subscribeScrollProgress } from '../store/scrollProgress';

interface Marker {
  at: number;
  label: string;
}

/** [테스트용] 진행도 확인 마커. 실제 카피가 정해지면 이 배열만 교체한다. */
const MARKERS: Marker[] = [
  { at: 0.1, label: '10% 진행' },
  { at: 0.5, label: '50% 진행' },
];

const FADE = 0.04; // 페이드 인/아웃에 쓰는 진행도 폭
const HOLD = 0.06; // 완전히 보이는 구간의 폭
const RISE_PX = 16; // 페이드와 함께 올라오는 거리

/**
 * (at - FADE) 부터 떠올라 at 에서 완전히 보이고,
 * (at + HOLD) 부터 사라져 (at + HOLD + FADE) 에서 완전히 지워진다.
 */
function opacityAt(p: number, at: number): number {
  if (p <= at - FADE) return 0;
  if (p < at) return (p - (at - FADE)) / FADE;
  if (p <= at + HOLD) return 1;
  if (p < at + HOLD + FADE) return 1 - (p - (at + HOLD)) / FADE;
  return 0;
}

const Layer = styled.div`
  position: fixed;
  inset: 0;
  /* 캔버스(z-index: -1) 위, 본문 콘텐츠 위. 클릭은 통과시킨다. */
  z-index: 10;
  pointer-events: none;
`;

const Label = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  white-space: nowrap;
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-weight: 600;
  font-size: clamp(32px, 6vw, 80px);
  letter-spacing: -0.02em;
  color: #f4efe4;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.45);
  will-change: opacity, transform;
`;

/**
 * 진행도에 반응하는 오버레이 텍스트.
 * 구독 콜백에서 style을 직접 쓴다 — setState로 돌리면 스크롤 중 매 프레임 리렌더된다.
 */
export default function ProgressOverlay() {
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const apply = (p: number) => {
      MARKERS.forEach((marker, i) => {
        const el = labelRefs.current[i];
        if (!el) return;

        const opacity = opacityAt(p, marker.at);
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, calc(-50% + ${(1 - opacity) * RISE_PX}px))`;
      });
    };

    apply(getScrollProgress());
    return subscribeScrollProgress(apply);
  }, []);

  return (
    <Layer aria-hidden="true">
      {MARKERS.map((marker, i) => (
        <Label
          key={marker.at}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
        >
          {marker.label}
        </Label>
      ))}
    </Layer>
  );
}
