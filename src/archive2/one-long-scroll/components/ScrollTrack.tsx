'use client';

import React from 'react';
import styled from '@emotion/styled';

/**
 * 스크롤 길이를 만드는 트랙.
 *
 * 배경이 고정 캔버스이므로 본문은 "높이만 차지하는 투명한 슬롯"이면 된다.
 * 어떤 요소에도 불투명 배경을 깔면 안 된다 — 뒤의 z-index: -1 캔버스가 가려진다.
 */
const Track = styled.div`
  position: relative;
  width: 100%;
  background: transparent;
`;

const Panel = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  background: transparent;
`;

// 어느 구간을 지나는지 눈으로 확인하기 위한 표식. 연출이 들어가면 지운다.
const PanelTag = styled.span`
  position: absolute;
  top: 24px;
  left: 24px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: rgba(244, 239, 228, 0.35);
  mix-blend-mode: difference;
  pointer-events: none;
`;

interface ScrollTrackProps {
  /** children이 없을 때 만들어낼 빈 100vh 패널 수. 총 스크롤 길이 = panels × 100vh */
  panels?: number;
  children?: React.ReactNode;
}

export default function ScrollTrack({ panels = 5, children }: ScrollTrackProps) {
  if (children) {
    return <Track>{children}</Track>;
  }

  return (
    <Track>
      {Array.from({ length: panels }, (_, i) => {
        const from = Math.round((i / panels) * 100);
        const to = Math.round(((i + 1) / panels) * 100);

        return (
          <Panel key={i} aria-hidden="true">
            <PanelTag>
              {String(i + 1).padStart(2, '0')} / {from}% — {to}%
            </PanelTag>
          </Panel>
        );
      })}
    </Track>
  );
}
