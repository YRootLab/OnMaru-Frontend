'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { BEAT_RANGES } from '@/scroll-core/constants';
import { useSeasonStore } from '@/scroll-core/seasonStore';
import useUserLocation from '@/hooks/useUserLocation';
import SOLAR_TERMS from '@/data/solarTerms.json';
import {
  altitudeToSeasonValue,
  getNoonSolarAltitude,
  seasonValueToAltitude,
  solarTermDate,
} from '@/utils/solar';

import { clamp01, easeOut, usePrefersReducedMotion } from './BeatFrame';

export const RANGE = BEAT_RANGES.BEAT3;

const [START, END] = RANGE;

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * 위치 권한은 이 지점을 지날 때 한 번만 묻는다.
 * 첫 화면에서 팝업이 뜨면 무슨 사이트인지 알기도 전에 나간다.
 */
const ASK_LOCATION_AT = 0.1;

/** 한 화면 폭의 절반을 끌면 하지에서 동지까지 간다. */
const DRAG_SPAN = 0.5;

/** 이만큼 벌어져야 "오늘로 돌아가기"가 뜬다. */
const AWAY_FROM_TODAY = 0.04;

const RETURN_MS = 600;

// ─────────────────────────────────────────
// 카피 — seasonValue 0 하지 ~ 1 동지
// ─────────────────────────────────────────

const SUMMER_EDGE = 0.22;
const WINTER_EDGE = 0.78;

const headlineFor = (season) => {
  if (season <= SUMMER_EDGE) return '하지. 볕이 마루에 닿지 않습니다.';
  if (season >= WINTER_EDGE) return '동지. 방 안 깊숙이 볕이 듭니다.';
  return '처마는, 계절별 태양의 고도를 계산했습니다.';
};

/**
 * 고도는 위도에서 나온다.
 * 서울(37.57°)이면 스펙에 적힌 76° / 29°가 그대로 나오고, 다른 지역이면 그 지역 값이 나온다.
 */
const descFor = (season, summerAltitude, winterAltitude) => {
  if (season <= SUMMER_EDGE) {
    return `태양 고도 ${summerAltitude}°. 높게 뜬 볕을 처마가 막아냅니다.`;
  }
  if (season >= WINTER_EDGE) {
    return `태양 고도 ${winterAltitude}°. 낮게 기운 볕이 방 구석까지 닿습니다.`;
  }
  return '처마 길이는 그 집이 선 위도의 함수입니다.';
};

const formatDate = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

/**
 * 사이드바에서 절기를 눌러 들어온 경우(?solar=ipchu).
 *
 * next/navigation의 useSearchParams는 이 페이지 전체를 Suspense로 감싸게 만든다.
 * 읽는 값이 하나뿐이라 location에서 직접 꺼낸다.
 */
function useSolarTermParam() {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;

    const id = new URLSearchParams(window.location.search).get('solar');
    return id ? SOLAR_TERMS.find((term) => term.id === id) || null : null;
  }, []);
}

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

const pingpong = keyframes`
  0%, 100% { transform: translateX(-10px); }
  50%      { transform: translateX(10px); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(232, 90, 24, 0.6), 0 0 24px rgba(245, 166, 35, 0.4); }
  50%      { box-shadow: 0 0 20px rgba(232, 90, 24, 0.9), 0 0 36px rgba(245, 166, 35, 0.8); }
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  font-family: ${FONT};
`;

/**
 * 데스크톱은 화면 위쪽, 모바일은 아래 45%.
 * 세로 화면에서는 한옥이 상단 55%를 다 쓰므로 글이 그 위에 겹치면 둘 다 안 읽힌다.
 */
const Copy = styled.div`
  position: absolute;
  top: clamp(5vh, 7vh, 9vh);
  left: 0;
  right: 0;
  z-index: 1;
  padding: 0 24px;
  text-align: center;
  pointer-events: none;

  @media (max-width: 767px) {
    top: 56vh;
  }
`;

const Eyebrow = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: #e85a18;
`;

const TodayLine = styled.p`
  margin: 10px 0 0;
  font-size: clamp(12px, 1.15vw, 14px);
  font-weight: 400;
  letter-spacing: 0.02em;
  color: #8b95a1;
`;

const FallbackNote = styled.span`
  color: #b0b8c1;
  font-size: 11px;
`;

const TermTag = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #e85a18;
`;

const Headline = styled.h2`
  margin: 14px 0 0;
  font-size: clamp(24px, 3.4vw, 42px);
  font-weight: 700;
  letter-spacing: -0.03em;
  word-break: keep-all;
  color: #191f28;
`;

const Description = styled.p`
  margin: 10px auto 0;
  max-width: 600px;
  font-size: 14px;
  font-weight: 400;
  color: #4e5968;
  line-height: 1.5;
  word-break: keep-all;
`;

const Controller = styled.div`
  position: absolute;
  bottom: 6vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: min(92vw, 480px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  pointer-events: auto;

  @media (max-width: 767px) {
    bottom: 3vh;
  }
`;

const Hint = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #4e5968;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(78, 89, 104, 0.16);
  backdrop-filter: blur(8px);
  padding: 4px 14px;
  border-radius: 20px;
  animation: ${pingpong} 1.8s ease-in-out infinite;
  transition: opacity 0.5s ease-out;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const BackToToday = styled.button`
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: #e85a18;
  padding: 6px 14px;
  border: 1px solid rgba(232, 90, 24, 0.3);
  border-radius: 9999px;
  background: transparent;
  cursor: pointer;
  animation: ${riseIn} 0.3s ease-out;
  transition: background 0.2s ease-out;

  &:hover {
    background: rgba(232, 90, 24, 0.08);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Track = styled.div`
  width: 100%;
  position: relative;
  height: 46px;
  background: rgba(28, 26, 23, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 23px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  cursor: ew-resize;
  touch-action: none;

  &:focus-visible {
    outline: 2px solid #e85a18;
    outline-offset: 3px;
  }
`;

const TrackLine = styled.div`
  position: absolute;
  left: 44px;
  right: 44px;
  height: 4px;
  background: linear-gradient(90deg, #f5a623 0%, #e85a18 100%);
  border-radius: 2px;
  opacity: 0.6;
`;

const TrackLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #e8e0d2;
  z-index: 1;
  user-select: none;
`;

const Knob = styled.div`
  position: absolute;
  top: 50%;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff 0%, #f5a623 60%, #e85a18 100%);
  cursor: grab;
  z-index: 2;
  animation: ${pulseGlow} 2s infinite ease-in-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─────────────────────────────────────────
// Beat3_Season
// ─────────────────────────────────────────

export default function Beat3_Season({ progress }) {
  const reduced = usePrefersReducedMotion();
  const { latitude, cityName, isDefault } = useUserLocation(progress >= ASK_LOCATION_AT);
  const setSeason = useSeasonStore((s) => s.setSeason);
  const term = useSolarTermParam();

  // 오늘의 볕. 위치가 늦게 오므로 위도가 바뀌면 다시 잡는다.
  const today = useMemo(() => {
    const date = new Date();
    const altitude = getNoonSolarAltitude(latitude, date);
    return { date, altitude, seasonValue: altitudeToSeasonValue(altitude, latitude) };
  }, [latitude]);

  // 절기로 들어왔다면 기준점은 오늘이 아니라 그 절기다.
  const termView = useMemo(() => {
    if (!term) return null;
    const date = solarTermDate(term);
    const altitude = getNoonSolarAltitude(latitude, date);
    return { date, altitude, seasonValue: altitudeToSeasonValue(altitude, latitude) };
  }, [term, latitude]);

  const baseSeason = termView ? termView.seasonValue : today.seasonValue;

  /**
   * null이면 아직 손대지 않은 상태다.
   * 기준값을 state에 복사해두면 위치가 늦게 도착할 때 그것을 다시 밀어넣을 effect가 필요해진다.
   * 손댄 값만 들고 있으면 그 동기화가 통째로 사라진다.
   */
  const [userSeason, setUserSeason] = useState(null);

  const seasonValue = userSeason ?? baseSeason;
  const hasUserDragged = userSeason !== null;

  const drag = useRef(null);
  const tween = useRef(0);

  // 고정 캔버스의 볕에 계절값을 넘긴다. 구간 밖에서는 놓아준다.
  const inRange = progress >= START && progress < END;

  useEffect(() => {
    setSeason(inRange ? seasonValue : null);
  }, [inRange, seasonValue, setSeason]);

  useEffect(
    () => () => {
      cancelAnimationFrame(tween.current);
      useSeasonStore.getState().setSeason(null);
    },
    [],
  );

  if (!inRange) return null;

  const summerAltitude = Math.round(seasonValueToAltitude(0, latitude));
  const winterAltitude = Math.round(seasonValueToAltitude(1, latitude));
  const currentAltitude = Math.round(seasonValueToAltitude(seasonValue, latitude));

  const moveTo = (value) => {
    cancelAnimationFrame(tween.current);
    setUserSeason(clamp01(value));
  };

  const start = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    cancelAnimationFrame(tween.current);
    drag.current = { x: event.clientX, season: seasonValue };
    setUserSeason(seasonValue);
  };

  const move = (event) => {
    if (!drag.current) return;
    const delta = (event.clientX - drag.current.x) / (window.innerWidth * DRAG_SPAN);
    setUserSeason(clamp01(drag.current.season + delta));
  };

  const end = () => {
    drag.current = null;
  };

  const onKeyDown = (event) => {
    const step = { ArrowLeft: -0.05, ArrowRight: 0.05 }[event.key];

    if (step !== undefined) {
      event.preventDefault();
      moveTo(seasonValue + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveTo(1);
    }
  };

  /** 기준점으로 0.6초에 걸쳐 돌아간다. 값이 튀면 그림자가 순간이동한다. */
  const returnToBase = () => {
    cancelAnimationFrame(tween.current);

    // 모션을 줄인 사용자에게는 애니메이션 자체가 방해다. 바로 놓는다.
    if (reduced) {
      setUserSeason(null);
      return;
    }

    const from = seasonValue;
    const startedAt = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - startedAt) / RETURN_MS);

      // 도착하면 손뗀 상태(null)로 되돌린다 — 이후 위치가 바뀌면 다시 따라간다.
      if (t < 1) {
        setUserSeason(from + (baseSeason - from) * easeOut(t));
        tween.current = requestAnimationFrame(step);
      } else {
        setUserSeason(null);
      }
    };

    tween.current = requestAnimationFrame(step);
  };

  const showReturn = hasUserDragged && Math.abs(seasonValue - baseSeason) > AWAY_FROM_TODAY;
  const headline = headlineFor(seasonValue);

  return (
    <Stage aria-label="계절 — 하지에서 동지까지">
      <Copy>
        <Eyebrow>SOLAR — 볕의 계산</Eyebrow>

        <TodayLine>
          {`${today.date.getFullYear()}년 ${formatDate(today.date)} · ${cityName} · 태양 고도 ${Math.round(
            today.altitude,
          )}°`}
          {isDefault && <FallbackNote> (위치 미허용 · 서울 기준)</FallbackNote>}
        </TodayLine>

        {termView && (
          <TermTag>{`${term.name} · ${formatDate(termView.date)}`}</TermTag>
        )}

        <Headline key={headline}>{headline}</Headline>
        <Description>
          {termView && !hasUserDragged
            ? term.copy
            : descFor(seasonValue, summerAltitude, winterAltitude)}
        </Description>
      </Copy>

      <Controller>
        <Hint style={{ opacity: hasUserDragged ? 0 : 1 }}>
          <span>←</span> ☀️ 드래그나 방향키로 태양의 고도와 처마 그림자를 확인해보세요 <span>→</span>
        </Hint>

        {showReturn && (
          <BackToToday type="button" onClick={returnToBase}>
            {termView ? `${term.name}로 돌아가기` : '오늘로 돌아가기'}
          </BackToToday>
        )}

        <Track
          tabIndex={0}
          role="slider"
          aria-label="계절 조절"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(seasonValue * 100)}
          aria-valuetext={`${seasonValue < 0.5 ? '여름' : '겨울'} 쪽, 태양 고도 ${currentAltitude}도`}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={onKeyDown}
        >
          <TrackLabel>☀️ 하지·여름</TrackLabel>
          <TrackLine />
          <Knob
            style={{ left: `calc(44px + (${seasonValue * 100}% * (100% - 88px) / 100))` }}
          />
          <TrackLabel>❄️ 동지·겨울</TrackLabel>
        </Track>
      </Controller>
    </Stage>
  );
}
