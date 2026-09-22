'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import PolaroidCard from '@/features/hanok-archive/components/PolaroidCard';
import type { Village } from '@/features/hanok-archive/types';

const CARD_WIDTH = 220;
const GAP = 32;
const BASE_Y = 16;
const MAX_SAG = 26;



const TOTAL_PICKS = 9;
const FAMOUS_SHARE = 3;



const REFERENCE_PICKS = 5;
const REFERENCE_DURATION_S = 36;
const PX_PER_SEC =
  (REFERENCE_PICKS * CARD_WIDTH + (REFERENCE_PICKS - 1) * GAP) / REFERENCE_DURATION_S;


function pickRoundRobinByRegion(pool: Village[], count: number): Village[] {
  const byRegion = new Map<string, Village[]>();
  for (const village of pool) {
    const list = byRegion.get(village.region);
    if (list) list.push(village);
    else byRegion.set(village.region, [village]);
  }

  const queues = Array.from(byRegion.values());
  const picked: Village[] = [];

  for (let round = 0; picked.length < count && queues.some((q) => q[round]); round += 1) {
    for (const queue of queues) {
      if (picked.length >= count) break;
      if (queue[round]) picked.push(queue[round]);
    }
  }

  return picked;
}


function pickCuratedVillages(villages: Village[]): Village[] {
  const withImage = villages.filter((v) => v.hasImage);
  const total = Math.min(TOTAL_PICKS, withImage.length);
  const famousCount = Math.min(FAMOUS_SHARE, Math.round((total * FAMOUS_SHARE) / TOTAL_PICKS));

  const famousPool = withImage.filter((v) => v.badges.length > 0);
  const hiddenPool = withImage.filter((v) => v.badges.length === 0);

  const famousPicks = pickRoundRobinByRegion(famousPool, famousCount);
  const hiddenPicks = pickRoundRobinByRegion(hiddenPool, total - famousPicks.length);

  const picks: Village[] = [];
  let famousIdx = 0;
  let hiddenIdx = 0;

  for (let i = 0; i < total; i += 1) {

    const takeFamous = i % 3 === 2 && famousIdx < famousPicks.length;

    if (takeFamous) {
      picks.push(famousPicks[famousIdx]);
      famousIdx += 1;
    } else if (hiddenIdx < hiddenPicks.length) {
      picks.push(hiddenPicks[hiddenIdx]);
      hiddenIdx += 1;
    } else if (famousIdx < famousPicks.length) {
      picks.push(famousPicks[famousIdx]);
      famousIdx += 1;
    }
  }

  return picks;
}



const LineWrapper = styled.div`
  position: relative;
  overflow: hidden;
  padding: 16px 0 36px;
  mask-image: linear-gradient(to right, transparent 0%, black 2.9%, black 97.1%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 2.9%, black 97.1%, transparent 100%);
`;

const slide = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;



const Track = styled.div<{ $durationSec: number }>`
  display: flex;
  width: max-content;
  animation: ${slide} ${({ $durationSec }) => $durationSec}s linear infinite;

  &:hover {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Unit = styled.div<{ $width: number }>`
  position: relative;
  display: flex;
  gap: ${GAP}px;
  width: ${({ $width }) => $width}px;
  flex-shrink: 0;
`;


const SvgRope = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 90px;
  pointer-events: none;
  z-index: 1;
  overflow: visible;

  .rope-shadow {
    stroke: rgba(0, 0, 0, 0.22);
    stroke-width: 3.5;
    fill: none;
    transform: translateY(2px);
  }

  .rope-main {
    stroke: #bda07b;
    stroke-width: 2.5;
    fill: none;
    stroke-linecap: round;
  }

  .rope-texture {
    stroke: #ebd5bb;
    stroke-width: 1.2;
    fill: none;
    stroke-dasharray: 4, 4;
    stroke-linecap: round;
  }

  [data-theme='dark'] & {
    .rope-shadow {
      stroke: rgba(0, 0, 0, 0.55);
    }
    .rope-main {
      stroke: #866847;
    }
    .rope-texture {
      stroke: #aa8964;
    }
  }
`;


const PhotoHang = styled.div<{ $yOffset: number }>`
  position: relative;
  width: ${CARD_WIDTH}px;
  flex-shrink: 0;
  margin-top: ${({ $yOffset }) => $yOffset}px;
  z-index: 2;
`;


const Peg = styled.div<{ $tilt?: number }>`
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%) rotate(${({ $tilt }) => $tilt || 0}deg);
  width: 8.5px;
  height: 25px;
  border-radius: 1.5px;
  background: linear-gradient(
    to right,
    #e2be92 0%,
    #eed4b2 35%,
    #dfba8e 70%,
    #be925f 100%
  );
  box-shadow:
    0 2px 5px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  z-index: 5;
  pointer-events: none;

  [data-theme='dark'] & {
    background: linear-gradient(
      to right,
      #9a7248 0%,
      #b38a5b 35%,
      #9e774c 70%,
      #704d27 100%
    );
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }


  &::before {
    content: '';
    position: absolute;
    top: 2px;
    bottom: 2px;
    left: calc(50% - 0.5px);
    width: 1px;
    background: rgba(80, 48, 18, 0.45);
  }


  &::after {
    content: '';
    position: absolute;
    top: 10px;
    left: -1px;
    right: -1px;
    height: 3.5px;
    border-radius: 1px;
    background: linear-gradient(
      to bottom,
      #b8bec7 0%,
      #f0f2f5 45%,
      #8d949c 80%,
      #61676f 100%
    );
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  }
`;

interface HanokPolaroidClotheslineProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

export default function HanokPolaroidClothesline({ villages, onSelectVillage }: HanokPolaroidClotheslineProps) {
  const picks = useMemo(() => pickCuratedVillages(villages), [villages]);

  const { unitWidth, cardLayouts, svgPath, durationSec } = useMemo(() => {
    const count = picks.length;
    if (count === 0) return { unitWidth: 0, cardLayouts: [], svgPath: '', durationSec: REFERENCE_DURATION_S };

    const totalW = count * CARD_WIDTH + (count - 1) * GAP;



    const controlY = BASE_Y + 2 * MAX_SAG;
    const path = `M 0,${BASE_Y} Q ${totalW / 2},${controlY} ${totalW},${BASE_Y}`;

    const layouts = picks.map((village, idx) => {
      const centerX = idx * (CARD_WIDTH + GAP) + CARD_WIDTH / 2;
      const t = centerX / totalW;

      const sag = 4 * MAX_SAG * t * (1 - t);
      const ropeY = BASE_Y + sag;


      const tangentSlope = (4 * MAX_SAG * (1 - 2 * t)) / totalW;
      const tiltDeg = Math.atan(tangentSlope) * (180 / Math.PI) * 0.7;

      return {
        village,

        yOffset: Math.round(ropeY + 4),
        tilt: Number(tiltDeg.toFixed(1)),
      };
    });

    return { unitWidth: totalW, cardLayouts: layouts, svgPath: path, durationSec: totalW / PX_PER_SEC };
  }, [picks]);

  if (picks.length === 0) return null;

  return (
    <section aria-label="사진으로 먼저 만나는 이달의 한옥들">
      <LineWrapper>
        <Track $durationSec={durationSec}>
          {[0, 1].map((copy) => (
            <Unit key={copy} $width={unitWidth} aria-hidden={copy === 1 || undefined}>
              <SvgRope viewBox={`0 0 ${unitWidth} 90`} preserveAspectRatio="none" aria-hidden="true">
                <path d={svgPath} className="rope-shadow" />
                <path d={svgPath} className="rope-main" />
                <path d={svgPath} className="rope-texture" />
              </SvgRope>
              {cardLayouts.map(({ village, yOffset, tilt }, idx) => (
                <PhotoHang key={village.id} $yOffset={yOffset}>
                  <Peg aria-hidden="true" $tilt={tilt} />
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
