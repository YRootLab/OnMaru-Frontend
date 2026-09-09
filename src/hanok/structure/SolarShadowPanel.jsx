'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

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

import { lightPalette, meok } from '@/design-system/tokens';

const INK = meok[900];
const INK_SUB = meok[700];
const INK_WEAK = meok[500];
const ACCENT = lightPalette.juhong[500];

/**
 * 손잡이와 채움이 절기 사이를 건너는 시간·곡선.
 *
 * sceneStore의 TWEEN_MS(420ms) / easeInOutCubic과 같은 값이라야 한다.
 * 다르면 손은 먼저 붙고 3D 볕은 뒤늦게 따라온다.
 */
const SLIDE = '0.42s cubic-bezier(0.65, 0, 0.35, 1)';

/**
 * 계절별 온마루 세맨틱 토큰 매핑
 * - 봄 (spring): jangmi[500] (#D42058) / jangmi[50] (#FFF0F4)
 * - 여름 (summer): juhong[500] (#E85A18) / juhong[50] (#FFF0E6)
 * - 가을 (autumn): hwanggeum[500] (#C07808) / hwanggeum[50] (#FFF8E0)
 * - 겨울 (winter): kobalt[500] (#2B5CE6) / kobalt[50] (#EBF0FF)
 */
const SEASON_ACCENTS = {
  spring: { primary: lightPalette.jangmi[500], bg: lightPalette.jangmi[50] },
  summer: { primary: lightPalette.juhong[500], bg: lightPalette.juhong[50] },
  autumn: { primary: lightPalette.hwanggeum[500], bg: lightPalette.hwanggeum[50] },
  winter: { primary: lightPalette.kobalt[500], bg: lightPalette.kobalt[50] },
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
  color: ${(props) => props.accentColor || lightPalette.juhong[500]};
  white-space: nowrap;

  @media (max-width: 767px) {
    margin-bottom: 8px;
  }

  em {
    padding: 2px 8px;
    border-radius: 9999px;
    background: ${(props) => props.bgAccent || 'rgba(232, 90, 24, 0.09)'};
    font-style: normal;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
`;

/** 문장이 길어져 어색하게 꺾이지 않도록 정갈하게 한 줄 단열 배치한다. */
const Headline = styled.h2`
  margin: 0 auto;
  font-size: clamp(22px, 3.2vw, 44px);
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
    font-size: clamp(20px, 3.2vw, 44px);
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
  margin: 14px auto 0;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.55;
  word-break: keep-all;
  color: ${INK_SUB};
  pointer-events: none !important;
  /* 헤드라인보다 한 박자 늦게 올라온다. */
  animation: ${fadeUp} 0.32s 0.06s ease-out both;

  @media (max-width: 767px) {
    margin-top: 10px;
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
  padding: 4px 10px;
  border-radius: 9999px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.2;
  /* 카드가 계절색으로 물드는데 여기만 주홍으로 남아 있었다. */
  color: ${(props) => props.accentColor || ACCENT};
  cursor: pointer;
  transition: background 0.2s ease-out;

  &:hover:not(:disabled) {
    background: rgba(160, 58, 10, 0.07);
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
  bottom: calc(100% + 12px);
  transform: translateX(-50%);
  margin: 0;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.82);
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
  /* 손가락이 닿는 면. 보이는 두께는 Rail이 따로 가지므로 키워도 눈금은 그대로다. */
  height: 44px;
  cursor: pointer;
  touch-action: none;

  /* 판 전체를 두르면 눈금에서 한참 떨어진 데 테가 생긴다. 초점은 손잡이에 건다. */
  &:focus-visible {
    outline: none;
  }

  /* 초점 표시는 장식이 아니라 접근성이라 남긴다. 그림자 대신 outline으로 그린다. */
  &:focus-visible span[data-knob] {
    outline: 2px solid ${(props) => props.accentColor || lightPalette.juhong[500]};
    outline-offset: 3px;
    border-radius: 3px;
  }
`;

/*
  눈금자.

  알약 레일에 둥근 손잡이를 얹으면 어느 앱에나 있는 기본 슬라이더로 읽힌다.
  절기는 한 해를 여덟로 나눈 눈금이므로 계기의 눈금자로 그린다 —
  가는 실선 하나에 세로 눈금 여덟, 지금 선 자리만 길고 진하다.

  눈금이 서는 바닥선이자 지나온 자리를 재는 기준선. 아래 11px은 손잡이와 나눠 쓴다.
*/
const RULE_BOTTOM = '11px';

const Rail = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: ${RULE_BOTTOM};
  height: 1px;
  background: ${meok[200]};
`;

const Fill = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  height: 1px;
  background: ${(props) => props.accentColor || lightPalette.juhong[500]};
  transition: width ${SLIDE}, background-color 0.35s ease;
`;

const Tick = styled.span`
  position: absolute;
  bottom: 0;
  width: 1px;
  height: 7px;
  margin-left: -0.5px;
  background: ${meok[400]};
  transition: background-color 0.35s ease;

  &[data-passed='true'] {
    background: ${meok[700]};
  }
`;

/**
 * 지금 선 자리를 가리키는 날.
 *
 * 눈금자 위의 지침이라 눈금과 같은 바닥선에서 자란다. 둥근 손잡이를 얹으면
 * 눈금자가 도로 기본 슬라이더로 보인다 — 눈금 중 하나가 길어진 것처럼 세운다.
 * 잡는 면은 Track이 44px로 따로 갖고 있으므로 얇아도 조작에는 지장이 없다.
 */
const Knob = styled.span`
  position: absolute;
  bottom: ${RULE_BOTTOM};
  width: 3px;
  height: 20px;
  margin-left: -1.5px;
  border-radius: 1.5px;
  background: ${(props) => props.accentColor || lightPalette.juhong[500]};
  transition: left ${SLIDE}, background-color 0.35s ease;
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
  transition: color 0.25s ease-out;

  /* 전에는 활성/비활성이 같은 500이라 굵기 변화가 없었다. */
  &[data-active='true'] {
    font-weight: 600;
    color: ${(props) => props.accentColor || lightPalette.juhong[500]};
  }

  &:hover {
    color: ${INK_SUB};
  }

  &:focus-visible {
    outline: 2px solid ${(props) => props.accentColor || lightPalette.juhong[500]};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const BackToToday = styled.button`
  position: absolute;
  left: 50%;
  bottom: calc(100% + 12px);
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: ${ACCENT};
  cursor: pointer;
  animation: ${riseIn} 0.3s ease-out;

  &:hover {
    background: #ffffff;
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
  const seasonTheme = SEASON_ACCENTS[view.season] || SEASON_ACCENTS.summer;

  return (
    <Stage aria-label="절기에 따른 처마 그림자">
      <Copy>
        <TermTag accentColor={seasonTheme.primary} bgAccent={seasonTheme.bg}>
          {`${view.name} · ${view.month}월 ${view.day}일`}
          {pair && <em>{`${pair.name}과 같은 고도`}</em>}
        </TermTag>

        <Headline key={view.id}>{view.headline}</Headline>

        <Note key={`${view.id}-reach`}>{view.sunlightReach}</Note>
      </Copy>

      <Controller>
        {/* 카드 위 한 자리를 두 상태가 나눠 쓴다. 손대기 전엔 안내, 옮긴 뒤엔 되돌리기. */}
        {showReturn ? (
          <BackToToday type="button" onClick={returnToBase} style={{ color: seasonTheme.primary }}>
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
            accentColor={seasonTheme.primary}
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
            <Rail>
              <Fill accentColor={seasonTheme.primary} style={{ width: `${percent}%` }} />

              {STOPS.map((stop, i) => {
                const at = (i / LAST) * 100;
                return (
                  <Tick key={stop.id} data-passed={at <= percent} style={{ left: `${at}%` }} />
                );
              })}
            </Rail>

            <Knob accentColor={seasonTheme.primary} data-knob style={{ left: `${percent}%` }} />
          </Track>

          <Labels>
            {STOPS.map((stop, i) => (
              <Label
                key={stop.id}
                type="button"
                accentColor={seasonTheme.primary}
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
              <LocationButton
                type="button"
                accentColor={seasonTheme.primary}
                onClick={requestLocation}
              >
                내 위치로 보기
              </LocationButton>
            )}

            {isSecure && locationState === 'requesting' && (
              <LocationButton type="button" accentColor={seasonTheme.primary} disabled>
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
