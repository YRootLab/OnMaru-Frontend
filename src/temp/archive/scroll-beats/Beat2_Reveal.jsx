'use client';

import { useEffect, useRef } from 'react';

import { meok } from '@/design-system/tokens';
import { BEAT_RANGES } from '@/scroll-core/constants';
import { easeOut, progressIn, usePrefersReducedMotion } from '@/temp/scroll-beats/BeatFrame';

// ─────────────────────────────────────────
// 구간 (Beat2: 0.09 ~ 0.20)
// ─────────────────────────────────────────

export const RANGE = BEAT_RANGES.BEAT2;

const [RANGE_START, RANGE_END] = RANGE;

// ─────────────────────────────────────────
// 등장 시퀀스 (로컬 진행도 0~1 기준)
// ─────────────────────────────────────────

const HEADLINE_IN = [0.25, 0.33];
const HINT_IN = [0.45, 0.55];

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

// ─────────────────────────────────────────
// Beat2_Reveal — 텍스트 전용 레이어
//
// 3D 골격(와이어프레임)은 ScrollExperience의 FixedStage Canvas가
// HanokModel에 wireframe prop을 넘겨 전담한다.
// 이 컴포넌트는 헤드라인과 조작 힌트만 담는다.
// ─────────────────────────────────────────

export default function Beat2_Reveal({ progress }) {
  const reduced = usePrefersReducedMotion();

  const inRange = progress >= RANGE_START && progress < RANGE_END;
  const local = inRange ? (progress - RANGE_START) / (RANGE_END - RANGE_START) : 0;

  if (!inRange) return null;

  const headline = easeOut(progressIn(local, ...HEADLINE_IN));
  const hint = progressIn(local, ...HINT_IN);

  return (
    <section style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'fixed',
          top: 'clamp(5vh, 6.5vh, 8vh)',
          left: 0,
          right: 0,
          zIndex: 2,
          padding: '0 24px',
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(28px, 4.2vw, 54px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            wordBreak: 'keep-all',
            color: meok[100],
            opacity: headline,
            transform: reduced ? 'none' : `translateY(${12 * (1 - headline)}px)`,
          }}
        >
          형태를 지우면, 설계가 남습니다.
        </h2>

        <p
          style={{
            margin: '14px 0 0',
            fontSize: 'clamp(13px, 1.4vw, 15px)',
            fontWeight: 400,
            color: meok[300],
            opacity: hint,
            transition: 'opacity 0.4s ease-out',
          }}
        >
          마우스를 움직여 각도를 바꿔보십시오.
        </p>
      </div>
    </section>
  );
}
