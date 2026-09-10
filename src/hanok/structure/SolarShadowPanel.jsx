'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { MapPin } from 'lucide-react';

import { useSceneStore } from './sceneStore';
import useUserLocation from '@/hooks/useUserLocation';
import SHADOW from '@/data/solarShadow.json';
import { altitudeToSeasonValue, getDayOfYear, getNoonSolarAltitude } from '@/utils/solar';

import { clamp01, easeOut, usePrefersReducedMotion } from './motion';

const FONT = 'var(--font-hanok)';

// ─────────────────────────────────────────
// 색
//
// 배경이 크림(#F7EEDC)이라 글자는 전부 어두운 쪽에서 고른다.
// 액센트는 주홍 하나로 통일했다 — 전에는 주홍과 금색이 한 화면에서 갈라져 있었다.
// ─────────────────────────────────────────

import { meok, surface } from '@/design-system/tokens';

/*
  이 화면의 색은 전부 변수를 거친다.

  다크모드에서 바뀌어야 하는 값이 열두 가지쯤 되는데, styled 하나하나에
  [data-theme='dark'] & 블록을 다는 대신 Stage에서 한 번만 갈아 끼운다.
  아래 이름들은 그 변수를 가리키는 손잡이일 뿐이다.
*/
const INK = 'var(--sim-ink)';
const INK_SUB = 'var(--sim-ink-sub)';
const INK_WEAK = 'var(--sim-ink-weak)';

/** 지금 선 절기의 색. Stage가 절기마다 갈아 끼운다. */
const ACCENT = 'var(--sim-accent)';

/**
 * 손잡이와 채움이 절기 사이를 건너는 시간·곡선.
 *
 * sceneStore의 TWEEN_MS(420ms) / easeInOutCubic과 같은 값이라야 한다.
 * 다르면 손은 먼저 붙고 3D 볕은 뒤늦게 따라온다.
 */
const SLIDE = '0.42s cubic-bezier(0.65, 0, 0.35, 1)';

/**
 * 계절색이 다음 계절로 건너는 시간.
 *
 * 손잡이가 옮겨가는 시간(SLIDE)과 같아야 한다. 색만 빠르면 아직 가는 중인데 이미
 * 다음 계절이 되어 있고, 느리면 도착한 뒤에도 지난 계절색이 남는다.
 */
const TINT = '0.42s ease-out';

/*
  절기마다의 색.

  전에는 계절 넷을 브랜드 팔레트의 500으로 받았다. 그 500들은 버튼과 배지에서 눈에 띄라고
  만든 색이라 채도가 높다 — 한 해를 여덟 걸음으로 걷는 이 화면에서는 걸음마다 색이
  튀어 오르고, 정작 봐야 할 한옥의 그림자에서 눈을 빼앗아 갔다.

  그래서 여덟 절기에 각자의 색을 주되 전부 한 단계 눌러 앉혔다. 채도를 낮추고 명도를
  비슷하게 묶어, 절기가 갈려도 화면의 무게는 그대로고 색조만 돈다.
  이른 봄의 이끼빛에서 시작해 한여름의 볕으로 달아올랐다가 긴 밤의 남빛으로 가라앉는다.
*/
const TERM_TINTS = {
  //                밝은 바탕     어두운 바탕
  ipchun: /*  입춘 */ ['#8A9A5B', '#B3C486'], // 언 땅에 돋는 이끼빛
  chunbun: /* 춘분 */ ['#B57F86', '#D9A7AD'], // 흙빛이 도는 연분홍
  ipha: /*    입하 */ ['#6E9B72', '#96C49B'], // 신록
  haji: /*    하지 */ ['#D2913F', '#E8B878'], // 한낮의 볕, 한 해에서 가장 따뜻하다
  ipchu: /*   입추 */ ['#B87A4E', '#DDA377'], // 볕이 눕기 시작한 황토
  chubun: /*  추분 */ ['#96854A', '#C2B074'], // 익은 들의 누런빛
  ipdong: /*  입동 */ ['#7A8798', '#A5B2C3'], // 서리 낀 회청
  dongji: /*  동지 */ ['#55637F', '#8B9AB8'], // 가장 긴 밤의 남빛
};

/*
  절기 색은 바탕에 따라 갈린다.

  밝은 바탕에 맞춰 눌러 앉힌 색을 먹빛 바탕에 그대로 얹으면 가라앉아 안 읽힌다.
  같은 색조를 밝기만 올린 짝을 함께 들고 있다가 Stage에 둘 다 건네고, 어느 쪽을 쓸지는
  CSS가 [data-theme]을 보고 고른다 — 여기서 모드를 읽지 않으므로 컨텍스트에 기대지 않는다.
*/
const termTint = (id) => {
  const [light, dark] = TERM_TINTS[id] || TERM_TINTS.haji;
  return { '--term-light': light, '--term-dark': dark };
};

/**
 * 절기 여덟. 값은 서울 계동(37.58°N) 정오 기준이고 solarShadow.json이 갖는다.
 */
const STOPS = SHADOW.stops.map((stop) => ({
  ...stop,
  dayOfYear: getDayOfYear(new Date(2026, stop.month - 1, stop.day)),
  seasonValue: altitudeToSeasonValue(stop.altitude, SHADOW.latitude),
}));

const LAST = STOPS.length - 1;
const RETURN_MS = 600;

/*
  조작부의 생김새를 데이터가 정한다.

  직선 레일은 어느 앱에나 있고, 이 화면이 말하는 것(고도가 한 해 동안 오르내린다)을
  하나도 담지 못한다. 레일을 남중고도 곡선으로 세운다 — 동지가 가장 낮고 하지가 가장 높은
  그 굴곡이 곧 눈금이다. 슬라이더를 읽는 순간 한 해의 볕이 먼저 읽힌다.
*/
const TRACK_H = 76; // 곡선 + 손잡이가 서는 판 높이(px)
const ARC_BOTTOM = 16; // 가장 낮은 고도(동지)가 앉는 자리
const ARC_BAND = 46; // 동지에서 하지까지의 세로 폭

const ALT_MIN = Math.min(...STOPS.map((stop) => stop.altitude));
const ALT_MAX = Math.max(...STOPS.map((stop) => stop.altitude));

/** 절기마다의 자리. x는 %(폭에 비례), y는 바닥에서 띄운 px. */
const POINTS = STOPS.map((stop, i) => ({
  x: (i / LAST) * 100,
  y: ARC_BOTTOM + ((stop.altitude - ALT_MIN) / (ALT_MAX - ALT_MIN)) * ARC_BAND,
}));

/**
 * 점 여덟을 부드럽게 잇는다.
 *
 * 꺾은선으로 이으면 절기마다 각이 서서 다시 계기판이 된다. 구간 중앙에 제어점을 두는
 * 3차 곡선이면 꼭짓점을 지나면서도 굴곡이 둥글게 남는다.
 */
const ARC_PATH = (() => {
  const p = POINTS.map((pt) => ({ x: pt.x, y: TRACK_H - pt.y }));

  return p.reduce((d, cur, i) => {
    if (i === 0) return `M ${cur.x} ${cur.y}`;
    const prev = p[i - 1];
    const mid = (prev.x + cur.x) / 2;
    return `${d} C ${mid} ${prev.y} ${mid} ${cur.y} ${cur.x} ${cur.y}`;
  }, '');
})();

/** 같은 곡선을 지평선까지 닫은 면. 지나온 만큼 쌓인 볕이 된다. */
const AREA_PATH = `${ARC_PATH} L 100 ${TRACK_H} L 0 ${TRACK_H} Z`;

/** 오늘에 가장 가까운 절기. 연중 며칠째인지로 고른다. */
function stopIndexForDay(day) {
  let best = 0;

  for (let i = 1; i < STOPS.length; i += 1) {
    if (Math.abs(STOPS[i].dayOfYear - day) < Math.abs(STOPS[best].dayOfYear - day)) best = i;
  }

  return best;
}

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

const riseIn = keyframes`
  from { opacity: 0; transform: translate(-50%, 6px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
`;

/** 위와 같은 동작이지만 가로 중앙 정렬을 쓰지 않는 자리용. */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Stage = styled.section`
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none !important;
  font-family: ${FONT};
  background: transparent;

  /*
    밝은 바탕 한 벌. --term-light / --term-dark는 절기가 갈릴 때마다 인라인으로 들어온다.
  */
  --sim-accent: var(--term-light);
  --sim-accent-soft: color-mix(in srgb, var(--sim-accent) 12%, transparent);
  --sim-ink: ${meok[900]};
  --sim-ink-sub: ${meok[700]};
  --sim-ink-weak: ${meok[500]};
  --sim-rail: ${meok[200]};
  --sim-tick: ${meok[400]};
  /* 구슬과 손잡이의 테. 바탕색이라야 선이 그 자리에서 끊겨 보인다. */
  --sim-ring: #ffffff;
  --sim-pill: rgba(255, 255, 255, 0.82);
  --sim-pill-strong: rgba(255, 255, 255, 0.92);
  --sim-pill-hover: #ffffff;
  --sim-pill-border: ${meok[200]};
  --sim-accent-wash: rgba(160, 58, 10, 0.07);

  /* 먹빛 바탕 한 벌. 바꾸는 건 값뿐이고 아래 스타일은 하나도 손대지 않는다. */
  [data-theme='dark'] & {
    --sim-accent: var(--term-dark);
    --sim-accent-soft: color-mix(in srgb, var(--sim-accent) 18%, transparent);
    --sim-ink: ${meok[100]};
    --sim-ink-sub: ${meok[400]};
    --sim-ink-weak: ${meok[500]};
    --sim-rail: rgba(255, 255, 255, 0.13);
    --sim-tick: rgba(255, 255, 255, 0.34);
    --sim-ring: ${surface.dark.surface};
    --sim-pill: rgba(45, 41, 36, 0.82);
    --sim-pill-strong: rgba(45, 41, 36, 0.92);
    --sim-pill-hover: ${surface.dark.card};
    --sim-pill-border: rgba(255, 255, 255, 0.12);
    --sim-accent-wash: rgba(255, 255, 255, 0.08);
  }

  /*
    좁은 화면에서는 3D가 위를 쓰고 글과 조작 카드가 아래를 나눠 쓴다.

    둘 다 절대배치로 vh 상수를 잡아두면 화면이 낮을 때 서로 파고든다 —
    카드가 두꺼워지거나 문장이 한 줄 늘 때마다 상수를 다시 재야 했다.
    아래에서부터 쌓아 올리면 겹칠 자리가 없다. 글이 길면 3D 쪽으로 밀려 올라갈 뿐이다.
  */
  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 1.5vh;
  }
`;

/**
 * 상단 7vh부터. 지붕은 세로 35% 언저리에서 시작하므로 이 띠가 그 위에서 끝나야 한다.
 * 모바일은 3D가 상단 55%를 다 쓰는 터라 글이 아래 45%로 내려간다.
 */
const Copy = styled.div`
  position: absolute;
  top: 5vh;
  left: 0;
  right: 0;
  z-index: 1;
  padding: 0 24px;
  text-align: center;
  pointer-events: none !important;

  /* 흐름으로 내려온다. 자리는 Stage의 flex가 정한다 (top: 48vh 상수를 대신한다). */
  @media (max-width: 767px) {
    position: relative;
    top: auto;
    margin-bottom: 16px;
  }
`;

const TermTag = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--sim-accent);
  white-space: nowrap;
  transition: color ${TINT};

  @media (max-width: 767px) {
    margin-bottom: 8px;
  }

  em {
    padding: 2px 8px;
    border-radius: 9999px;
    background: var(--sim-accent-soft);
    transition: background-color ${TINT};
    font-style: normal;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
`;

/** 문장이 길어져 어색하게 꺾이지 않도록 정갈하게 한 줄 단열 배치한다. */
const Headline = styled.h2`
  margin: 0 auto;
  /*
    44px에서 내려왔다. 큰 글자는 그 자체로 시선을 붙잡는데, 이 화면에서 가장 눈에 띄어야
    하는 건 문장이 아니라 한옥이 드리우는 그림자다. 문장은 그림자를 본 뒤에 읽는 설명이다.
  */
  font-size: clamp(21px, 2.5vw, 34px);
  /* 300은 국문에서 400으로 폴백되기 쉽고, 크림 바탕에서 큰 글자가 날아간다. */
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.25;
  word-break: keep-all;
  white-space: nowrap;
  color: ${INK};
  text-align: center;
  /* key가 절기마다 갈리므로 리마운트된다. 그 리마운트에 실제 동작을 붙인다. */
  animation: ${fadeUp} 0.32s ease-out;

  /* 가장 긴 문장(21자)이 한 줄에 안 들어가기 시작하는 폭. */
  @media (max-width: 768px) {
    font-size: clamp(19px, 2.9vw, 34px);
    white-space: normal;
    text-wrap: balance;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Stats = styled.dl`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: clamp(16px, 2.4vw, 28px);
  margin: 0 0 2px;
`;

const Stat = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  white-space: nowrap !important;
  word-break: keep-all !important;
`;

/** '1m당 그림자', '남중고도' 등의 수치 타이틀 무조건 한 줄 고정 */
const StatLabel = styled.dt`
  font-size: clamp(11px, 1.1vw, 13px);
  font-weight: 500;
  letter-spacing: 0.06em;
  color: ${INK_WEAK};
  white-space: nowrap !important;
  word-break: keep-all !important;
`;

const StatValue = styled.dd`
  margin: 0;
  font-size: clamp(17px, 1.9vw, 24px);
  font-weight: 500;
  letter-spacing: -0.02em;
  /* 자리를 고정폭으로 잡아, 값이 갈릴 때 옆 글자가 흔들리지 않는다. */
  font-variant-numeric: tabular-nums;
  color: ${INK};
  white-space: nowrap !important;
  word-break: keep-all !important;
  /* 8단 스냅이라 숫자는 끊어서 바뀐다. 짧게 받아내면 계기판처럼 읽힌다. */
  animation: ${fadeUp} 0.2s ease-out;

  /*
    이 화면의 주인공은 그림자다. 고도는 원인, 그림자는 결과다.
    둘을 같은 크기로 늘어놓으면 스펙시트 한 줄로 읽힌다 — 주인공만 키운다.
    세로로 세우면 카드가 두꺼워져 한옥을 파고들므로 한 줄에 둔다.
  */
  &[data-lead='true'] {
    font-size: clamp(24px, 2.8vw, 34px);
    letter-spacing: -0.03em;
  }

  small {
    margin-left: 2px;
    font-size: 0.65em;
    font-weight: 500;
    color: ${INK_SUB};
    white-space: nowrap !important;
  }

  @media (max-width: 767px) {
    &[data-lead='true'] {
      font-size: 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Note = styled.p`
  margin: 7px auto 0;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.55;
  word-break: keep-all;
  color: ${INK_SUB};
  pointer-events: none !important;
  /* 헤드라인보다 한 박자 늦게 올라온다. */
  animation: ${fadeUp} 0.32s 0.06s ease-out both;

  @media (max-width: 767px) {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** 카드 바닥의 잔글씨. 상단 카피에 두면 지붕과 겹쳐 읽히지 않는다. */
const Basis = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  /* 구분선 대신 여백으로 뗀다. */
  margin: 18px 0 0;
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
  color: ${INK_WEAK};
`;

const LocationButton = styled.button`
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.2;
  /* 카드가 계절색으로 물드는데 여기만 주홍으로 남아 있었다. */
  color: var(--sim-accent);
  cursor: pointer;
  transition: background 0.2s ease-out, color ${TINT};

  &:hover:not(:disabled) {
    background: var(--sim-accent-wash);
  }

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

const Controller = styled.div`
  position: absolute;
  bottom: clamp(12px, 2.5vh, 28px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: min(92vw, 660px);
  pointer-events: auto;

  /*
    relative를 유지해야 한다. 안쪽의 안내/되돌리기 pill이 이 상자를 기준으로 서므로
    static으로 두면 Stage에 붙어 카드 위가 아니라 화면 위로 날아간다.
  */
  @media (max-width: 767px) {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    width: min(94vw, 440px);
    margin: 0 auto;
  }
`;

/*
  판을 걷는다.

  흰 바탕 위의 흰 판이라 테두리와 그림자로 억지로 띄워야 했던 자리다.
  구도가 아래 띠(CONTROL_BAND)를 비워 두므로 판 자체가 필요 없다 —
  글자와 눈금만 남으면 배경 위에 그대로 선다.

  이 화면에서 그림자는 한옥이 드리우는 것 하나여야 한다. UI에 그림자를 놓으면
  같은 화면에서 그것과 경쟁한다.
*/
const Card = styled.div`
  position: relative;
  padding: 10px 18px 6px;

  @media (max-width: 767px) {
    padding: 6px 12px 4px;
  }
`;

/**
 * 손대기 전에만 서는 안내.
 *
 * 전에는 통계 줄의 세 번째 칸이었다. opacity로만 지워서 손을 대는 순간
 * 카드 오른쪽에 빈 칸이 그대로 남았다(dl 안의 p라 마크업도 어긋났다).
 * '오늘로 돌아가기'와 같은 자리를 나눠 쓴다 — 둘은 동시에 서지 않는다.
 */
const Hint = styled.p`
  position: absolute;
  left: 50%;
  bottom: calc(100% - 12px);
  transform: translateX(-50%);
  margin: 0;
  padding: 6px 14px;
  border-radius: 9999px;
  /* 테두리가 아니라 번짐 없는 테. 자리를 차지하지 않아 알약 크기가 그대로다. */
  box-shadow: 0 0 0 1px var(--sim-pill-border);
  background: var(--sim-pill);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: ${INK_WEAK};
  pointer-events: none;
  animation: ${riseIn} 0.3s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** 손잡이를 잡는 판. 실제 눈금은 안쪽 레일이 갖는다. */
const Track = styled.div`
  position: relative;
  /* 곡선이 솟을 자리. 손가락이 닿는 면도 이 판 전체다. */
  height: ${TRACK_H}px;
  cursor: pointer;
  touch-action: none;

  /* 판 전체를 두르면 눈금에서 한참 떨어진 데 테가 생긴다. 초점은 손잡이에 건다. */
  &:focus-visible {
    outline: none;
  }

  /* 초점 표시는 장식이 아니라 접근성이라 남긴다. 그림자 대신 outline으로 그린다. */
  &:focus-visible span[data-knob] {
    outline: 2px solid var(--sim-accent);
    outline-offset: 3px;
  }
`;

/** 곡선이 솟아오르는 지평선. 이 선이 있어야 곡선의 높이가 '고도'로 읽힌다. */
const Horizon = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--sim-rail);
`;

/*
  고도 곡선.

  가로로 늘여 쓰므로 preserveAspectRatio를 끄는데, 그러면 선 두께까지 같이 늘어난다.
  non-scaling-stroke가 두께만 화면 단위로 잡아준다.

  지나온 자리는 같은 곡선을 덧그린 뒤 왼쪽부터 잘라 보여준다. dash로 자르면 안 된다 —
  non-scaling-stroke는 dash 길이도 화면 단위로 재서 pathLength 정규화가 통하지 않고
  진행도 대신 점선이 그려진다. 잘라내는 건 clip의 몫이다.
*/
const Arc = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;

  /*
    선은 얇게 둔다.

    이 화면에서 가장 눈에 띄어야 하는 건 한옥이 드리우는 그림자다. 조작부가 굵고 짙으면
    시선이 아래에 붙잡혀 정작 볼 것을 못 본다. 조작부는 지금 어디에 서 있는지 알려주는
    표지판이지 주인공이 아니다.
  */
  .rail,
  .fill {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  /* 선만 있으면 눈금 하나로 읽힌다. 아래를 옅게 채워야 '볕이 든 만큼'으로 읽힌다. */
  .area {
    stroke: none;
  }

  /*
    계절이 바뀔 때 면 색이 툭 튀던 자리.

    fill은 url(#…) 참조라 전이할 값이 없다 — 참조가 갈리는 순간 새 그라디언트로 갈아탄다.
    전이는 그라디언트 안쪽, 색을 직접 쥔 stop이 맡아야 한다.
  */
  stop {
    stop-color: var(--sim-accent);
    transition: stop-color ${TINT};
  }

  .rail {
    stroke: var(--sim-rail);
  }

  .fill {
    stroke: var(--sim-accent);
    transition: stroke ${TINT};
  }

  /* 진행도만큼 가로로 편다. 곡선과 같은 좌표계라 손잡이의 x와 정확히 맞물린다. */
  .reveal {
    transform-origin: left;
    transition: transform ${SLIDE};
  }
`;

/** 곡선에 꿴 절기 여덟. 흰 테를 둘러 선 위에 얹힌 구슬처럼 읽힌다. */
const Tick = styled.span`
  position: absolute;
  width: 7px;
  height: 7px;
  margin: 0 0 -3.5px -3.5px;
  border: 2px solid var(--sim-ring);
  border-radius: 50%;
  box-sizing: border-box;
  background: var(--sim-tick);
  transition: background-color ${TINT};

  &[data-passed='true'] {
    background: var(--sim-accent);
  }
`;

/**
 * 곡선을 타고 다니는 해.
 *
 * 좌우로만 움직이면 그냥 손잡이지만, 고도를 따라 같이 오르내리면 그 자체가 해가 된다.
 *
 * 무리(glow)를 둘렀다가 걷었다. 빛나는 것은 그 자체로 시선을 부르는 장치라, 정작 봐야 할
 * 한옥의 그림자에서 눈을 빼앗아 왔다. 자리는 크기와 흰 테만으로 충분히 읽힌다.
 */
const Knob = styled.span`
  position: absolute;
  width: 14px;
  height: 14px;
  margin: 0 0 -7px -7px;
  border: 3px solid var(--sim-ring);
  border-radius: 50%;
  box-sizing: border-box;
  background: var(--sim-accent);
  transition: left ${SLIDE}, bottom ${SLIDE}, background-color ${TINT};
`;

const Labels = styled.div`
  position: relative;
  height: 24px;
  margin-top: 8px;
`;

const Label = styled.button`
  position: absolute;
  /* 레이아웃 높이는 그대로 두고 손가락이 닿는 면만 넓힌다 (18px → 30px). */
  top: -6px;
  padding: 6px;
  transform: translateX(-50%);
  background: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  color: ${INK_WEAK};
  cursor: pointer;
  transition: color ${TINT};

  /* 전에는 활성/비활성이 같은 500이라 굵기 변화가 없었다. */
  &[data-active='true'] {
    font-weight: 600;
    color: var(--sim-accent);
  }

  &:hover {
    color: ${INK_SUB};
  }

  &:focus-visible {
    outline: 2px solid var(--sim-accent);
    outline-offset: 2px;
    border-radius: 9999px;
  }
`;

const BackToToday = styled.button`
  position: absolute;
  left: 50%;
  bottom: calc(100% - 12px);
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 9999px;
  /* 테두리가 아니라 번짐 없는 테. 자리를 차지하지 않아 알약 크기가 그대로다. */
  box-shadow: 0 0 0 1px var(--sim-pill-border);
  background: var(--sim-pill-strong);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: ${ACCENT};
  cursor: pointer;
  transition: color ${TINT};
  animation: ${riseIn} 0.3s ease-out;

  &:hover {
    background: var(--sim-pill-hover);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─────────────────────────────────────────
// LandingSolarShadow
// ─────────────────────────────────────────

export default function SolarShadowPanel() {
  const reduced = usePrefersReducedMotion();
  // 모달이 두 번 열려도 clip id가 겹치지 않게 한다.
  const revealId = useId().replace(/:/g, '');
  const { latitude, cityName, locationState, isSecure, requestLocation } = useUserLocation();
  const setSun = useSceneStore((s) => s.setSun);
  const setAssembling = useSceneStore((s) => s.setAssembling);

  // 오늘에 가장 가까운 절기. 손대지 않았으면 여기가 기준점이다.
  const baseIndex = useMemo(() => stopIndexForDay(getDayOfYear(new Date())), []);

  /**
   * null이면 아직 손대지 않은 상태다.
   * 기준값을 state에 복사해두면 그것을 다시 밀어넣을 effect가 필요해진다.
   * 손댄 값만 들고 있으면 그 동기화가 통째로 사라진다.
   */
  const [userIndex, setUserIndex] = useState(null);

  const index = userIndex ?? baseIndex;
  const touched = userIndex !== null;

  const drag = useRef(null);
  const tween = useRef(0);

  const view = STOPS[index];
  const pair = view.pairId ? STOPS.find((stop) => stop.id === view.pairId) : null;

  /*
    씬 모드를 직접 선언한다. 조립 모달을 먼저 열었다면 store에 assembling이 남아 있어
    완성된 한옥 대신 기단만 선 조립 모델이 서고, 그림자를 드리울 몸체가 없다.
    앞 모달의 정리(cleanup) 순서에 기대지 않는다.
  */
  useEffect(() => {
    setAssembling(false);
  }, [setAssembling]);

  /*
    캔버스의 주광에 이 절기의 남중고도를 넘긴다.
    3D 그림자 길이는 저쪽에서 높이 / tan(고도)로 떨어지므로, 화면의 그림자와
    위에 적힌 숫자가 같은 값에서 나온다.
  */
  useEffect(() => {
    setSun({ altitude: view.altitude, value: view.seasonValue });
  }, [view.altitude, view.seasonValue, setSun]);

  useEffect(
    () => () => {
      cancelAnimationFrame(tween.current);
      useSceneStore.getState().setSun(null);
    },
    [],
  );

  const today = new Date();
  const todayAltitude = getNoonSolarAltitude(latitude, today);

  const moveTo = (next) => {
    cancelAnimationFrame(tween.current);
    setUserIndex(Math.min(LAST, Math.max(0, Math.round(next))));
  };

  /** 끄는 자리에서 가장 가까운 칸으로 붙는다. */
  const indexFromX = (clientX, element) => {
    const rect = element.getBoundingClientRect();
    return clamp01((clientX - rect.left) / Math.max(1, rect.width)) * LAST;
  };

  const start = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = event.currentTarget;
    moveTo(indexFromX(event.clientX, event.currentTarget));
  };

  const move = (event) => {
    if (!drag.current) return;
    moveTo(indexFromX(event.clientX, drag.current));
  };

  const end = () => {
    drag.current = null;
  };

  const onKeyDown = (event) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

    if (step !== undefined) {
      event.preventDefault();
      moveTo(index + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveTo(LAST);
    }
  };

  /**
   * 기준 절기로 한 칸씩 걸어 돌아간다.
   * 한 번에 뛰면 그림자가 순간이동하므로 중간 절기를 밟고 지나간다.
   */
  const returnToBase = () => {
    cancelAnimationFrame(tween.current);

    // 모션을 줄인 사용자에게는 애니메이션 자체가 방해다. 바로 놓는다.
    if (reduced) {
      setUserIndex(null);
      return;
    }

    const from = index;
    const startedAt = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - startedAt) / RETURN_MS);

      if (t < 1) {
        setUserIndex(Math.round(from + (baseIndex - from) * easeOut(t)));
        tween.current = requestAnimationFrame(step);
      } else {
        setUserIndex(null);
      }
    };

    tween.current = requestAnimationFrame(step);
  };

  const showReturn = touched && index !== baseIndex;
  const percent = (index / LAST) * 100;
  // 절기 색 두 벌을 Stage에 얹으면 나머지는 전부 변수를 타고 따라온다.
  const tint = termTint(view.id);

  return (
    <Stage aria-label="절기에 따른 처마 그림자" style={tint}>
      <Copy>
        <TermTag>
          {`${view.name} · ${view.month}월 ${view.day}일`}
          {pair && <em>{`${pair.name}과 같은 고도`}</em>}
        </TermTag>

        <Headline key={view.id}>{view.headline}</Headline>

        <Note key={`${view.id}-reach`}>{view.sunlightReach}</Note>
      </Copy>

      <Controller>
        {/* 카드 위 한 자리를 두 상태가 나눠 쓴다. 손대기 전엔 안내, 옮긴 뒤엔 되돌리기. */}
        {showReturn ? (
          <BackToToday type="button" onClick={returnToBase}>
            오늘로 돌아가기
          </BackToToday>
        ) : (
          !touched && <Hint>절기를 옮겨 그림자를 보세요</Hint>
        )}

        <Card>
          <Stats>
            <Stat>
              <StatLabel>1m당 그림자</StatLabel>
              <StatValue key={`${view.id}-shadow`} data-lead="true">
                {Math.round(view.shadow)}
                <small>cm</small>
              </StatValue>
            </Stat>

            <Stat>
              <StatLabel>남중고도</StatLabel>
              <StatValue key={`${view.id}-altitude`}>
                {view.altitude}
                <small>°</small>
              </StatValue>
            </Stat>
          </Stats>

          <Track
            tabIndex={0}
            role="slider"
            aria-label="절기"
            aria-valuemin={0}
            aria-valuemax={LAST}
            aria-valuenow={index}
            aria-valuetext={`${view.name}, 남중고도 ${view.altitude}도, 1미터당 그림자 ${Math.round(view.shadow)}센티미터`}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onKeyDown={onKeyDown}
          >
            <Horizon />

            <Arc viewBox={`0 0 100 ${TRACK_H}`} preserveAspectRatio="none" aria-hidden="true">
              <clipPath id={revealId}>
                <rect
                  className="reveal"
                  x="0"
                  y="0"
                  width="100"
                  height={TRACK_H}
                  style={{ transform: `scaleX(${percent / 100})` }}
                />
              </clipPath>

              <linearGradient id={`${revealId}-sun`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopOpacity="0.09" />
                <stop offset="100%" stopOpacity="0" />
              </linearGradient>

              <path
                className="area"
                d={AREA_PATH}
                fill={`url(#${revealId}-sun)`}
                clipPath={`url(#${revealId})`}
              />

              <path className="rail" d={ARC_PATH} />
              <path
                className="fill"
                d={ARC_PATH}
                clipPath={`url(#${revealId})`}
              />
            </Arc>

            {POINTS.map((point, i) => (
              <Tick
                key={STOPS[i].id}
                data-passed={i <= index}
                style={{ left: `${point.x}%`, bottom: `${point.y}px` }}
              />
            ))}

            <Knob
              data-knob
              style={{ left: `${percent}%`, bottom: `${POINTS[index].y}px` }}
            />
          </Track>

          <Labels>
            {STOPS.map((stop, i) => (
              <Label
                key={stop.id}
                type="button"
                data-active={i === index}
                style={{
                  left: `${(i / LAST) * 100}%`,
                  /* 양 끝은 중앙 정렬하면 절반이 카드 밖으로 나간다. 안쪽으로 붙인다. */
                  transform: `translateX(${i === 0 ? '0%' : i === LAST ? '-100%' : '-50%'})`,
                }}
                onClick={() => moveTo(i)}
              >
                {stop.name}
              </Label>
            ))}
          </Labels>

          <Basis>
            <span>
              {SHADOW.place} 정오 기준 · 오늘 {today.getMonth() + 1}월 {today.getDate()}일{' '}
              {cityName}
              {locationState === 'granted' ? '' : ' 기준'} 고도 {Math.round(todayAltitude)}°
            </span>

            {isSecure && locationState === 'idle' && (
              <LocationButton type="button" onClick={requestLocation}>
                <MapPin size={13} strokeWidth={2} aria-hidden="true" />
                내 위치로 보기
              </LocationButton>
            )}

            {isSecure && locationState === 'requesting' && (
              <LocationButton type="button" disabled>
                확인 중…
              </LocationButton>
            )}

            {locationState === 'denied' && (
              <LocationButton type="button" disabled style={{ color: INK_WEAK }}>
                위치 권한 차단됨
              </LocationButton>
            )}
          </Basis>
        </Card>
      </Controller>
    </Stage>
  );
}
