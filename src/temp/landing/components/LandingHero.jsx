'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import { motion } from 'framer-motion';

import { BEAT_RANGES } from '../scroll-core/constants';
import { meok } from '@/design-system/tokens';
import { clamp01, easeIn, usePrefersReducedMotion } from './LandingSectionFrame';

// ─────────────────────────────────────────
// 구간 (Beat1: 0.0 ~ 0.09)
// ─────────────────────────────────────────

export const RANGE = BEAT_RANGES.BEAT1;

const [RANGE_START, RANGE_END] = RANGE;

/**
 * 퇴장 시작 지점(전역 0.060)을 로컬 0~1로 환산한 값.
 * Beat2와 교차 페이드(Cross-fade)로 자연스럽게 연결됩니다.
 */
const EXIT_START = 0.06 / RANGE_END; // 0.667

/** 퇴장 시 위로 빠지는 거리 */
const SHIFT_PX = 12;

const LINES = [
  '한옥, 자연의 순리를 품어낸 완벽한 조화',
  '빛과 바람의 결까지 섬세하게 다스린 정교한 지혜입니다.',
];

const LINE_CHARS = LINES.map((line) => line.split(''));

const LINE_OFFSETS = LINE_CHARS.reduce(
  (acc, chars) => [...acc, acc[acc.length - 1] + chars.length],
  [0],
);

const TOTAL_CHARS = LINE_OFFSETS[LINE_OFFSETS.length - 1];

const TYPE_MIN_MS = 60;
const TYPE_MAX_MS = 90;
const LINE_PAUSE_MS = 650;

const TEXT_COLOR = meok[100];
const LEAD_COLOR = 'rgba(250, 250, 250, 0.72)';
const LINE_COLOR = 'rgba(250, 250, 250, 0.4)';

const VIDEO_SRC = '/videos/hanok-neungsohwa-loop.mp4';

// ─────────────────────────────────────────
// 퇴장 (progress 구동)
// ─────────────────────────────────────────

function getExitState(local, reduced) {
  if (local < EXIT_START) {
    return { exit: 1, shift: 0, video: 1 };
  }

  const t = clamp01((local - EXIT_START) / (1 - EXIT_START));
  const eased = easeIn(t);

  return {
    exit: 1 - eased,
    shift: reduced ? 0 : -SHIFT_PX * eased,
    video: 1 - t,
  };
}

// ─────────────────────────────────────────
// 타이핑 (시간 구동)
// ─────────────────────────────────────────

const randomDelay = () => TYPE_MIN_MS + Math.random() * (TYPE_MAX_MS - TYPE_MIN_MS);
const delayBefore = (index) =>
  LINE_OFFSETS.includes(index) && index > 0 ? LINE_PAUSE_MS : randomDelay();

function useTypewriter(length, { skip }) {
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (skip) return undefined;

    let count = 0;
    let timer = 0;

    const step = () => {
      count += 1;
      setTypedCount(count);
      if (count < length) timer = window.setTimeout(step, delayBefore(count));
    };

    timer = window.setTimeout(step, delayBefore(count));

    return () => window.clearTimeout(timer);
  }, [length, skip]);

  return skip ? length : typedCount;
}

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

const Stage = styled.section`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const BackgroundVideo = styled.video`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  transform: translateZ(0);
  will-change: opacity;
  backface-visibility: hidden;
  transition: opacity 0.2s ease-out;
`;

const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(
      circle at 92% 95%,
      rgba(10, 9, 8, 0.95) 0%,
      rgba(10, 9, 8, 0.5) 20%,
      transparent 35%
    ),
    radial-gradient(ellipse at center, transparent 40%, rgba(10, 9, 8, 0.75) 100%),
    linear-gradient(
      180deg,
      rgba(10, 9, 8, 0.55) 0%,
      rgba(10, 9, 8, 0.25) 35%,
      rgba(10, 9, 8, 0.35) 65%,
      rgba(10, 9, 8, 0.7) 100%
    );
  transition: opacity 0.2s ease-out;
`;

const fadeInAnimation = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const Copy = styled.div`
  position: relative;
  z-index: 2;
  max-width: 96vw;
  text-align: center;
  font-family: 'Spoqa Han Sans Neo', sans-serif;
  letter-spacing: -0.03em;
  line-height: 1.55;
  will-change: opacity, transform;
  transition: opacity 0.2s ease-out;

  ${(props) =>
    props.isReduced &&
    css`
      animation: ${fadeInAnimation} 0.6s ease-out both;
    `}
`;

const Line = styled.p`
  margin: 0;
  white-space: nowrap;
  font-size: ${(props) => (props.isLead ? 'clamp(24px, 2.4vw, 36px)' : 'clamp(32px, 3.4vw, 48px)')};
  font-weight: ${(props) => (props.isLead ? 400 : 800)};
  color: ${(props) => (props.isLead ? LEAD_COLOR : TEXT_COLOR)};

  & + & {
    margin-top: clamp(16px, 2.5vh, 32px);
  }

  @media (max-width: 768px) {
    white-space: normal;
    font-size: ${(props) =>
      props.isLead ? 'clamp(18px, 4.5vw, 24px)' : 'clamp(22px, 5.5vw, 30px)'};
  }
`;

const Char = styled.span`
  white-space: pre;
`;

const blink = keyframes`
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

const Cursor = styled.span`
  display: inline-block;
  width: 0;
  overflow: visible;
  animation: ${blink} 0.8s step-end infinite;
  user-select: none;
  pointer-events: none;
  opacity: ${(props) => (props.isDone ? 0 : 1)};
  transition: opacity 0.6s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const doubleArrowVariants = {
  initial: { y: -4, opacity: 0.1 },
  animate: (i) => ({
    y: [-4, 4, 10],
    opacity: [0.1, 0.65, 0],
    transition: {
      duration: 2.4,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: i * 0.45,
    },
  }),
};

export default function LandingHero({ progress }) {
  const reduced = usePrefersReducedMotion();
  const typedCount = useTypewriter(TOTAL_CHARS, { skip: reduced });
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.3;
    }
  }, []);

  if (progress < RANGE_START || progress >= RANGE_END) return null;

  const local = (progress - RANGE_START) / (RANGE_END - RANGE_START);
  const { exit, shift, video } = getExitState(local, reduced);
  const isDone = typedCount >= TOTAL_CHARS;
  const hasCursor = !reduced && local < EXIT_START;

  return (
    <Stage>
      <BackgroundVideo
        ref={videoRef}
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ opacity: video }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </BackgroundVideo>

      <Scrim aria-hidden="true" style={{ opacity: video }} />

      <Copy
        isReduced={reduced}
        style={{ opacity: exit, transform: `translateY(${shift}px)` }}
        role="paragraph"
        aria-label={LINES.join(' ')}
      >
        {LINE_CHARS.map((chars, lineIndex) => (
          <Line
            key={LINES[lineIndex]}
            isLead={lineIndex === 0}
            aria-hidden="true"
          >
            {chars.map((char, charIndex) => {
              const order = LINE_OFFSETS[lineIndex] + charIndex;

              return (
                <Fragment key={`${char}-${charIndex}`}>
                  {hasCursor && order === typedCount && <Cursor isDone={isDone} aria-hidden="true">|</Cursor>}
                  <Char style={{ opacity: order < typedCount ? 1 : 0 }}>{char}</Char>
                </Fragment>
              );
            })}

            {hasCursor
              && isDone
              && lineIndex === LINE_CHARS.length - 1 && <Cursor isDone={isDone} aria-hidden="true">|</Cursor>}
          </Line>
        ))}
      </Copy>

      {/* Framer Motion 이중 하향 화살표 (\/ \/) 스크롤 인디케이터 */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 'clamp(24px, 5vh, 48px)',
          left: '50%',
          x: '-50%',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          opacity: exit,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            color: 'rgba(250, 250, 250, 0.65)',
            fontFamily: 'Spoqa Han Sans Neo, sans-serif',
            marginBottom: '4px',
          }}
        >
          천천히 내려보기
        </span>

        {[0, 1].map((index) => (
          <motion.svg
            key={index}
            width="20"
            height="11"
            viewBox="0 0 24 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            custom={index}
            variants={doubleArrowVariants}
            initial="initial"
            animate="animate"
          >
            <path
              d="M2 2L12 12L22 2"
              stroke="rgba(250, 250, 250, 0.85)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        ))}
      </motion.div>
    </Stage>
  );
}
