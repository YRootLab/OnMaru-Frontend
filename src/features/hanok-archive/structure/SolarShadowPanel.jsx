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








import { meok, surface } from '@/design-system/tokens';








const INK = 'var(--sim-ink)';
const INK_SUB = 'var(--sim-ink-sub)';
const INK_WEAK = 'var(--sim-ink-weak)';


const ACCENT = 'var(--sim-accent)';







const SLIDE = '0.42s cubic-bezier(0.65, 0, 0.35, 1)';







const TINT = '0.42s ease-out';

















const TERM_TINTS = {

  ipchun:  ['#8A9A5B', '#B3C486'],
  chunbun:  ['#B57F86', '#D9A7AD'],
  ipha:  ['#6E9B72', '#96C49B'],
  haji:  ['#D2913F', '#E8B878'],
  ipchu:  ['#B87A4E', '#DDA377'],
  chubun:  ['#96854A', '#C2B074'],
  ipdong:  ['#8A6355', '#B08E7F'],
  dongji:  ['#6B4A42', '#977065'],
};








const termTint = (id) => {
  const [light, dark] = TERM_TINTS[id] || TERM_TINTS.haji;
  return { '--term-light': light, '--term-dark': dark };
};




const STOPS = SHADOW.stops.map((stop) => ({
  ...stop,
  dayOfYear: getDayOfYear(new Date(2026, stop.month - 1, stop.day)),
  seasonValue: altitudeToSeasonValue(stop.altitude, SHADOW.latitude),
}));

const LAST = STOPS.length - 1;
const RETURN_MS = 600;








const TRACK_H = 76;
const ARC_BOTTOM = 16;
const ARC_BAND = 46;

const ALT_MIN = Math.min(...STOPS.map((stop) => stop.altitude));
const ALT_MAX = Math.max(...STOPS.map((stop) => stop.altitude));


const POINTS = STOPS.map((stop, i) => ({
  x: (i / LAST) * 100,
  y: ARC_BOTTOM + ((stop.altitude - ALT_MIN) / (ALT_MAX - ALT_MIN)) * ARC_BAND,
}));







const ARC_PATH = (() => {
  const p = POINTS.map((pt) => ({ x: pt.x, y: TRACK_H - pt.y }));

  return p.reduce((d, cur, i) => {
    if (i === 0) return `M ${cur.x} ${cur.y}`;
    const prev = p[i - 1];
    const mid = (prev.x + cur.x) / 2;
    return `${d} C ${mid} ${prev.y} ${mid} ${cur.y} ${cur.x} ${cur.y}`;
  }, '');
})();


const AREA_PATH = `${ARC_PATH} L 100 ${TRACK_H} L 0 ${TRACK_H} Z`;


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




  --sim-accent: var(--term-light);
  --sim-accent-soft: color-mix(in srgb, var(--sim-accent) 12%, transparent);
  --sim-ink: ${meok[900]};
  --sim-ink-sub: ${meok[700]};
  --sim-ink-weak: ${meok[500]};
  --sim-rail: ${meok[200]};
  --sim-tick: ${meok[400]};

  --sim-ring: #ffffff;
  --sim-pill: rgba(255, 255, 255, 0.82);
  --sim-pill-strong: rgba(255, 255, 255, 0.92);
  --sim-pill-hover: #ffffff;
  --sim-pill-border: ${meok[200]};
  --sim-accent-wash: rgba(160, 58, 10, 0.07);


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








  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 1.5vh;
  }
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


const Headline = styled.h2`
  margin: 0 auto;




  font-size: clamp(21px, 2.5vw, 34px);

  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.25;
  word-break: keep-all;
  white-space: nowrap;
  color: ${INK};
  text-align: center;

  animation: ${fadeUp} 0.32s ease-out;


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

  font-variant-numeric: tabular-nums;
  color: ${INK};
  white-space: nowrap !important;
  word-break: keep-all !important;

  animation: ${fadeUp} 0.2s ease-out;






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


const Basis = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;

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





  @media (max-width: 767px) {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    width: min(94vw, 440px);
    margin: 0 auto;
  }
`;











const Card = styled.div`
  position: relative;
  padding: 10px 18px 6px;

  @media (max-width: 767px) {
    padding: 6px 12px 4px;
  }
`;








const Hint = styled.p`
  position: absolute;
  left: 50%;
  bottom: calc(100% - 12px);
  transform: translateX(-50%);
  margin: 0;
  padding: 6px 14px;
  border-radius: 9999px;

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


const Track = styled.div`
  position: relative;

  height: ${TRACK_H}px;
  cursor: pointer;
  touch-action: none;


  &:focus-visible {
    outline: none;
  }


  &:focus-visible span[data-knob] {
    outline: 2px solid var(--sim-accent);
    outline-offset: 3px;
  }
`;


const Horizon = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--sim-rail);
`;











const Arc = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;








  .rail,
  .fill {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }


  .area {
    stroke: none;
  }







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


  .reveal {
    transform-origin: left;
    transition: transform ${SLIDE};
  }
`;


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





export default function SolarShadowPanel() {
  const reduced = usePrefersReducedMotion();

  const revealId = useId().replace(/:/g, '');
  const { latitude, cityName, locationState, isSecure, requestLocation } = useUserLocation();
  const setSun = useSceneStore((s) => s.setSun);
  const setAssembling = useSceneStore((s) => s.setAssembling);


  const baseIndex = useMemo(() => stopIndexForDay(getDayOfYear(new Date())), []);






  const [userIndex, setUserIndex] = useState(null);






  const [interacting, setInteracting] = useState(false);

  const index = userIndex ?? baseIndex;
  const touched = userIndex !== null;

  const drag = useRef(null);
  const tween = useRef(0);

  const view = STOPS[index];
  const pair = view.pairId ? STOPS.find((stop) => stop.id === view.pairId) : null;






  useEffect(() => {
    setAssembling(false);
  }, [setAssembling]);






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


  const indexFromX = (clientX, element) => {
    const rect = element.getBoundingClientRect();
    return clamp01((clientX - rect.left) / Math.max(1, rect.width)) * LAST;
  };

  const start = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = event.currentTarget;
    setInteracting(true);
    moveTo(indexFromX(event.clientX, event.currentTarget));
  };

  const move = (event) => {
    if (!drag.current) return;
    moveTo(indexFromX(event.clientX, drag.current));
  };

  const end = () => {
    drag.current = null;
    setInteracting(false);
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

    setInteracting(true);
    const from = index;
    const startedAt = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - startedAt) / RETURN_MS);

      if (t < 1) {
        setUserIndex(Math.round(from + (baseIndex - from) * easeOut(t)));
        tween.current = requestAnimationFrame(step);
      } else {
        setUserIndex(null);
        setInteracting(false);
      }
    };

    tween.current = requestAnimationFrame(step);
  };

  const showReturn = touched && index !== baseIndex;
  const percent = (index / LAST) * 100;

  const animKey = interacting ? 'live' : view.id;

  const tint = termTint(view.id);

  return (
    <Stage aria-label="절기에 따른 처마 그림자" style={tint}>
      <Copy>
        <TermTag>
          {`${view.name} · ${view.month}월 ${view.day}일`}
          {pair && <em>{`${pair.name}과 같은 고도`}</em>}
        </TermTag>

        <Headline key={animKey}>{view.headline}</Headline>

        <Note key={`${animKey}-reach`}>{view.sunlightReach}</Note>
      </Copy>

      <Controller>
        {}
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
              <StatValue key={`${animKey}-shadow`} data-lead="true">
                {Math.round(view.shadow)}
                <small>cm</small>
              </StatValue>
            </Stat>

            <Stat>
              <StatLabel>남중고도</StatLabel>
              <StatValue key={`${animKey}-altitude`}>
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
