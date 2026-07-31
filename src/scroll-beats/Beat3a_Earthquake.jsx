'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import gsap from 'gsap';

import { lightPalette, meok } from '@/design-system/tokens';
import { easeOut, isInBeat, progressIn, usePrefersReducedMotion } from './BeatFrame';

// ─────────────────────────────────────────
// 구간
// ─────────────────────────────────────────

export const RANGE = [0.18, 0.3];

const [RANGE_START, RANGE_END] = RANGE;

const toLocal = (progress) => (progress - RANGE_START) / (RANGE_END - RANGE_START);

/**
 * 배경은 Beat2 끝값을 그대로 쓴다.
 * getBeat2Scene이 이 구간 진입에서 먹빛을 한지빛으로 올려놓고 그대로 유지한다.
 * 같은 낮 시간대라 여기서 배경을 따로 그리지 않는다.
 */

// ─────────────────────────────────────────
// 실체 공개 — 설계 데이터에서 실체로
// ─────────────────────────────────────────

/**
 * Beat2에서 보이는 한옥은 황금빛 wireframe 골격뿐이다.
 * 원본 재질은 배열에 백업된 채 선으로만 서 있고,
 * 실체는 이 구간에 들어서는 순간 드러난다.
 *
 * 재질 복원과 배경의 한지빛 전환이 같은 지점에서 함께 일어나야
 * "설계 데이터가 실체가 된다"가 흔들어보기 직전의 임팩트로 남는다.
 *
 * mesh를 어떻게 되돌리는지는 HanokModel이 갖고, 언제·얼마나는 여기가 갖는다.
 * 조명값을 getBeat2Scene이 갖는 것과 같은 분담이다.
 */

/** 크로스페이드 지속(초) */
const REVEAL_SECONDS = 0.6;

/** 앞이 빠르고 뒤가 붙는 곡선. 비쳐 보이는 상태를 짧게 지난다. */
const REVEAL_EASE = 'power2.out';

/**
 * 되돌린 원본 재질이 투명에서 불투명으로 차오르게 한다.
 *
 * 재질만 곧장 갈아끼우면 골격이 한 프레임에 건물로 바뀐다.
 * 반투명한 채 0.6초를 지나면 선이 살을 얻는 것으로 읽힌다.
 *
 * apply(0~1)이 실제로 무엇을 바꾸는지는 부르는 쪽이 정한다 —
 * 여기서는 그 값을 시간에 맞춰 밀어 올리기만 한다.
 */
export function runReveal(apply) {
  if (reducedMotionNow()) {
    apply(1);
    return null;
  }

  const state = { value: 0 };

  apply(0);

  return gsap.to(state, {
    value: 1,
    duration: REVEAL_SECONDS,
    ease: REVEAL_EASE,
    onUpdate: () => apply(state.value),
    onComplete: () => apply(1),
  });
}

// ─────────────────────────────────────────
// 지진 — 캔버스가 받아 쓰는 신호
// ─────────────────────────────────────────

/**
 * 흔들라는 신호를 캔버스 안쪽으로 넘기는 통로.
 *
 * 버튼은 DOM에 있고 한옥은 Canvas 안에 있어 서로 ref를 주고받을 수 없다.
 * 조명값을 getBeat2Scene으로 넘기는 것과 같은 방향이다 —
 * 무엇이 어떻게 흔들리는지는 이 파일이 갖고, 적용은 HanokModel이 한다.
 */
const listeners = new Set();

export function onEarthquake(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 총 지속(초). 버튼 잠금과 결과 카피 타이밍이 이 값을 나눠 쓴다. */
export const QUAKE_SECONDS = 1.2;

/** 강하게 치는 구간 → 잦아드는 구간 → 제자리로 돌아오는 마지막 */
const JOLT_SECONDS = 0.3;
const DECAY_SECONDS = 0.65;
const SETTLE_SECONDS = QUAKE_SECONDS - JOLT_SECONDS - DECAY_SECONDS;

/**
 * 진폭. "흔들렸다"만 읽히면 되므로 아주 작게 잡는다.
 * 크게 흔들면 무너질 것 같은 긴장이 아니라 장난처럼 보인다.
 */
const ROTATION_MAX = 0.008; // rad
const SHIFT_MAX = 0.15;

/** 초반 강타 — 같은 진폭으로 빠르게 네 번 */
const JOLT_SWINGS = 4;

/** 감쇠 구간의 진폭 배율 */
const DECAY_STEPS = [0.55, 0.38, 0.24, 0.14, 0.07];

/** 마지막 복원. 탄성이 남기는 잔진동이 "버텼다"는 감각을 만든다. */
const SETTLE_EASE = 'elastic.out(1, 0.3)';

/** 모션 최소화 설정일 때 남기는 진폭 비율 */
const REDUCED_SCALE = 0.2;

const reducedMotionNow = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 한옥 그룹 하나를 흔든다. 카메라는 건드리지 않는다 —
 * 화면 전체가 같이 흔들리면 건물이 버틴 것이 보이지 않는다.
 *
 * 회전과 이동은 서로 반대 위상으로 간다. 기우는 쪽과 밑동이 밀리는 쪽이
 * 어긋나야 땅이 흔들려 건물이 따라 휘청이는 것으로 읽힌다.
 */
export function runQuake(object) {
  if (!object) return null;

  const scale = reducedMotionNow() ? REDUCED_SCALE : 1;

  // 앞선 진동이 남아 있으면 두 타임라인이 같은 값을 다툰다
  gsap.killTweensOf([object.rotation, object.position]);

  const timeline = gsap.timeline();
  let direction = 1;

  const swing = (amount, duration, ease) => {
    const tilt = ROTATION_MAX * amount * direction * scale;
    const shift = -SHIFT_MAX * amount * direction * scale;

    timeline.to(object.rotation, { z: tilt, duration, ease });
    timeline.to(object.position, { x: shift, duration, ease }, '<');

    direction = -direction;
  };

  for (let i = 0; i < JOLT_SWINGS; i += 1) {
    swing(1, JOLT_SECONDS / JOLT_SWINGS, 'power1.inOut');
  }

  DECAY_STEPS.forEach((amount) => {
    swing(amount, DECAY_SECONDS / DECAY_STEPS.length, 'sine.inOut');
  });

  timeline.to(object.rotation, { z: 0, duration: SETTLE_SECONDS, ease: SETTLE_EASE });
  timeline.to(object.position, { x: 0, duration: SETTLE_SECONDS, ease: SETTLE_EASE }, '<');

  return timeline;
}

// ─────────────────────────────────────────
// 텍스트
// ─────────────────────────────────────────

const EYEBROW = 'SEISMIC — 면진';
const HEADLINE = '기둥은, 고정되어 있지 않습니다.';
const BUTTON_LABEL = '흔들어보기';
const RESULT = '무너지지 않습니다.';

/** 아이브로우가 먼저, 헤드라인이 뒤따른다 */
const EYEBROW_IN = [0.05, 0.11];
const HEADLINE_IN = [0.09, 0.15];

/** 버튼은 읽을 시간을 준 뒤에 올라온다 */
const BUTTON_IN = [0.2, 0.3];

/** 구간 끝에서 그냥 잘라내면 Beat3b로 넘어갈 때 툭 끊긴다 */
const TEXT_OUT = [0.94, 1.0];

const RISE_PX = 12;
const BUTTON_RISE_PX = 16;

/** 흔들림이 멎고 카피가 뜨기까지(초). 버틴 것을 먼저 보고 읽는다. */
const RESULT_DELAY = 0.3;

function getTextState(local, window, reduced, { rise = 0 } = {}) {
  const appear = easeOut(progressIn(local, ...window));
  const leave = progressIn(local, ...TEXT_OUT);

  return {
    opacity: appear * (1 - leave),
    shift: reduced ? 0 : rise * (1 - appear),
  };
}

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

/** Beat2와 같은 자리. 구간이 바뀌어도 글자가 제자리에 있어야 한다. */
const TEXT_TOP = '5vh';

const BUTTON_BOTTOM = '12vh';

const Stage = styled.section`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: ${TEXT_TOP};
  pointer-events: none;
`;

const Copy = styled.div`
  max-width: 92vw;
  text-align: center;
  font-family: 'SpoqaHanSansNeo', sans-serif;
`;

const Eyebrow = styled.p`
  margin: 0 0 16px;
  font-size: clamp(12px, 1.2vw, 14px);
  font-weight: 500;
  /* 아이브로우는 자간을 벌려 헤드라인과 성격을 갈라놓는다 */
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${lightPalette.juhong[500]};
  will-change: opacity;
`;

const Headline = styled.p`
  margin: 0;
  font-size: clamp(32px, 4.8vw, 60px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: ${meok[900]};
  will-change: opacity, transform;
`;

/**
 * 아래쪽 조작부. bottom을 잡아두면 위로만 자라므로
 * 결과 카피가 떠도 버튼은 제자리에 남는다.
 */
const Control = styled.div`
  position: absolute;
  bottom: ${BUTTON_BOTTOM};
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  font-family: 'SpoqaHanSansNeo', sans-serif;
`;

const Result = styled.p`
  margin: 0;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${lightPalette.juhong[500]};
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
  will-change: opacity, transform;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

/**
 * transform을 쓰는 연출이 셋이라 층을 나눈다.
 * 등장(translateY)·유도(pulse)·누름(scale)이 한 요소에 겹치면 서로를 덮어쓴다.
 *
 *   Entrance — 등장 (인라인 transform)
 *   Pulse    — 누르라는 유도 (CSS 애니메이션)
 *   Button   — 호버·누름 (CSS transition)
 */
const Entrance = styled.div`
  will-change: opacity, transform;
`;

const Pulse = styled.div`
  animation: ${pulse} 2s ease-in-out infinite;

  /* 흔들리는 중이거나 모션 최소화면 유도를 멈춘다 */
  &[data-still='true'] {
    animation: none;
  }
`;

const ShakeButton = styled.button`
  display: block;
  padding: 16px 40px;
  border: none;
  border-radius: 9999px;
  background: ${meok[900]};
  color: ${meok[100]};
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  /* Stage가 pointer-events를 끊어둔다. 누를 수 있어야 하는 건 이것뿐이다. */
  pointer-events: auto;
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.2s ease-out;

  &:hover:not(:disabled) {
    transform: scale(1.04);
    background: ${lightPalette.juhong[500]};
  }

  /* 놓는 순간 transition의 오버슈트가 스프링 복원을 만든다 */
  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: 4px;
  }

  &:disabled {
    cursor: default;
  }
`;

// ─────────────────────────────────────────
// Beat3a — 기둥은, 고정되어 있지 않습니다
// ─────────────────────────────────────────

export default function Beat3a_Earthquake({ progress }) {
  const reduced = usePrefersReducedMotion();

  /** 진행 중에는 버튼을 잠근다 (연타 방지). 끝나면 다시 열어 재도전을 받는다. */
  const [shaking, setShaking] = useState(false);

  /** 한 번 흔든 사람만 결과 카피를 본다. 켜지면 유지된다. */
  const [shaken, setShaken] = useState(false);

  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const shake = useCallback(() => {
    setShaking(true);
    listeners.forEach((listener) => listener());

    timers.current.push(
      setTimeout(() => setShaking(false), QUAKE_SECONDS * 1000),
      setTimeout(() => setShaken(true), (QUAKE_SECONDS + RESULT_DELAY) * 1000),
    );
  }, []);

  if (!isInBeat(progress, ...RANGE)) return null;

  const local = toLocal(progress);

  const eyebrow = getTextState(local, EYEBROW_IN, reduced);
  const headline = getTextState(local, HEADLINE_IN, reduced, { rise: RISE_PX });
  const button = getTextState(local, BUTTON_IN, reduced, { rise: BUTTON_RISE_PX });

  return (
    <Stage>
      <Copy>
        <Eyebrow style={{ opacity: eyebrow.opacity }}>{EYEBROW}</Eyebrow>

        <Headline
          style={{
            opacity: headline.opacity,
            transform: `translateY(${headline.shift}px)`,
          }}
        >
          {HEADLINE}
        </Headline>
      </Copy>

      <Control>
        {/*
          카피는 늘 붙여두고 투명도만 바꾼다.
          누른 뒤에 끼워 넣으면 그만큼 버튼이 밀린다.
        */}
        <Result
          aria-hidden={!shaken}
          aria-live="polite"
          style={{
            opacity: shaken ? button.opacity : 0,
            transform: `translateY(${shaken || reduced ? 0 : 8}px)`,
          }}
        >
          {RESULT}
        </Result>

        <Entrance
          style={{
            opacity: button.opacity,
            transform: `translateY(${button.shift}px)`,
          }}
        >
          <Pulse data-still={reduced || shaking ? 'true' : 'false'}>
            <ShakeButton type="button" onClick={shake} disabled={shaking}>
              {BUTTON_LABEL}
            </ShakeButton>
          </Pulse>
        </Entrance>
      </Control>
    </Stage>
  );
}
