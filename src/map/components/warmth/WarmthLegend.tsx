'use client';

import { useMemo } from 'react';
import styled from '@emotion/styled';
import { meok, surface } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/map/hooks/useMapStore';
import { filterWarmth } from '@/map/warmth/warmthRepo';
import {
  PERIOD_OPTIONS,
  filterByPeriod,
  moodStatOf,
  type WarmthPeriod,
} from '@/map/warmth/heatScale';
import { rampCss } from './HeatCanvas';
import type { WarmthFilter } from '@/map/types';

/**
 * 히트맵 범례 · 화면 요약 · 기간 창.
 *
 * 히트맵에 색을 칠해놓고 그 색이 무슨 뜻인지는 어디에도 적지 않았다.
 * 범례 없는 히트맵은 장식이지 데이터가 아니다.
 *
 * 겸사겸사 "지금 보고 있는 영역이 어떤가"를 한 줄로 요약한다.
 * 지도를 옮길 때마다 숫자가 따라 움직여서, 색이 실제로 데이터라는 것이 드러난다.
 */

const Root = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 16;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  width: max-content;
  max-width: calc(100vw - 32px);

  border-radius: 16px;
  background: ${surface.light.card};
  backdrop-filter: blur(16px);
  border: none;
  box-shadow: 0 6px 24px -4px rgba(0, 0, 0, 0.12);
  font-family: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    border: none;
    box-shadow: 0 6px 24px -4px rgba(0, 0, 0, 0.6);
  }

  /*
    모바일은 바텀시트(z 30)가 화면 아래 절반을 덮는다.
    범례를 상단 바(모드 토글 + 칩셋) 아래로 올려 시트에 가리지 않게 한다.
  */
  @media (max-width: 1023px) {
    left: 12px;
    right: auto;
    bottom: auto;
    top: 54px;
    padding: 8px 10px;
  }
`;

const Summary = styled.p`
  margin: 0;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.35;
  color: ${meok[900]};
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }

  b {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const Ramp = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

/*
  바탕색을 깔고 그 위에 램프를 얹는다.
  램프는 0에서만 완전히 투명하므로, 바탕이 그대로 비치는 자리는
  "한적한 곳"이 아니라 "집계가 없는 곳"을 뜻한다.
*/
const RampBar = styled.div<{ $gradient: string }>`
  height: 8px;
  border-radius: 2px;
  background-color: rgba(78, 89, 104, 0.1);
  background-image: ${({ $gradient }) => $gradient};

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const RampEnds = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 500;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const RampNote = styled.p`
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  color: ${meok[500]};
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(78, 89, 104, 0.12);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PeriodRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PeriodLabel = styled.span`
  margin-right: 2px;
  font-size: 11px;
  font-weight: 500;
  color: ${meok[500]};
`;

const PeriodBtn = styled.button<{ $active: boolean }>`
  padding: 3px 9px;
  border-radius: 9999px;
  border: none;

  background: ${({ $active }) => ($active ? meok[900] : 'rgba(78, 89, 104, 0.08)')};
  color: ${({ $active }) => ($active ? surface.light.card : meok[700])};
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? meok[900] : 'rgba(78, 89, 104, 0.16)')};
  }

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: 2px;
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? meok[100] : 'rgba(255, 255, 255, 0.1)')};
    color: ${({ $active }) => ($active ? meok[900] : meok[400])};
  }
`;

export default function WarmthLegend() {
  const mode = useMapStore((s) => s.mode);
  const warmths = useMapStore((s) => s.warmths);
  const category = useMapStore((s) => s.category);
  const period = useMapStore((s) => s.warmthPeriod);
  const setPeriod = useMapStore((s) => s.setWarmthPeriod);
  const map = useMapStore((s) => s.map);
  const center = useMapStore((s) => s.center);
  const level = useMapStore((s) => s.level);

  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  /*
    화면 안 온기만 센다.
    center·level을 의존성에 두어 지도를 움직일 때마다 다시 센다 —
    숫자가 따라 움직이는 것이 이 요약의 전부다.
  */
  const stat = useMemo(() => {
    const scoped = filterWarmth(
      filterByPeriod(warmths, period),
      (category ?? 'all') as WarmthFilter,
    );

    const bounds = map?.getBounds?.();
    if (!bounds || !window.kakao?.maps) return moodStatOf(scoped);

    return moodStatOf(
      scoped.filter((w) => bounds.contain(new window.kakao.maps.LatLng(w.lat, w.lng))),
    );
    // center/level은 값 자체를 쓰진 않지만, 지도가 움직였다는 신호로 필요하다.
  }, [warmths, period, category, map, center, level]);

  if (mode !== 'warmth') return null;

  const percent = stat.ratio === null ? null : Math.round(stat.ratio * 100);

  return (
    <Root aria-label="온기 히트맵 범례">
      <Summary aria-live="polite">
        {stat.total === 0 ? (
          '이 일대에 남은 한줄평이 아직 없습니다'
        ) : (
          <>
            이 일대 한줄평 <b>{stat.total}</b>편 · 고즈넉함 <b>{100 - (percent ?? 0)}%</b> · 북적이는 정{' '}
            <b>{percent}%</b>
          </>
        )}
      </Summary>

      <Ramp
        role="img"
        aria-label="히트맵 눈금. 칠하지 않은 곳이 한적하고, 진한 자국일수록 붐빈다"
      >
        <RampBar $gradient={rampCss(isDark)} />
        <RampEnds>
          <span>한적</span>
          <span>붐빔</span>
        </RampEnds>
        <RampNote>아무 색도 없는 곳은 아직 집계가 닿지 않은 곳입니다.</RampNote>
      </Ramp>

      <Divider />

      <PeriodRow role="group" aria-label="온기 기간">
        <PeriodLabel>기간</PeriodLabel>
        {PERIOD_OPTIONS.map((option) => (
          <PeriodBtn
            key={option.id}
            type="button"
            aria-pressed={period === option.id}
            $active={period === option.id}
            onClick={() => setPeriod(option.id as WarmthPeriod)}
          >
            {option.label}
          </PeriodBtn>
        ))}
      </PeriodRow>
    </Root>
  );
}
