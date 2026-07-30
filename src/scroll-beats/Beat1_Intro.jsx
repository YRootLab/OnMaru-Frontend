'use client';

import { Fragment, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

import { clamp01, easeIn, usePrefersReducedMotion } from './BeatFrame';

// ─────────────────────────────────────────
// 구간 (Beat1: 0.0 ~ 0.09)
// ─────────────────────────────────────────

export const RANGE = [0.0, 0.09];

const [RANGE_START, RANGE_END] = RANGE;

/**
 * 퇴장 시작 지점(전역 0.060)을 로컬 0~1로 환산한 값.
 * Beat2와 교차 페이드(Cross-fade)로 자연스럽게 연결됩니다.
 */
const EXIT_START = 0.06 / RANGE_END; // 0.667

/** 퇴장 시 위로 빠지는 거리 */
const SHIFT_PX = 12;

const LINES = [
  '한옥, 단순히 자연에 순응한 과거의 유산이 아닙니다.',
  '빛과 온도, 바람의 변수까지 완벽하게 통제한 정교한 시스템입니다.',
];

const LINE_CHARS = LINES.map((line) => line.split(''));

const LINE_OFFSETS = LINE_CHARS.reduce(
  (acc, chars) => [...acc, acc[acc.length - 1] + chars.length],
  [0],
);

const TOTAL_CHARS = LINE_OFFSETS[LINE_OFFSETS.length - 1];

const TYPE_MIN_MS = 30;
const TYPE_MAX_MS = 50;
const LINE_PAUSE_MS = 420;

const TEXT_COLOR = '#F4EFE4';
const LEAD_COLOR = 'rgba(244, 239, 228, 0.72)';
const LINE_COLOR = 'rgba(244, 239, 228, 0.4)';

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
  font-family: 'SpoqaHanSansNeo', sans-serif;
  letter-spacing: -0.03em;
  line-height: 1.55;
  will-change: opacity, transform;

  ${(props) =>
    props.isReduced &&
    css`
      animation: ${fadeInAnimation} 0.6s ease-out both;
    `}
`;

const Line = styled.p`
  margin: 0;
  white-space: nowrap;
  font-size: ${(props) => (props.isLead ? 'min(28px, 2.2vw)' : 'min(36px, 2.8vw)')};
  font-weight: ${(props) => (props.isLead ? 400 : 700)};
  color: ${(props) => (props.isLead ? LEAD_COLOR : TEXT_COLOR)};

  & + & {
    margin-top: clamp(14px, 2vh, 26px);
  }

  @media (max-width: 768px) {
    white-space: normal;
    font-size: ${(props) =>
      props.isLead ? 'clamp(15px, 3.8vw, 19px)' : 'clamp(17px, 4.4vw, 22px)'};
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
  animation: ${blink} 0.8s step-end infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const draw = keyframes`
  0%   { transform: scaleY(0); transform-origin: 50% 0%; }
  50%  { transform: scaleY(1); transform-origin: 50% 0%; }
  51%  { transform: scaleY(1); transform-origin: 50% 100%; }
  100% { transform: scaleY(0); transform-origin: 50% 100%; }
`;

const ScrollLine = styled.span`
  position: absolute;
  z-index: 2;
  bottom: 8vh;
  left: 50%;
  width: 1px;
  height: 40px;
  margin-left: -0.5px;
  background: ${LINE_COLOR};
  animation: ${draw} 2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: scaleY(1);
  }
`;

export default function Beat1_Intro({ progress }) {
  const reduced = usePrefersReducedMotion();
  const typedCount = useTypewriter(TOTAL_CHARS, { skip: reduced });

  if (progress < RANGE_START || progress >= RANGE_END) return null;

  const local = (progress - RANGE_START) / (RANGE_END - RANGE_START);
  const { exit, shift, video } = getExitState(local, reduced);
  const hasCursor = !reduced && local < EXIT_START;

  return (
    <Stage>
      <BackgroundVideo
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ opacity: video, transition: 'opacity 0.2s ease-out' }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </BackgroundVideo>

      <Scrim aria-hidden="true" style={{ opacity: video, transition: 'opacity 0.2s ease-out' }} />

      <Copy
        isReduced={reduced}
        style={{ opacity: exit, transform: `translateY(${shift}px)`, transition: 'opacity 0.2s ease-out' }}
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
                  {hasCursor && order === typedCount && <Cursor>|</Cursor>}
                  <Char style={{ opacity: order < typedCount ? 1 : 0 }}>{char}</Char>
                </Fragment>
              );
            })}

            {hasCursor
              && typedCount >= TOTAL_CHARS
              && lineIndex === LINE_CHARS.length - 1 && <Cursor>|</Cursor>}
          </Line>
        ))}
      </Copy>

      <ScrollLine aria-hidden="true" style={{ opacity: exit }} />
    </Stage>
  );
}
