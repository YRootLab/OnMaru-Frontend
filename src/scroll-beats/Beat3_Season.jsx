'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { BEAT_RANGES } from '@/scroll-core/constants';
import { useSceneStore } from '@/scroll-core/sceneStore';
import useUserLocation from '@/hooks/useUserLocation';
import SHADOW from '@/data/solarShadow.json';
import { altitudeToSeasonValue, getDayOfYear, getNoonSolarAltitude } from '@/utils/solar';

import { clamp01, easeOut, usePrefersReducedMotion } from './BeatFrame';

export const RANGE = BEAT_RANGES.BEAT3;

const [START, END] = RANGE;

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

// ─────────────────────────────────────────
// 색
//
// 배경이 크림(#F7EEDC)이라 글자는 전부 어두운 쪽에서 고른다.
// 액센트는 주홍 하나로 통일했다 — 전에는 주홍과 금색이 한 화면에서 갈라져 있었다.
// ─────────────────────────────────────────

import { lightPalette, meok, surface } from '@/design-system/tokens';

const INK = meok[900];
const INK_SUB = meok[700];
const INK_WEAK = meok[500];
const LINE = 'rgba(78, 89, 104, 0.14)';
const ACCENT = lightPalette.juhong[500];
const ACCENT_VIVID = lightPalette.juhong[500];

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
 * 섹션 배경화면 (Section Background) 계절별 그라데이션 토큰 연동
 */
const SEASON_STAGE_BG = {
  spring: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.jangmi[50]}FA 0%, ${lightPalette.juhong[50]}C8 45%, ${surface.light.base} 100%)`,
  summer: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.hwanggeum[50]}FA 0%, ${lightPalette.juhong[50]}B8 45%, ${surface.light.base} 100%)`,
  autumn: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.hwanggeum[100]}F0 0%, ${lightPalette.hwanggeum[50]}C8 45%, ${surface.light.base} 100%)`,
  winter: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.kobalt[50]}FA 0%, ${lightPalette.cheongrok[50]}B8 45%, ${surface.light.base} 100%)`,
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

const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none !important;
  font-family: ${FONT};
  background: transparent;
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

  @media (max-width: 767px) {
    top: 48vh;
  }
`;

const TermTag = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${(props) => props.accentColor || lightPalette.juhong[500]};
  white-space: nowrap;

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
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
  word-break: keep-all;
  white-space: nowrap;
  color: ${INK};
  text-align: center;

  @media (max-width: 600px) {
    white-space: normal;
    text-wrap: balance;
  }
`;

const Stats = styled.dl`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(16px, 2.4vw, 28px);
  margin: 0 0 6px;
`;

const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(14px, 2vw, 24px);

  @media (max-width: 600px) {
    gap: 10px;
  }
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap !important;
  word-break: keep-all !important;
`;

/** '1m당 그림자', '남중고도' 등의 수치 타이틀 무조건 한 줄 고정 */
const StatLabel = styled.dt`
  font-size: clamp(11px, 1.1vw, 13px);
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${INK_WEAK};
  white-space: nowrap !important;
  word-break: keep-all !important;
`;

const StatValue = styled.dd`
  margin: 0;
  font-size: clamp(17px, 1.9vw, 24px);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: ${INK};
  white-space: nowrap !important;
  word-break: keep-all !important;

  small {
    margin-left: 2px;
    font-size: 0.65em;
    font-weight: 500;
    color: ${INK_SUB};
    white-space: nowrap !important;
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
`;

/** 카드 바닥의 잔글씨. 상단 카피에 두면 지붕과 겹쳐 읽히지 않는다. */
const Basis = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0 0;
  padding-top: 10px;
  border-top: 1px solid ${LINE};
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
  color: ${INK_WEAK};
`;

const LocationButton = styled.button`
  pointer-events: auto;
  padding: 4px 10px;
  border: 1px solid rgba(160, 58, 10, 0.28);
  border-radius: 9999px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.2;
  color: ${ACCENT};
  cursor: pointer;
  transition: background 0.2s ease-out;

  &:hover:not(:disabled) {
    background: rgba(160, 58, 10, 0.07);
  }

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT_VIVID};
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

  @media (max-width: 767px) {
    width: min(94vw, 440px);
    bottom: 1.5vh;
  }
`;

/**
 * 흰 카드 하나.
 * 3D 모델 및 그림자 하단부를 절대 침범하지 않도록 슬림하고 밀도 높은 반응형 카드 구성.
 */
const Card = styled.div`
  position: relative;
  padding: 10px 18px 6px;
  border: 1px solid ${LINE};
  border-radius: 16px;
  background: ${surface.light.card};
  backdrop-filter: blur(16px);
  box-shadow: 0 4px 20px rgba(25, 31, 40, 0.06);

  @media (max-width: 767px) {
    padding: 8px 12px 4px;
    border-radius: 14px;
  }
`;

/** 숫자를 풀어 쓴 한 줄. 값과 문장이 늘 같은 절기를 말하도록 카드 안에 함께 둔다. */
const StatNote = styled.dd`
  align-self: center;
  margin: 0 0 0 4px;
  font-size: 12px;
  line-height: 1.45;
  word-break: keep-all;
  text-wrap: balance;
  color: ${INK_SUB};

  @media (max-width: 900px) {
    display: none;
  }
`;

const ReachText = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  color: ${ACCENT};
  text-align: center;
  word-break: keep-all;
  text-wrap: balance;
`;

/** 통계 오른쪽 끝에 붙어, 손을 대면 조용히 사라진다. */
const Hint = styled.p`
  margin: 0 0 0 auto;
  font-size: 12px;
  font-weight: 500;
  color: ${INK_WEAK};
  transition: opacity 0.4s ease-out;
`;

/** 손잡이를 잡는 판. 실제 눈금은 안쪽 레일이 갖는다. */
const Track = styled.div`
  position: relative;
  height: 28px;
  cursor: pointer;
  touch-action: none;

  &:focus-visible {
    outline: none;
  }

  &:focus-visible span[data-knob] {
    box-shadow: 0 0 0 4px rgba(232, 90, 24, 0.24);
  }
`;

const Rail = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  margin-top: -2px;
  border-radius: 2px;
  background: #eceef1;
`;

const Fill = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 2px;
  background: ${(props) => props.accentColor || lightPalette.juhong[500]};
  transition: background-color 0.35s ease;
`;

const Tick = styled.span`
  position: absolute;
  top: 50%;
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  border-radius: 50%;
  background: #d5d9de;

  &[data-passed='true'] {
    background: rgba(255, 255, 255, 0.92);
  }
`;

const Knob = styled.span`
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid ${(props) => props.accentColor || lightPalette.juhong[500]};
  box-shadow: 0 2px 8px rgba(25, 31, 40, 0.18);
  transition: border-color 0.35s ease, box-shadow 0.2s ease-out;
`;

const Labels = styled.div`
  position: relative;
  height: 18px;
  margin-top: 8px;
`;

const Label = styled.button`
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  padding: 0 2px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  color: ${INK_WEAK};
  cursor: pointer;
  transition: color 0.25s ease-out;

  &[data-active='true'] {
    font-weight: 700;
    color: ${(props) => props.accentColor || lightPalette.juhong[500]};
  }

  &:hover {
    color: ${INK_SUB};
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
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
  border: 1px solid ${LINE};
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  color: ${ACCENT};
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(25, 31, 40, 0.08);
  animation: ${riseIn} 0.3s ease-out;

  &:hover {
    background: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT_VIVID};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─────────────────────────────────────────
// Beat3_Season
// ─────────────────────────────────────────

export default function Beat3_Season({ progress }) {
  const reduced = usePrefersReducedMotion();
  const { latitude, cityName, locationState, isSecure, requestLocation } = useUserLocation();
  const setSun = useSceneStore((s) => s.setSun);

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
  const inRange = progress >= START && progress < END;

  /*
    고정 캔버스의 주광에 이 절기의 남중고도를 넘긴다.
    3D 그림자 길이는 저쪽에서 높이 / tan(고도)로 떨어지므로, 화면의 그림자와
    위에 적힌 숫자가 같은 값에서 나온다. 구간 밖에서는 놓아준다.
  */
  useEffect(() => {
    setSun(inRange ? { altitude: view.altitude, value: view.seasonValue } : null);
  }, [inRange, view.altitude, view.seasonValue, setSun]);

  useEffect(
    () => () => {
      cancelAnimationFrame(tween.current);
      useSceneStore.getState().setSun(null);
    },
    [],
  );

  if (!inRange) return null;

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
  const seasonStageBg = SEASON_STAGE_BG[view.season] || SEASON_STAGE_BG.spring;

  return (
    <Stage aria-label="절기에 따른 처마 그림자" bgGradient={seasonStageBg}>
      <Copy>
        <TermTag accentColor={seasonTheme.primary} bgAccent={seasonTheme.bg}>
          {`${view.name} · ${view.month}월 ${view.day}일`}
          {pair && <em>{`${pair.name}과 같은 고도`}</em>}
        </TermTag>

        <Headline key={view.id}>{view.headline}</Headline>

        <Note key={`${view.id}-reach`}>{view.sunlightReach}</Note>
      </Copy>

      <Controller>
        {showReturn && (
          <BackToToday type="button" onClick={returnToBase} style={{ color: seasonTheme.primary }}>
            오늘로 돌아가기
          </BackToToday>
        )}

        <Card>
          <Stats>
            <Stat>
              <StatLabel>남중고도</StatLabel>
              <StatValue>
                {view.altitude}
                <small>°</small>
              </StatValue>
            </Stat>

            <Stat>
              <StatLabel>1m당 그림자</StatLabel>
              <StatValue>
                {Math.round(view.shadow)}
                <small>cm</small>
              </StatValue>
            </Stat>

            <Hint style={{ opacity: touched ? 0 : 1 }}>절기를 옮겨 그림자를 보세요</Hint>
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
                style={{ left: `${(i / LAST) * 100}%` }}
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
                내 위치로 보기
              </LocationButton>
            )}

            {isSecure && locationState === 'requesting' && (
              <LocationButton type="button" disabled>
                확인 중…
              </LocationButton>
            )}

            {locationState === 'denied' && (
              <LocationButton type="button" disabled style={{ color: INK_WEAK, borderColor: LINE }}>
                위치 권한 차단됨
              </LocationButton>
            )}
          </Basis>
        </Card>
      </Controller>
    </Stage>
  );
}
