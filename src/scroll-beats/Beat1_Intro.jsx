'use client';

import { Fragment, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

import { clamp01, easeIn, usePrefersReducedMotion } from './BeatFrame';

// ─────────────────────────────────────────
// 구간
// ─────────────────────────────────────────

export const RANGE = [0.0, 0.08];

const [RANGE_START, RANGE_END] = RANGE;

/**
 * 퇴장 시작 지점(전역 0.065)을 로컬 0~1로 환산한 값.
 *
 * 등장은 스크롤이 아니라 mount 시점 기준 타이머가 맡으므로
 * progress가 관여하는 구간은 퇴장뿐이다.
 */
const EXIT_START = 0.065 / RANGE_END; // 0.8125

/** 퇴장 시 위로 빠지는 거리 */
const SHIFT_PX = 12;

const LINES = [
  '한옥, 단순히 자연에 순응한 과거의 유산이 아닙니다.',
  '빛과 온도, 바람의 변수까지 완벽하게 통제한 정교한 시스템입니다.',
];

const LINE_CHARS = LINES.map((line) => line.split(''));

/** 각 줄이 전체 타이핑 순서에서 몇 번째 글자부터 시작하는지 */
const LINE_OFFSETS = LINE_CHARS.reduce(
  (acc, chars) => [...acc, acc[acc.length - 1] + chars.length],
  [0],
);

const TOTAL_CHARS = LINE_OFFSETS[LINE_OFFSETS.length - 1];

/**
 * 글자당 간격. 고정값보다 흔들어야 사람이 치는 리듬으로 읽힌다.
 * 두 문장 65자라 90ms면 6초가 걸린다. 스크롤이 기다려주지 않으므로 조여 잡았다.
 */
const TYPE_MIN_MS = 30;
const TYPE_MAX_MS = 50;

/** 문장 사이 숨. 부정에서 정정으로 넘어가는 지점을 한 번 끊어준다. */
const LINE_PAUSE_MS = 420;

const TEXT_COLOR = '#F4EFE4';
const LEAD_COLOR = 'rgba(244, 239, 228, 0.72)';
const LINE_COLOR = 'rgba(244, 239, 228, 0.4)';

const VIDEO_SRC = '/videos/hanok-neungsohwa-loop.mp4';

// ─────────────────────────────────────────
// 퇴장 (progress 구동)
// ─────────────────────────────────────────

/**
 * exit  — 텍스트 퇴장 페이드 1→0
 * video — 배경 영상 페이드 1→0 (Beat2로 넘기는 크로스페이드)
 */
function getExitState(local, reduced) {
  if (local < EXIT_START) {
    return { exit: 1, shift: 0, video: 1 };
  }

  // 텍스트는 이징을 먹여 빠르게 빠지고, 영상은 선형으로 고르게 걷힌다.
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

/** 다음에 칠 글자가 새 줄의 첫 글자면 한 번 쉬어간다. */
const delayBefore = (index) =>
  LINE_OFFSETS.includes(index) && index > 0 ? LINE_PAUSE_MS : randomDelay();

/**
 * mount 시점부터 글자 수를 하나씩 올린다. 스크롤과 무관하게 흐르므로
 * 사용자가 빨리 내리면 다 치기 전에 Beat2로 넘어간다 (의도된 동작).
 *
 * setInterval 대신 setTimeout을 이어 붙이는 이유는 글자마다 간격을 다르게
 * 주기 위해서다. 65자 × 평균 40ms + 줄 사이 420ms ≈ 3초.
 */
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

  // 건너뛸 때는 상태를 건드리지 않고 값만 바꿔 돌려준다.
  // 효과 안에서 setState를 동기로 부르면 렌더가 한 번 더 돈다.
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
  /* 버튼이 없는 구간이라 아래 캔버스/스크롤을 막지 않는다 */
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

/**
 * 영상 위에 겹치는 어둠 세 겹. 한 엘리먼트에 background 레이어로 쌓는다.
 *
 *   1) 우하단 워터마크를 덮는 좁은 원
 *   2) 화면 모서리 네 곳을 죄는 타원 비네트
 *   3) 텍스트 가독성용 상하 그라데이션
 *
 * 셋 다 같은 먹색이라 겹치는 순서가 최종 색을 바꾸지 않는다.
 * 강한 것부터 위에 적어 읽기 순서와 화면 순서를 맞췄다.
 */
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

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const Copy = styled.div`
  position: relative;
  z-index: 2;
  /* 한 줄로 뻗는 문장이 기준이라 폭은 내용에 맡기고 화면만 넘지 않게 잡는다 */
  max-width: 96vw;
  text-align: center;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  letter-spacing: -0.03em;
  line-height: 1.55;
  will-change: opacity, transform;

  /* 타이핑을 생략한 경우에는 문장 전체가 한 번 페이드인하며 들어온다 */
  ${(props) =>
    props.isReduced &&
    css`
      animation: ${fadeIn} 0.6s ease-out both;
    `}
`;

/**
 * 두 문장의 무게를 다르게 준다.
 * 앞줄은 통념을 걷어내는 말이라 한 톤 물리고, 뒷줄이 실제 주장이라 앞에 세운다.
 *
 * 두 문장 모두 한 줄로 뻗어야 해서 글자 크기를 vw로 잡는다.
 * 긴 쪽(둘째 줄)이 약 29em이라 2.8vw면 어떤 데스크톱 폭에서도 90vw 안에 들어온다.
 */
const Line = styled.p`
  margin: 0;
  white-space: nowrap;
  font-size: ${(props) => (props.isLead ? 'min(28px, 2.2vw)' : 'min(36px, 2.8vw)')};
  font-weight: ${(props) => (props.isLead ? 400 : 700)};
  color: ${(props) => (props.isLead ? LEAD_COLOR : TEXT_COLOR)};

  & + & {
    margin-top: clamp(14px, 2vh, 26px);
  }

  /* 좁은 화면에서 한 줄을 고집하면 글자가 10px대로 떨어진다. 여기서는 접는다. */
  @media (max-width: 768px) {
    white-space: normal;
    font-size: ${(props) =>
      props.isLead ? 'clamp(15px, 3.8vw, 19px)' : 'clamp(17px, 4.4vw, 22px)'};
  }
`;

// 아직 치지 않은 글자도 자리를 차지하게 둔다.
// 실제로 글자를 늘리면 줄바꿈 위치와 가운데 정렬 기준이 매 글자 바뀌어 문장이 흔들린다.
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

// 선이 위에서 내려와 그려졌다가 아래로 빠져나간다.
// transform-origin은 보간되지 않고 50% 지점에서 그대로 넘어간다.
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

// ─────────────────────────────────────────
// Beat1 — 한옥은 정교한 시스템이다
// ─────────────────────────────────────────

export default function Beat1_Intro({ progress }) {
  const reduced = usePrefersReducedMotion();
  const typedCount = useTypewriter(TOTAL_CHARS, { skip: reduced });

  if (progress < RANGE_START || progress >= RANGE_END) return null;

  const local = (progress - RANGE_START) / (RANGE_END - RANGE_START);
  const { exit, shift, video } = getExitState(local, reduced);

  // 커서는 퇴장이 시작되면 함께 접는다
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
        style={{ opacity: video }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </BackgroundVideo>

      <Scrim aria-hidden="true" style={{ opacity: video }} />

      <Copy
        isReduced={reduced}
        style={{ opacity: exit, transform: `translateY(${shift}px)` }}
        // 글자를 쪼개 놓아 보조기술이 한 자씩 읽지 않도록 완성된 문장을 붙여준다
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

            {/* 마지막 글자까지 다 친 뒤에는 커서를 문장 끝에 붙여 둔다 */}
            {hasCursor
              && typedCount >= TOTAL_CHARS
              && lineIndex === LINE_CHARS.length - 1 && <Cursor>|</Cursor>}
          </Line>
        ))}
      </Copy>

      {/* 스크롤 유도선은 타이핑 중에도 떠 있어야 첫 화면에서 단서가 된다 */}
      <ScrollLine aria-hidden="true" style={{ opacity: exit }} />
    </Stage>
  );
}
