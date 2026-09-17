'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import PolaroidCard from '@/features/hanok-archive/components/PolaroidCard';
import type { Village } from '@/features/hanok-archive/types';

// 빨랫줄 전체가 옆으로 천천히, 끊김 없이 흘러가듯 넘어간다.
// 양쪽 끝은 마스크로 흐릿하게 사라지도록 처리해 갑자기 잘리는 느낌을 없앤다.
const LineWrapper = styled.div`
  position: relative;
  overflow: hidden;
  padding: 34px 0 8px;
  mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
`;

const slide = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

// 사진 세트를 두 벌 이어 붙여 자연스럽게 루프한다. 마우스를 올리면
// 클릭하기 쉽도록 멈춘다.
const Track = styled.div`
  display: flex;
  width: max-content;
  animation: ${slide} 34s linear infinite;

  &:hover {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// 뻣뻣한 직선 대신, 무게에 살짝 처진 노끈처럼 완만한 곡선으로 그린다
const RopeSvg = styled.svg`
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  height: 28px;
  overflow: visible;
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.1));
`;

const RopeStroke = styled.path`
  fill: none;
  stroke: #b08968;
  stroke-width: 3;
  stroke-linecap: round;

  [data-theme='dark'] & {
    stroke: #8c6b4f;
  }
`;

// 꼬인 노끈처럼 보이도록 얇은 하이라이트를 살짝 위쪽으로 겹친다
const RopeHighlight = styled.path`
  fill: none;
  stroke: #ddbc98;
  stroke-width: 1;
  stroke-linecap: round;
  opacity: 0.8;

  [data-theme='dark'] & {
    stroke: #a98362;
  }
`;

// 로프 한 벌 + 사진 한 벌을 담는 반복 단위. 이 단위를 통째로 두 번 이어 붙이면
// 이어지는 지점이 감쪽같아서 무한히 흐르는 것처럼 보인다.
const Unit = styled.div`
  position: relative;
  display: flex;
  gap: 32px;
  width: max-content;
  padding: 0 16px;
  flex-shrink: 0;
`;

// 실에 자연스럽게 처진 느낌을 주는 세로 위치 편차
const HANG_OFFSETS = [0, 7, -3, 5, -6, 2];

const PhotoHang = styled.div<{ $offset: number }>`
  position: relative;
  width: 220px;
  flex-shrink: 0;
  margin-top: ${({ $offset }) => 16 + $offset}px;
`;

// 나무 빨래집게
const Peg = styled.div`
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  width: 11px;
  height: 17px;
  border-radius: 3px;
  background: linear-gradient(180deg, #d3a877 0%, #a97c4f 100%);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
  z-index: 11;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 50%;
    width: 1px;
    height: 11px;
    background: rgba(0, 0, 0, 0.22);
    transform: translateX(-50%);
  }
`;

interface HanokPolaroidClotheslineProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

export default function HanokPolaroidClothesline({ villages, onSelectVillage }: HanokPolaroidClotheslineProps) {
  const picks = useMemo(() => villages.filter((v) => v.hasImage).slice(0, 5), [villages]);

  if (picks.length === 0) return null;

  return (
    <section aria-label="사진으로 먼저 만나는 이달의 한옥들">
      <LineWrapper>
        <Track>
          {[0, 1].map((copy) => (
            <Unit key={copy} aria-hidden={copy === 1 || undefined}>
              <RopeSvg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
                <RopeHighlight d="M0,11 Q50,21 100,11" />
                <RopeStroke d="M0,12 Q50,22 100,12" />
              </RopeSvg>
              {picks.map((village, idx) => (
                <PhotoHang key={village.id} $offset={HANG_OFFSETS[idx % HANG_OFFSETS.length]}>
                  <Peg aria-hidden="true" />
                  <PolaroidCard
                    village={village}
                    index={idx}
                    customHandText={village.name}
                    onClick={copy === 0 ? onSelectVillage : undefined}
                    enableTape={false}
                  />
                </PhotoHang>
              ))}
            </Unit>
          ))}
        </Track>
      </LineWrapper>
    </section>
  );
}
