'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { BEAT_RANGES } from '../scroll-core/constants';
import { useSceneStore } from '../scroll-core/sceneStore';
import useUserLocation from '@/hooks/useUserLocation';
import SHADOW from '@/data/solarShadow.json';
import { altitudeToSeasonValue, getDayOfYear, getNoonSolarAltitude } from '@/utils/solar';

import { clamp01, easeOut, usePrefersReducedMotion } from './LandingSectionFrame';

export const RANGE = BEAT_RANGES.BEAT3;

const [START, END] = RANGE;

const FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, sans-serif";








import { lightPalette, meok, surface } from '@/design-system/tokens';

const INK = meok[900];
const INK_SUB = meok[700];
const INK_WEAK = meok[500];
const LINE = 'rgba(78, 89, 104, 0.14)';
const ACCENT = lightPalette.juhong[500];
const ACCENT_VIVID = lightPalette.juhong[500];













const SEASON_ACCENTS = {
  spring: { primary: lightPalette.jangmi[500], bg: lightPalette.jangmi[50] },
  summer: { primary: lightPalette.juhong[500], bg: lightPalette.juhong[50] },
  autumn: { primary: lightPalette.hwanggeum[500], bg: lightPalette.hwanggeum[50] },
  winter: { primary: lightPalette.juhong[800], bg: lightPalette.juhong[200] },
};




const SEASON_STAGE_BG = {
  spring: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.jangmi[50]}FA 0%, ${lightPalette.juhong[50]}C8 45%, ${surface.light.base} 100%)`,
  summer: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.hwanggeum[50]}FA 0%, ${lightPalette.juhong[50]}B8 45%, ${surface.light.base} 100%)`,
  autumn: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.hwanggeum[100]}F0 0%, ${lightPalette.hwanggeum[50]}C8 45%, ${surface.light.base} 100%)`,
  winter: `radial-gradient(ellipse 85% 70% at 50% 25%, ${lightPalette.juhong[200]}FA 0%, ${lightPalette.cheongrok[50]}B8 45%, ${surface.light.base} 100%)`,
};




const STOPS = SHADOW.stops.map((stop) => ({
  ...stop,
  dayOfYear: getDayOfYear(new Date(2026, stop.month - 1, stop.day)),
  seasonValue: altitudeToSeasonValue(stop.altitude, SHADOW.latitude),
}));

const LAST = STOPS.length - 1;
const RETURN_MS = 600;


function stopIndexForDay(day) {
  let best = 0;

  for (let i = 1; i < STOPS.length; i += 1) {
    if (Math.abs(STOPS[i].dayOfYear - day) < Math.abs(STOPS[best].dayOfYear - day)) best = i;
  }

  return best;
}





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
  font-weight: 500;
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


const StatLabel = styled.dt`
  font-size: clamp(11px, 1.1vw, 13px);
  font-weight: 500;
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





const Card = styled.div`
  position: relative;
  padding: 10px 18px 6px;
  border-radius: 16px;
  background: ${surface.light.card};
  backdrop-filter: blur(16px);
  @media (max-width: 767px) {
    padding: 8px 12px 4px;
    border-radius: 14px;
  }
`;


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


const Hint = styled.p`
  margin: 0 0 0 auto;
  font-size: 12px;
  font-weight: 500;
  color: ${INK_WEAK};
  transition: opacity 0.4s ease-out;
`;


const Track = styled.div`
  position: relative;
  height: 28px;
  cursor: pointer;
  touch-action: none;

  &:focus-visible {
    outline: none;
  }

  &:focus-visible span[data-knob] {
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
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
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
    outline: 2px solid ${ACCENT_VIVID};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;





export default function LandingSolarShadow({ progress }) {
  const reduced = usePrefersReducedMotion();
  const { latitude, cityName, locationState, isSecure, requestLocation } = useUserLocation();
  const setSun = useSceneStore((s) => s.setSun);


  const baseIndex = useMemo(() => stopIndexForDay(getDayOfYear(new Date())), []);






  const [userIndex, setUserIndex] = useState(null);

  const index = userIndex ?? baseIndex;
  const touched = userIndex !== null;

  const drag = useRef(null);
  const tween = useRef(0);

  const view = STOPS[index];
  const pair = view.pairId ? STOPS.find((stop) => stop.id === view.pairId) : null;
  const inRange = progress >= START && progress < END;






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





  const returnToBase = () => {
    cancelAnimationFrame(tween.current);


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
