'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import PolaroidCard from '@/features/hanok-archive/components/PolaroidCard';
import type { Village } from '@/features/hanok-archive/types';

const CARD_WIDTH = 220;
const GAP = 32;
const BASE_Y = 16; // U자 곡선 양 끝의 기본 Y 높이
const MAX_SAG = 26; // U자 곡선의 중앙 최대 처짐 깊이

// 널리 알려진 곳(뱃지 보유)과 처음 듣는 곳(뱃지 없음)을 섞어 보여준다 — 전부 유명한 곳만
// 나오면 "새로 알게 됐다"는 감흥이 없다. 9장 중 3장만 유명한 곳으로 남긴다.
const TOTAL_PICKS = 9;
const FAMOUS_SHARE = 3;

// 카드가 늘어난 만큼 줄도 길어지므로, 한 바퀴 도는 시간을 늘려 체감 속도(px/s)를 그대로 둔다.
// 기존 5장 · 36초 기준값이 곧 그 속도다.
const REFERENCE_PICKS = 5;
const REFERENCE_DURATION_S = 36;
const PX_PER_SEC =
  (REFERENCE_PICKS * CARD_WIDTH + (REFERENCE_PICKS - 1) * GAP) / REFERENCE_DURATION_S;

/** 같은 지역이 연달아 나오지 않도록 지역별로 한 장씩 돌아가며 뽑는다. */
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

/** 유명한 곳(뱃지 보유)과 처음 듣는 곳을 정해진 비율로 섞어, 한 덩어리로 뭉치지 않게 배치한다. */
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
    // 매 세 번째 자리마다 유명한 곳을 하나씩 끼워 넣는다.
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

// 빨랫줄 전체가 옆으로 천천히, 끊김 없이 흘러가듯 넘어간다.
// 양쪽 끝은 마스크로 흐릿하게 사라지도록 처리해 갑자기 잘리는 느낌을 없앤다.
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

// 사진 세트를 두 벌 이어 붙여 자연스럽게 루프한다. 마우스를 올리면
// 클릭하기 쉽도록 멈춘다.
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

// 자연스러운 U자형 린넨 마끈 (SVG 곡선으로 구현 — 사진 뒤로 지나감)
const SvgRope = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 90px;
  pointer-events: none;
  z-index: 1; /* 사진 뒤로 배치 */
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

// 개별 폴라로이드 걸림 영역 (줄보다 앞에 오도록 z-index 부여)
const PhotoHang = styled.div<{ $yOffset: number }>`
  position: relative;
  width: ${CARD_WIDTH}px;
  flex-shrink: 0;
  margin-top: ${({ $yOffset }) => $yOffset}px;
  z-index: 2; /* 줄(z-index: 1)보다 확실하게 앞으로 오도록 설정 */
`;

// 정교한 미니 원목 빨래집게 (앞에서 카드를 단단히 물고 있음)
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
  z-index: 5; /* 사진(z-index: 2)보다 앞에서 물고 있는 형태 */
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

  /* 집게 두 다리 사이의 세로 홈 */
  &::before {
    content: '';
    position: absolute;
    top: 2px;
    bottom: 2px;
    left: calc(50% - 0.5px);
    width: 1px;
    background: rgba(80, 48, 18, 0.45);
  }

  /* 중앙 금속 스프링 힌지 링 (줄이 관통하는 중심) */
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

    // 2차 베지에 곡선으로 가운데가 부드럽게 처지는 U자 포물선 패스 생성
    // (시작 높이: BASE_Y, 중간 최대 처짐: BASE_Y + MAX_SAG, 끝 높이: BASE_Y)
    const controlY = BASE_Y + 2 * MAX_SAG;
    const path = `M 0,${BASE_Y} Q ${totalW / 2},${controlY} ${totalW},${BASE_Y}`;

    const layouts = picks.map((village, idx) => {
      const centerX = idx * (CARD_WIDTH + GAP) + CARD_WIDTH / 2;
      const t = centerX / totalW;
      // 곡선의 Y 위치 (포물선 높이)
      const sag = 4 * MAX_SAG * t * (1 - t);
      const ropeY = BASE_Y + sag;

      // 곡선의 접선 기울기 계산 (자연스러운 매달림 각도)
      const tangentSlope = (4 * MAX_SAG * (1 - 2 * t)) / totalW;
      const tiltDeg = Math.atan(tangentSlope) * (180 / Math.PI) * 0.7;

      return {
        village,
        // 집게의 스프링 홈(상단 기준 10px 지점)이 곡선의 ropeY와 정확히 맞물리도록 오프셋 계산
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
